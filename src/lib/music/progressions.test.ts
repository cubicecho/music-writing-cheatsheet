import { describe, expect, it } from 'vitest';
import { parseNote } from './pitch';
import {
  chordPalette,
  findProgression,
  groupProgressions,
  PROGRESSIONS,
  realizeProgression,
  realizeSteps,
} from './progressions';
import { findFamily, SCALE_FAMILIES } from './scales';

const play = (tonic: string, familyId: string, progressionId: string, seventh = false) =>
  realizeProgression(parseNote(tonic)!, findFamily(familyId), findProgression(progressionId), seventh).map(
    ({ chord }) => chord.symbol,
  );

const numerals = (tonic: string, familyId: string, progressionId: string) =>
  realizeProgression(parseNote(tonic)!, findFamily(familyId), findProgression(progressionId)).map(
    ({ chord }) => chord.numeral,
  );

describe('realising a progression in a major key', () => {
  it('turns the four chords into the four chords', () => {
    expect(play('C', 'major', 'four-chords')).toEqual(['C', 'G', 'Am', 'F']);
    expect(numerals('C', 'major', 'four-chords')).toEqual(['I', 'V', 'vi', 'IV']);
  });

  it('follows the key, spelling G major’s progression with an F♯', () => {
    expect(play('G', 'major', 'doo-wop')).toEqual(['G', 'Em', 'C', 'D']);
    expect(play('E', 'major', 'three-chords')).toEqual(['E', 'A', 'B']);
    expect(play('Eb', 'major', 'four-chords')).toEqual(['E♭', 'B♭', 'Cm', 'A♭']);
  });

  it('lays the 12-bar blues out as twelve chords', () => {
    expect(play('A', 'major', 'twelve-bar')).toEqual(['A', 'A', 'A', 'A', 'D', 'D', 'A', 'A', 'E', 'D', 'A', 'E']);
  });

  it('gives ii–V–I its sevenths when they are asked for', () => {
    expect(play('C', 'major', 'two-five-one', true)).toEqual(['Dm7', 'G7', 'Cmaj7']);
  });
});

describe('realising a progression in a minor key', () => {
  it('builds the minor four chords on a minor tonic', () => {
    expect(play('A', 'natural-minor', 'minor-four')).toEqual(['Am', 'F', 'C', 'G']);
    expect(numerals('A', 'natural-minor', 'minor-four')).toEqual(['i', '♭VI', '♭III', '♭VII']);
  });

  it('walks the Andalusian cadence down to a major V', () => {
    expect(play('A', 'natural-minor', 'andalusian')).toEqual(['Am', 'G', 'F', 'E']);
    expect(numerals('A', 'natural-minor', 'andalusian')).toEqual(['i', '♭VII', '♭VI', 'V']);
  });

  it('gives the same four chords from the harmonic minor family, which spells two of them itself', () => {
    expect(play('A', 'harmonic-minor', 'andalusian')).toEqual(['Am', 'G', 'F', 'E']);
  });
});

describe('borrowed chords', () => {
  it('marks the ♭VII of rock as borrowed in a major key, and names where from', () => {
    const chords = realizeProgression(parseNote('D')!, findFamily('major'), findProgression('flat-seven-rock'));
    expect(chords.map(({ chord }) => chord.symbol)).toEqual(['D', 'C', 'G']);
    expect(chords.map(({ borrowedFrom }) => borrowedFrom?.id)).toEqual([undefined, 'natural-minor', undefined]);
  });

  it('marks the major V as borrowed in natural minor but not in harmonic minor, which contains it', () => {
    const inNatural = realizeProgression(
      parseNote('A')!,
      findFamily('natural-minor'),
      findProgression('minor-cadence'),
    );
    const inHarmonic = realizeProgression(
      parseNote('A')!,
      findFamily('harmonic-minor'),
      findProgression('minor-cadence'),
    );
    expect(inNatural.map(({ chord }) => chord.symbol)).toEqual(['Am', 'Dm', 'E', 'Am']);
    expect(inNatural[2]!.borrowedFrom?.id).toBe('harmonic-minor');
    expect(inHarmonic[2]!.borrowedFrom).toBeUndefined();
  });
});

