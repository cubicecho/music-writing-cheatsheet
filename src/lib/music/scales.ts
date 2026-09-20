/**
 * Scale families, and the modes that are rotations of them.
 *
 * Everything here is a seven-note family on purpose. Seven notes is what makes the rest of the
 * cheatsheet work: one note per letter, so the spelling is decided; a chord on every degree, so
 * the chord table has seven rows; and a rotation for every degree, so "the modes" is a list and
 * not a special case. Pentatonic and blues scales belong here eventually, but they break both the
 * spelling rule and the stack-of-thirds rule, so they are their own piece of work.
 */

import { describeInterval, type Interval } from './intervals';
import { mod, type Note, spellDegree } from './pitch';

export type Mode = {
  id: string;
  name: string;
  /** Which degree of the parent family this mode starts on, 1-based. */
  degree: number;
  /** The other name players know it by, where there is one. */
  aka?: string;
  /** One line on what it sounds like and what it is for. */
  character: string;
};

export type ScaleFamily = {
  id: string;
  name: string;
  /** Semitones above the tonic for each of the seven degrees, ascending from 0. */
  intervals: number[];
  description: string;
  modes: Mode[];
  /**
   * The key built on one of this family's own degrees that contains exactly the same notes.
   * Only major and natural minor have one — it is the relative major/minor relationship, and
   * the other families are not anybody's relative.
   */
  relative?: { familyId: string; degree: number };
  /** The family on the *same* root this one is most usefully heard against. */
  parallel?: string;
};

