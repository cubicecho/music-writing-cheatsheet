import { describe, expect, it } from 'vitest';
import { formatNoteAscii, parseNote } from './pitch';
import {
  buildMode,
  buildScale,
  findFamily,
  parallelKey,
  relativeKey,
  relativeMode,
  rotateIntervals,
  SCALE_FAMILIES,
} from './scales';

const spell = (scale: { degrees: { note: Parameters<typeof formatNoteAscii>[0] }[] }) =>
  scale.degrees.map((degree) => formatNoteAscii(degree.note));

describe('the family data itself', () => {
  it('gives every family seven ascending degrees inside one octave', () => {
    for (const family of SCALE_FAMILIES) {
      expect(family.intervals).toHaveLength(7);
      expect(family.intervals[0]).toBe(0);
      for (let i = 1; i < family.intervals.length; i += 1) {
        expect(family.intervals[i]).toBeGreaterThan(family.intervals[i - 1]!);
      }
      expect(family.intervals.at(-1)).toBeLessThan(12);
    }
  });

  it('gives every family one mode per degree, in order, with unique ids', () => {
    const ids = new Set<string>();
    for (const family of SCALE_FAMILIES) {
      expect(family.modes.map((mode) => mode.degree)).toEqual([1, 2, 3, 4, 5, 6, 7]);
      for (const mode of family.modes) ids.add(`${family.id}/${mode.id}`);
    }
    expect(ids.size).toBe(SCALE_FAMILIES.length * 7);
  });
});

describe('rotateIntervals', () => {
  it('turns the major scale into its modes', () => {
    const major = findFamily('major').intervals;
    expect(rotateIntervals(major, 0)).toEqual(major);
    expect(rotateIntervals(major, 1)).toEqual([0, 2, 3, 5, 7, 9, 10]); // Dorian
    expect(rotateIntervals(major, 5)).toEqual([0, 2, 3, 5, 7, 8, 10]); // Aeolian
    expect(rotateIntervals(major, 6)).toEqual([0, 1, 3, 5, 6, 8, 10]); // Locrian
  });
});

describe('buildScale', () => {
  it('spells C major with no accidentals', () => {
    expect(spell(buildScale(parseNote('C')!, findFamily('major').intervals))).toEqual([
      'C',
      'D',
      'E',
      'F',
      'G',
      'A',
      'B',
    ]);
  });

  it('spells F♯ major with six sharps and an E♯', () => {
    expect(spell(buildScale(parseNote('F#')!, findFamily('major').intervals))).toEqual([
      'F#',
      'G#',
      'A#',
      'B',
      'C#',
      'D#',
      'E#',
    ]);
  });

  it('spells E♭ major with three flats', () => {
    expect(spell(buildScale(parseNote('Eb')!, findFamily('major').intervals))).toEqual([
      'Eb',
      'F',
      'G',
      'Ab',
      'Bb',
      'C',
      'D',
    ]);
  });

  it('reports the step pattern, wrapping the last degree to the octave', () => {
    const scale = buildScale(parseNote('C')!, findFamily('major').intervals);
    expect(scale.degrees.map((degree) => degree.stepToNext)).toEqual([2, 2, 1, 2, 2, 2, 1]);
  });

  it('keeps the augmented 2nd of harmonic minor as an augmented 2nd', () => {
    const scale = buildScale(parseNote('A')!, findFamily('harmonic-minor').intervals);
    expect(spell(scale)).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G#']);
    expect(scale.degrees.map((degree) => degree.stepToNext)).toEqual([2, 1, 2, 2, 1, 3, 1]);
  });
});