describe('transplanting a progression into another scale', () => {
  it('keeps the shape and lets the scale decide the qualities', () => {
    // The same four degrees as the major-key original, heard from a minor scale.
    expect(play('A', 'natural-minor', 'four-chords')).toEqual(['Am', 'Em', 'F', 'Dm']);
    expect(numerals('A', 'natural-minor', 'four-chords')).toEqual(['i', 'v', '♭VI', 'iv']);
  });

  it('splits the catalogue into native and transplanted, losing nothing', () => {
    for (const family of SCALE_FAMILIES) {
      const { native, transplanted } = groupProgressions(family.id);
      expect(native.length + transplanted.length).toBe(PROGRESSIONS.length);
      expect(native.length).toBeGreaterThan(0);
    }
  });
});

describe('the progression data itself', () => {
  it('has unique ids and names', () => {
    expect(new Set(PROGRESSIONS.map((p) => p.id)).size).toBe(PROGRESSIONS.length);
    expect(new Set(PROGRESSIONS.map((p) => p.name)).size).toBe(PROGRESSIONS.length);
  });

  it('only ever refers to degrees and families that exist', () => {
    for (const progression of PROGRESSIONS) {
      expect(progression.steps.length).toBeGreaterThan(1);
      for (const familyId of progression.families) expect(() => findFamily(familyId)).not.toThrow();
      for (const { degree, borrowedFrom } of progression.steps) {
        expect(degree).toBeGreaterThanOrEqual(0);
        expect(degree).toBeLessThan(7);
        if (borrowedFrom !== undefined) expect(() => findFamily(borrowedFrom)).not.toThrow();
      }
    }
  });

  it('realises every progression in every family and key without producing an unnamed chord', () => {
    const unnamed: string[] = [];
    for (const family of SCALE_FAMILIES) {
      for (const progression of PROGRESSIONS) {
        for (const seventh of [false, true]) {
          for (const { chord } of realizeProgression(parseNote('C')!, family, progression, seventh)) {
            if (chord.unnamed) unnamed.push(`${family.id}/${progression.id}/${chord.symbol}`);
          }
        }
      }
    }
    expect(unnamed).toEqual([]);
  });

  it('realises a hand-built sequence the same way a catalogued one is realised', () => {
    const progression = findProgression('four-chords');
    const built = realizeSteps(parseNote('C')!, findFamily('major'), progression.steps);
    expect(built.map(({ chord }) => chord.symbol)).toEqual(play('C', 'major', 'four-chords'));
  });
});

describe('chordPalette', () => {
  it("offers the scale's own seven chords first, in degree order", () => {
    const { native } = chordPalette(parseNote('C')!, findFamily('major'));
    expect(native.map(({ chord }) => chord.symbol)).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']);
    expect(native.every(({ step }) => step.borrowedFrom === undefined)).toBe(true);
  });

  it('offers the chords major does not have, and none it does', () => {
    const { native, borrowed } = chordPalette(parseNote('C')!, findFamily('major'));
    const own = new Set(native.map(({ chord }) => chord.symbol));
    for (const entry of borrowed) {
      expect(own.has(entry.chord.symbol)).toBe(false);
      expect(entry.borrowedFrom).toBeDefined();
    }
    // The minor iv and the ♭VII are the two every writer reaches for first.
    expect(borrowed.map(({ chord }) => chord.symbol)).toContain('Fm');
    expect(borrowed.map(({ chord }) => chord.symbol)).toContain('B♭');
  });

  it('never offers the same chord twice', () => {
    for (const family of SCALE_FAMILIES) {
      for (const seventh of [false, true]) {
        const { native, borrowed } = chordPalette(parseNote('C')!, family, seventh);
        const symbols = [...native, ...borrowed].map(({ chord }) => chord.symbol);
        expect(new Set(symbols).size).toBe(symbols.length);
      }
    }
  });

  it('replays a palette entry as the chord it advertised', () => {
    const family = findFamily('natural-minor');
    const { borrowed } = chordPalette(parseNote('A')!, family);
    for (const entry of borrowed) {
      const [played] = realizeSteps(parseNote('A')!, family, [entry.step]);
      expect(played!.chord.symbol).toBe(entry.chord.symbol);
    }
  });
});
