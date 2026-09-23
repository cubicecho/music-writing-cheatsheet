import { describe, expect, it } from 'vitest';
import { chordsForFamily, chordsInScale } from './chords';
import { formatNoteAscii, parseNote } from './pitch';
import {
  buildMode,
  familyScale,
  findFamily,
  GAPPED_FAMILIES,
  harmonicHome,
  isGapped,
  letterSteps,
  parallelKey,
  relativeKey,
  relativeMode,
  SCALE_FAMILIES,
} from './scales';

const spell = (scale: { degrees: { note: Parameters<typeof formatNoteAscii>[0] }[] }) =>
  scale.degrees.map((degree) => formatNoteAscii(degree.note));

const note = (name: string) => parseNote(name)!;

describe('the gapped family data itself', () => {
  it('keeps them out of the seven-note families, and findable by id', () => {
    for (const family of GAPPED_FAMILIES) {
      expect(SCALE_FAMILIES).not.toContain(family);
      expect(findFamily(family.id)).toBe(family);
      expect(isGapped(family)).toBe(true);
    }
    for (const family of SCALE_FAMILIES) expect(isGapped(family)).toBe(false);
  });

  it('gives each one a letter per degree, never going back down, and a seven-note home', () => {
    for (const family of GAPPED_FAMILIES) {
      const letters = letterSteps(family);
      expect(letters).toHaveLength(family.intervals.length);
      expect(letters[0]).toBe(0);
      for (let i = 1; i < letters.length; i += 1) expect(letters[i]).toBeGreaterThanOrEqual(letters[i - 1]!);
      expect(harmonicHome(family).intervals).toHaveLength(7);
    }
  });

  it('says every mode is a real rotation of its family', () => {
    for (const family of GAPPED_FAMILIES) {
      for (const mode of family.modes) {
        expect(mode.degree).toBeGreaterThanOrEqual(1);
        expect(mode.degree).toBeLessThanOrEqual(family.intervals.length);
        // A mode that shares an id with a family is that family, note for note.
        const named = GAPPED_FAMILIES.find((candidate) => candidate.id === mode.id);
        if (named) {
          expect(spell(buildMode(note('C'), family, mode.degree - 1))).toEqual(spell(familyScale(note('C'), named)));
        }
      }
    }
  });
});

describe('spelling', () => {
  it('spells C major pentatonic without the 4th and 7th', () => {
    expect(spell(familyScale(note('C'), findFamily('major-pentatonic')))).toEqual(['C', 'D', 'E', 'G', 'A']);
  });

  it('spells A minor pentatonic without the 2nd and 6th', () => {
    expect(spell(familyScale(note('A'), findFamily('minor-pentatonic')))).toEqual(['A', 'C', 'D', 'E', 'G']);
  });

  it('spells the blue note of C blues as Gb beside G, a diminished 5th', () => {
    const scale = familyScale(note('C'), findFamily('blues'));
    expect(spell(scale)).toEqual(['C', 'Eb', 'F', 'Gb', 'G', 'Bb']);
    expect(scale.degrees[3]!.interval.degree).toBe('♭5');
  });

  it('spells the flat 3rd of C major blues as Eb beside E', () => {
    expect(spell(familyScale(note('C'), findFamily('major-blues')))).toEqual(['C', 'D', 'Eb', 'E', 'G', 'A']);
  });

  it('spells E blues in sharps and flats that each stay on their own letter', () => {
    expect(spell(familyScale(note('E'), findFamily('blues')))).toEqual(['E', 'G', 'A', 'Bb', 'B', 'D']);
  });

  it('spells the Egyptian mode of C major pentatonic from D', () => {
    expect(spell(relativeMode(note('C'), findFamily('major-pentatonic'), 1))).toEqual(['D', 'E', 'G', 'A', 'C']);
  });
});

describe('related keys', () => {
  it('makes A minor pentatonic the relative of C major pentatonic, and back', () => {
    const relative = relativeKey(note('C'), findFamily('major-pentatonic'))!;
    expect(formatNoteAscii(relative.tonic)).toBe('A');
    expect(relative.family.id).toBe('minor-pentatonic');

    const back = relativeKey(note('A'), findFamily('minor-pentatonic'))!;
    expect(formatNoteAscii(back.tonic)).toBe('C');
    expect(back.family.id).toBe('major-pentatonic');
  });

  it('makes Eb major blues the relative of C blues — the same six notes', () => {
    const relative = relativeKey(note('C'), findFamily('blues'))!;
    expect(formatNoteAscii(relative.tonic)).toBe('Eb');
    expect(relative.family.id).toBe('major-blues');
    expect(new Set(spell(familyScale(relative.tonic, relative.family)))).toEqual(
      new Set(spell(familyScale(note('C'), findFamily('blues')))),
    );
    expect(formatNoteAscii(relativeKey(note('Eb'), findFamily('major-blues'))!.tonic)).toBe('C');
  });

  it('pairs the major and minor shapes as parallels', () => {
    expect(parallelKey(note('C'), findFamily('major-pentatonic'))!.family.id).toBe('minor-pentatonic');
    expect(parallelKey(note('C'), findFamily('blues'))!.family.id).toBe('major-blues');
  });
});

describe('chords for a gapped scale', () => {
  it('plays a pentatonic over its home key', () => {
    const symbols = (chords: { symbol: string }[]) => chords.map((chord) => chord.symbol);
    expect(symbols(chordsForFamily(note('A'), findFamily('minor-pentatonic')))).toEqual(
      symbols(chordsInScale(familyScale(note('A'), findFamily('natural-minor')))),
    );
  });

  it('plays C blues over C7, F7 and G7', () => {
    const chords = chordsForFamily(note('C'), findFamily('blues'), true);
    expect(chords.map((chord) => chord.symbol)).toEqual(['C7', 'F7', 'G7']);
    expect(chords.map((chord) => chord.numeral)).toEqual(['I', 'IV', 'V']);
  });

  it('plays the blues as plain major triads with 7ths off', () => {
    expect(chordsForFamily(note('Bb'), findFamily('major-blues')).map((chord) => chord.symbol)).toEqual([
      'B♭',
      'E♭',
      'F',
    ]);
  });

  it('leaves a seven-note family its own stacked thirds', () => {
    expect(chordsForFamily(note('C'), findFamily('major')).map((chord) => chord.numeral)).toEqual([
      'I',
      'ii',
      'iii',
      'IV',
      'V',
      'vi',
      'vii°',
    ]);
  });
});