describe('natural minor', () => {
  it('is the major scale rotated to its 6th, not a separate set of notes', () => {
    expect(findFamily('natural-minor').intervals).toEqual(rotateIntervals(findFamily('major').intervals, 5));
  });

  it('spells C natural minor with the three flats of its relative major', () => {
    expect(spell(buildScale(parseNote('C')!, findFamily('natural-minor').intervals))).toEqual([
      'C',
      'D',
      'Eb',
      'F',
      'G',
      'Ab',
      'Bb',
    ]);
  });

  it('lines its modes up with the major ones, offset by five degrees', () => {
    const major = findFamily('major');
    const minor = findFamily('natural-minor');
    for (let index = 0; index < 7; index += 1) {
      expect(rotateIntervals(minor.intervals, index)).toEqual(rotateIntervals(major.intervals, (index + 5) % 7));
      expect(minor.modes[index]!.name).toBe(major.modes[(index + 5) % 7]!.name);
    }
  });
});

describe('buildMode', () => {
  it('builds a mode on the root it is given — D Dorian has no accidentals', () => {
    expect(spell(buildMode(parseNote('D')!, findFamily('major'), 1))).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
  });

  it('builds the parallel mode, which does have accidentals — C Dorian has two flats', () => {
    expect(spell(buildMode(parseNote('C')!, findFamily('major'), 1))).toEqual(['C', 'D', 'Eb', 'F', 'G', 'A', 'Bb']);
  });
});

describe('relativeMode', () => {
  it('keeps the notes of the key and moves the root', () => {
    const family = findFamily('major');
    const key = parseNote('C')!;
    expect(spell(relativeMode(key, family, 1))).toEqual(['D', 'E', 'F', 'G', 'A', 'B', 'C']);
    expect(spell(relativeMode(key, family, 5))).toEqual(['A', 'B', 'C', 'D', 'E', 'F', 'G']);
  });

  it('holds for a key with accidentals — every relative mode of E♭ major has the same three flats', () => {
    const family = findFamily('major');
    const key = parseNote('Eb')!;
    for (let index = 0; index < 7; index += 1) {
      const notes = spell(relativeMode(key, family, index)).sort();
      expect(notes).toEqual(['Ab', 'Bb', 'C', 'D', 'Eb', 'F', 'G']);
    }
  });
});

describe('relative and parallel keys', () => {
  const spellOf = (note: ReturnType<typeof parseNote>) => formatNoteAscii(note!);

  it('sends C major to A natural minor and back again', () => {
    const minor = relativeKey(parseNote('C')!, findFamily('major'))!;
    expect(spellOf(minor.tonic)).toBe('A');
    expect(minor.family.id).toBe('natural-minor');

    const major = relativeKey(minor.tonic, minor.family)!;
    expect(spellOf(major.tonic)).toBe('C');
    expect(major.family.id).toBe('major');
  });

  it('keeps the key signature, which is the whole point of a relative key', () => {
    for (const spelling of ['C', 'G', 'F', 'Eb', 'F#', 'Bb']) {
      const tonic = parseNote(spelling)!;
      const major = findFamily('major');
      const minor = relativeKey(tonic, major)!;
      const notesOf = (scale: ReturnType<typeof buildScale>) =>
        scale.degrees.map((degree) => formatNoteAscii(degree.note)).sort();
      expect(notesOf(buildScale(minor.tonic, minor.family.intervals))).toEqual(
        notesOf(buildScale(tonic, major.intervals)),
      );
    }
  });

  it('holds the root and swaps the notes for a parallel key', () => {
    const parallel = parallelKey(parseNote('C')!, findFamily('major'))!;
    expect(spellOf(parallel.tonic)).toBe('C');
    expect(parallel.family.id).toBe('natural-minor');
  });

  it('gives every family a parallel, and a relative only where one exists', () => {
    for (const family of SCALE_FAMILIES) {
      expect(parallelKey(parseNote('C')!, family)).toBeDefined();
    }
    expect(relativeKey(parseNote('C')!, findFamily('harmonic-minor'))).toBeUndefined();
    expect(relativeKey(parseNote('C')!, findFamily('melodic-minor'))).toBeUndefined();
    expect(relativeKey(parseNote('C')!, findFamily('harmonic-major'))).toBeUndefined();
  });
});