export const SCALE_FAMILIES: ScaleFamily[] = [
  {
    id: 'major',
    name: 'Major',
    intervals: [0, 2, 4, 5, 7, 9, 11],
    description: 'The diatonic scale. Its seven rotations are the modes everything else is described against.',
    relative: { familyId: 'natural-minor', degree: 5 },
    parallel: 'natural-minor',
    modes: [
      {
        id: 'ionian',
        name: 'Ionian',
        degree: 1,
        aka: 'Major',
        character: 'The bright, settled one. Every other mode is heard as a bend away from this.',
      },
      {
        id: 'dorian',
        name: 'Dorian',
        degree: 2,
        character: 'Minor with a major 6th — the hopeful minor. Funk, modal jazz, most of Santana.',
      },
      {
        id: 'phrygian',
        name: 'Phrygian',
        degree: 3,
        character: 'Minor with a ♭2. The flamenco and metal mode; the half step over the root is the whole sound.',
      },
      {
        id: 'lydian',
        name: 'Lydian',
        degree: 4,
        character: 'Major with a ♯4. Floating and unresolved — film scores reach for it constantly.',
      },
      {
        id: 'mixolydian',
        name: 'Mixolydian',
        degree: 5,
        character: 'Major with a ♭7. The dominant-7th mode: blues, rock and anything built on a I7.',
      },
      {
        id: 'aeolian',
        name: 'Aeolian',
        degree: 6,
        aka: 'Natural minor',
        character: 'The default minor. Dark without being exotic.',
      },
      {
        id: 'locrian',
        name: 'Locrian',
        degree: 7,
        character: 'A ♭2 and a ♭5, so the tonic chord is diminished. Almost never a key — usually a passing colour.',
      },
    ],
  },
  {
    id: 'natural-minor',
    name: 'Natural minor',
    intervals: [0, 2, 3, 5, 7, 8, 10],
    description:
      'The major scale started from its 6th, and what most songs mean by a minor key. No leading tone, so the v chord is minor and nothing drags you back to the root — you go there because you want to.',
    relative: { familyId: 'major', degree: 2 },
    parallel: 'major',
    modes: [
      {
        id: 'aeolian',
        name: 'Aeolian',
        degree: 1,
        aka: 'Natural minor',
        character: 'The default minor. Dark without being exotic.',
      },
      {
        id: 'locrian',
        name: 'Locrian',
        degree: 2,
        character: 'A ♭2 and a ♭5, so the tonic chord is diminished. Almost never a key — usually a passing colour.',
      },
      {
        id: 'ionian',
        name: 'Ionian',
        degree: 3,
        aka: 'Major',
        character: 'The relative major: the same seven notes, heard from the bright end.',
      },
      {
        id: 'dorian',
        name: 'Dorian',
        degree: 4,
        character: 'Minor with a major 6th — the hopeful minor. Funk, modal jazz, most of Santana.',
      },
      {
        id: 'phrygian',
        name: 'Phrygian',
        degree: 5,
        character: 'Minor with a ♭2. The flamenco and metal mode; the half step over the root is the whole sound.',
      },
      {
        id: 'lydian',
        name: 'Lydian',
        degree: 6,
        character: 'Major with a ♯4. Floating and unresolved — film scores reach for it constantly.',
      },
      {
        id: 'mixolydian',
        name: 'Mixolydian',
        degree: 7,
        character: 'Major with a ♭7. The dominant-7th mode: blues, rock and anything built on a I7.',
      },
    ],
  },
  {
    id: 'harmonic-minor',
    name: 'Harmonic minor',
    intervals: [0, 2, 3, 5, 7, 8, 11],
    description:
      'Natural minor with the 7th raised back up, so the V chord is major and actually pulls home. The augmented 2nd it leaves between ♭6 and 7 is the flavour.',
    parallel: 'natural-minor',
    modes: [
      {
        id: 'harmonic-minor',
        name: 'Harmonic minor',
        degree: 1,
        character: 'Minor with a leading tone. The dominant resolves properly, at the cost of a gap in the scale.',
      },
      {
        id: 'locrian-natural-6',
        name: 'Locrian ♮6',
        degree: 2,
        character: 'Locrian with the 6th restored — a half-diminished sound with more air in it.',
      },
      {
        id: 'ionian-sharp-5',
        name: 'Ionian ♯5',
        degree: 3,
        aka: 'Augmented major',
        character: 'Major over an augmented triad. Unstable on purpose.',
      },
      {
        id: 'dorian-sharp-4',
        name: 'Dorian ♯4',
        degree: 4,
        aka: 'Ukrainian Dorian',
        character: 'Dorian with a raised 4th. Klezmer and Eastern European folk live here.',
      },
      {
        id: 'phrygian-dominant',
        name: 'Phrygian dominant',
        degree: 5,
        aka: 'Spanish / Freygish',
        character: 'The famous one: a major triad with a ♭2 and ♭6 over it. Flamenco, surf, metal.',
      },
      {
        id: 'lydian-sharp-2',
        name: 'Lydian ♯2',
        degree: 6,
        character: 'Lydian with an augmented 2nd. Bright and jagged at the same time.',
      },
      {
        id: 'altered-diminished',
        name: 'Altered diminished',
        degree: 7,
        aka: 'Super-Locrian ♭♭7',
        character: 'A diminished 7th chord with tensions. Almost purely a passing sound.',
      },
    ],
  },
  {
    id: 'melodic-minor',
    name: 'Melodic minor',
    intervals: [0, 2, 3, 5, 7, 9, 11],
    description:
      'Minor with both the 6th and 7th raised — the gap of harmonic minor closed up. Ascending form only; jazz treats it as a scale in its own right.',
    parallel: 'natural-minor',
    modes: [
      {
        id: 'melodic-minor',
        name: 'Melodic minor',
        degree: 1,
        aka: 'Jazz minor',
        character: 'A major scale with a ♭3, which is exactly how it sounds: minor tonic, major everything else.',
      },
      {
        id: 'dorian-flat-2',
        name: 'Dorian ♭2',
        degree: 2,
        aka: 'Phrygian ♮6',
        character: 'Phrygian with a major 6th. A sus♭9 sound.',
      },
      {
        id: 'lydian-augmented',
        name: 'Lydian augmented',
        degree: 3,
        character: 'A ♯4 and a ♯5 together — the most weightless scale in the set.',
      },
      {
        id: 'lydian-dominant',
        name: 'Lydian dominant',
        degree: 4,
        aka: 'Acoustic / Overtone',
        character: 'A ♯4 and a ♭7. What the harmonic series actually gives you, and the standard ♯11 sound.',
      },
      {
        id: 'mixolydian-flat-6',
        name: 'Mixolydian ♭6',
        degree: 5,
        aka: 'Aeolian dominant',
        character: 'A dominant chord on its way somewhere minor.',
      },
      {
        id: 'locrian-natural-2',
        name: 'Locrian ♮2',
        degree: 6,
        aka: 'Half-diminished',
        character: 'The scale for a m7♭5 chord — Locrian with a 9th you can actually play.',
      },
      {
        id: 'altered',
        name: 'Altered',
        degree: 7,
        aka: 'Super-Locrian / Diminished whole-tone',
        character: 'Every tension a dominant can take, all at once. The jazz turnaround scale.',
      },
    ],
  },
  {
    id: 'harmonic-major',
    name: 'Harmonic major',
    intervals: [0, 2, 4, 5, 7, 8, 11],
    description: 'Major with a ♭6. Borrows the pull of the minor subdominant without giving up the major 3rd.',
    parallel: 'major',
    modes: [
      {
        id: 'harmonic-major',
        name: 'Harmonic major',
        degree: 1,
        character: 'Major, shaded. The iv and ♭VI chords it hands you are the reason to use it.',
      },
      {
        id: 'dorian-flat-5',
        name: 'Dorian ♭5',
        degree: 2,
        character: 'A m7♭5 scale with a natural 6th above it.',
      },
      {
        id: 'phrygian-flat-4',
        name: 'Phrygian ♭4',
        degree: 3,
        character: 'Phrygian with the 4th lowered — a diminished-triad tonic with a dark top.',
      },
      {
        id: 'lydian-flat-3',
        name: 'Lydian ♭3',
        degree: 4,
        aka: 'Melodic minor ♯4',
        character: 'Minor tonic, raised 4th, major 7th. Sharp-edged and unresolved.',
      },
      {
        id: 'mixolydian-flat-2',
        name: 'Mixolydian ♭2',
        degree: 5,
        character: 'A dominant chord with a ♭9 and nothing else altered.',
      },
      {
        id: 'lydian-augmented-sharp-2',
        name: 'Lydian augmented ♯2',
        degree: 6,
        character: 'Lydian augmented with the 2nd raised as well. Rare, and it shows.',
      },
      {
        id: 'locrian-double-flat-7',
        name: 'Locrian 𝄫7',
        degree: 7,
        character: 'A diminished 7th chord spelled from a major parent. A passing sound.',
      },
    ],
  },
];

export function findFamily(id: string): ScaleFamily {
  const family = SCALE_FAMILIES.find((candidate) => candidate.id === id);
  if (!family) throw new Error(`No scale family "${id}"`);
  return family;
}

/**
 * The intervals of a family rotated to start on one of its degrees.
 *
 * `modeIndex` is 0-based: 0 leaves the family alone, 5 is Aeolian in the major family.
 */
export function rotateIntervals(intervals: number[], modeIndex: number): number[] {
  const size = intervals.length;
  const offset = intervals[mod(modeIndex, size)]!;
  return intervals.map((_, step) => {
    const source = intervals[mod(modeIndex + step, size)]!;
    return mod(source - offset, 12);
  });
}

export type ScaleDegree = {
  note: Note;
  interval: Interval;
  /** Semitones from this degree up to the next one — the scale's step pattern. */
  stepToNext: number;
};

export type Scale = {
  tonic: Note;
  /** Semitones above the tonic, ascending from 0. */
  intervals: number[];
  degrees: ScaleDegree[];
};

/** Builds a spelled scale on `tonic` from a list of semitone offsets. */
export function buildScale(tonic: Note, intervals: number[]): Scale {
  const degrees = intervals.map((semitones, step) => {
    const next = intervals[step + 1] ?? 12;
    return {
      note: spellDegree(tonic, step, semitones),
      interval: describeInterval(step, semitones),
      stepToNext: next - semitones,
    };
  });
  return { tonic, intervals, degrees };
}

/** Builds the scale of one mode of a family, rooted on `tonic`. */
export function buildMode(tonic: Note, family: ScaleFamily, modeIndex: number): Scale {
  return buildScale(tonic, rotateIntervals(family.intervals, modeIndex));
}

/**
 * The same seven notes as the key, but started from a different degree — which is what a player
 * means by "the modes of this key", as opposed to the parallel modes built on one root.
 */
export function relativeMode(keyTonic: Note, family: ScaleFamily, modeIndex: number): Scale {
  const offset = family.intervals[mod(modeIndex, family.intervals.length)]!;
  const modeTonic = spellDegree(keyTonic, modeIndex, offset);
  return buildScale(modeTonic, rotateIntervals(family.intervals, modeIndex));
}

export type RelatedKey = { tonic: Note; family: ScaleFamily };

/** The same seven notes, resting on a different tonic — C major and A natural minor. */
export function relativeKey(tonic: Note, family: ScaleFamily): RelatedKey | undefined {
  if (family.relative === undefined) return undefined;
  const { familyId, degree } = family.relative;
  return { tonic: spellDegree(tonic, degree, family.intervals[degree]!), family: findFamily(familyId) };
}

/** The same root, different notes — C major and C natural minor. */
export function parallelKey(tonic: Note, family: ScaleFamily): RelatedKey | undefined {
  if (family.parallel === undefined) return undefined;
  return { tonic, family: findFamily(family.parallel) };
}
