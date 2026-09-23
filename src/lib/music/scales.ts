/**
 * Scale families, and the modes that are rotations of them.
 *
 * `SCALE_FAMILIES` is seven-note families only, on purpose. Seven notes is what makes the rest of
 * the cheatsheet work: one note per letter, so the spelling is decided; a chord on every degree,
 * so the chord table has seven rows; and a rotation for every degree, so "the modes" is a list and
 * not a special case. The chord palette and the chord map loop over that array and rely on all
 * three.
 *
 * The pentatonic and blues scales are `GAPPED_FAMILIES`, apart from them, because they break both
 * rules. Five or six notes cannot each take a letter in turn, so a gapped family says which letter
 * each degree sits on — which is also how the blues scale gets its ♭5 as G♭ beside G rather than
 * as F♯. And skipping every other note of a five-note scale does not stack thirds, so a gapped
 * family has no chords of its own: it is played over the chords of a key, and says which.
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
  /**
   * Gapped families only: the letter each degree is spelled on, as steps above the tonic's letter.
   * Left out, degree *n* is *n* letters up, which is the seven-note rule.
   */
  letters?: number[];
  /**
   * Gapped families only: the seven-note family on the same tonic whose chords this scale is
   * played over. The progressions and the chord map read that key, since a gapped scale has no
   * chords of its own to walk between.
   */
  home?: string;
  /**
   * Gapped families only: the chords it is played over, when they are not simply the home key's.
   * The blues scale is the case — its I7, IV7 and V7 are not diatonic to anything.
   */
  harmony?: HarmonyChord[];
  /** What `harmony` is and why, for the chord panel. Left out, the panel explains the home key. */
  harmonyNote?: string;
};

/**
 * A chord a gapped scale is played over: a root, as a letter step and a distance from the tonic,
 * and the major-family mode whose tonic chord it is — `mixolydian` for a dominant 7th, `dorian`
 * for a minor 7th. Naming a mode rather than a chord type keeps the 7th-chord switch working for
 * free: the same entry is `C` with triads and `C7` with sevenths.
 */
export type HarmonyChord = { step: number; semitones: number; mode: string };

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

/** The chords of a 12-bar, I7–IV7–V7, as the blues scales' `harmony`. */
const BLUES_CHANGES: HarmonyChord[] = [
  { step: 0, semitones: 0, mode: 'mixolydian' },
  { step: 3, semitones: 5, mode: 'mixolydian' },
  { step: 4, semitones: 7, mode: 'mixolydian' },
];

const BLUES_NOTE =
  'The blues scale is not where the blues gets its chords. It is played over three dominant 7ths — I7, IV7 and V7 — and its ♭3 and ♭7 rub against their major 3rds on purpose; that rub is the style. With 7th chords off these are the plain major triads.';

const PENTATONIC_MODES: Record<string, Omit<Mode, 'degree'>> = {
  major: {
    id: 'major-pentatonic',
    name: 'Major pentatonic',
    character: 'Major with the 4th and 7th taken out. No half step anywhere in it, so no note in it can clash.',
  },
  suspended: {
    id: 'suspended-pentatonic',
    name: 'Suspended pentatonic',
    aka: 'Egyptian',
    character: 'No 3rd at all, so it is neither major nor minor. Open and droning, and at home over a sus chord.',
  },
  manGong: {
    id: 'man-gong',
    name: 'Man gong',
    aka: 'Blues minor',
    character: 'Minor 3rd, ♭6 and ♭7 with no 2nd and no 5th — the darkest rotation, and the least used.',
  },
  ritsusen: {
    id: 'ritsusen',
    name: 'Ritsusen',
    aka: 'Yo scale',
    character: 'No 3rd, but a major 2nd and 6th. Bright and open; the yo scale of Japanese folk music.',
  },
  minor: {
    id: 'minor-pentatonic',
    name: 'Minor pentatonic',
    character: 'The rock and blues lead scale: five notes, every one of them safe over a minor chord.',
  },
};

const pentatonicMode = (key: keyof typeof PENTATONIC_MODES, degree: number): Mode => ({
  ...PENTATONIC_MODES[key]!,
  degree,
});

export const GAPPED_FAMILIES: ScaleFamily[] = [
  {
    id: 'major-pentatonic',
    name: 'Major pentatonic',
    intervals: [0, 2, 4, 7, 9],
    letters: [0, 1, 2, 4, 5],
    description:
      'The major scale with its 4th and 7th left out — the two notes that make its half steps and its tritone. What is left has nothing in it that grinds, which is why it is the first scale anyone improvises with.',
    home: 'major',
    relative: { familyId: 'minor-pentatonic', degree: 4 },
    parallel: 'minor-pentatonic',
    modes: [
      pentatonicMode('major', 1),
      pentatonicMode('suspended', 2),
      pentatonicMode('manGong', 3),
      pentatonicMode('ritsusen', 4),
      pentatonicMode('minor', 5),
    ],
  },
  {
    id: 'minor-pentatonic',
    name: 'Minor pentatonic',
    intervals: [0, 3, 5, 7, 10],
    letters: [0, 2, 3, 4, 6],
    description:
      'Natural minor with its 2nd and ♭6 left out. The same five notes as its relative major pentatonic, and the scale most rock and blues solos are played in.',
    home: 'natural-minor',
    relative: { familyId: 'major-pentatonic', degree: 1 },
    parallel: 'major-pentatonic',
    modes: [
      pentatonicMode('minor', 1),
      pentatonicMode('major', 2),
      pentatonicMode('suspended', 3),
      pentatonicMode('manGong', 4),
      pentatonicMode('ritsusen', 5),
    ],
  },
  {
    id: 'blues',
    name: 'Blues',
    intervals: [0, 3, 5, 6, 7, 10],
    // The ♭5 is spelled on the 5th's letter, as G♭ beside G — the blue note is a bent 5th, not a
    // raised 4th, and that is how it is written.
    letters: [0, 2, 3, 4, 4, 6],
    description:
      'Minor pentatonic with a ♭5 squeezed in — the blue note, a half step either side of the 5th and only ever passed through. Played over major chords, which is the clash the whole style is built on.',
    home: 'major',
    harmony: BLUES_CHANGES,
    harmonyNote: BLUES_NOTE,
    relative: { familyId: 'major-blues', degree: 1 },
    parallel: 'major-blues',
    modes: [
      { id: 'blues', name: 'Blues', degree: 1, character: 'The minor-sounding blues: ♭3, ♭5 and ♭7.' },
      {
        id: 'major-blues',
        name: 'Major blues',
        degree: 2,
        character: 'The same six notes from the ♭3 — major pentatonic with the ♭3 as a passing note.',
      },
    ],
  },
  {
    id: 'major-blues',
    name: 'Major blues',
    intervals: [0, 2, 3, 4, 7, 9],
    // The ♭3 shares the 3rd's letter, as E♭ beside E, for the same reason the blues scale's ♭5 does.
    letters: [0, 1, 2, 2, 4, 5],
    description:
      'Major pentatonic with a ♭3 slid in under the 3rd. Country, gospel and the sunnier end of the blues: the ♭3 is a note you pass through on the way up to the major 3rd, not one you land on.',
    home: 'major',
    harmony: BLUES_CHANGES,
    harmonyNote:
      'Played over the same three dominant 7ths as the blues scale — I7, IV7 and V7. Here the ♭3 is only ever on its way up to the chord’s major 3rd, which is what makes this the brighter of the two. With 7th chords off these are the plain major triads.',
    relative: { familyId: 'blues', degree: 5 },
    parallel: 'blues',
    modes: [
      {
        id: 'major-blues',
        name: 'Major blues',
        degree: 1,
        character: 'The bright blues: major pentatonic with a ♭3 to slide from.',
      },
      {
        id: 'blues',
        name: 'Blues',
        degree: 6,
        character: 'The same six notes from the 6th — the minor blues scale of the relative key.',
      },
    ],
  },
];

export function findFamily(id: string): ScaleFamily {
  const family = [...SCALE_FAMILIES, ...GAPPED_FAMILIES].find((candidate) => candidate.id === id);
  if (!family) throw new Error(`No scale family "${id}"`);
  return family;
}

/** Fewer than seven notes: no letter each, and no chords of its own. */
export function isGapped(family: ScaleFamily): boolean {
  return family.intervals.length < 7;
}

/** The family whose chords this one is played over — itself, for a seven-note family. */
export function harmonicHome(family: ScaleFamily): ScaleFamily {
  return family.home === undefined ? family : findFamily(family.home);
}

/** The letter each degree is spelled on, as steps above the tonic's letter. */
export function letterSteps(family: ScaleFamily): number[] {
  return family.letters ?? family.intervals.map((_, step) => step);
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

/**
 * The letter steps of a family rotated to start on one of its degrees, measured from the new
 * tonic's letter. The partner of `rotateIntervals`: a mode needs both to be spelled.
 */
export function rotateLetters(letters: number[], modeIndex: number): number[] {
  const size = letters.length;
  const offset = letters[mod(modeIndex, size)]!;
  return letters.map((_, step) => mod(letters[mod(modeIndex + step, size)]! - offset, 7));
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

/**
 * Builds a spelled scale on `tonic` from a list of semitone offsets.
 *
 * `letters` says which letter each degree is spelled on, and defaults to one letter per degree —
 * the seven-note rule. It is also the interval's step count, which is what makes the blues
 * scale's G♭ a diminished 5th rather than an augmented 4th.
 */
export function buildScale(
  tonic: Note,
  intervals: number[],
  letters: number[] = intervals.map((_, step) => step),
): Scale {
  const degrees = intervals.map((semitones, index) => {
    const next = intervals[index + 1] ?? 12;
    const letter = letters[index]!;
    return {
      note: spellDegree(tonic, letter, semitones),
      interval: describeInterval(letter, semitones),
      stepToNext: next - semitones,
    };
  });
  return { tonic, intervals, degrees };
}

/** Builds a family's own scale — its first mode — rooted on `tonic`. */
export function familyScale(tonic: Note, family: ScaleFamily): Scale {
  return buildScale(tonic, family.intervals, letterSteps(family));
}

/** Builds the scale of one mode of a family, rooted on `tonic`. `modeIndex` is 0-based. */
export function buildMode(tonic: Note, family: ScaleFamily, modeIndex: number): Scale {
  return buildScale(tonic, rotateIntervals(family.intervals, modeIndex), rotateLetters(letterSteps(family), modeIndex));
}

/**
 * The same seven notes as the key, but started from a different degree — which is what a player
 * means by "the modes of this key", as opposed to the parallel modes built on one root.
 */
export function relativeMode(keyTonic: Note, family: ScaleFamily, modeIndex: number): Scale {
  return buildMode(degreeNote(keyTonic, family, modeIndex), family, modeIndex);
}

/** The note on one degree of a family's scale on `tonic`. `index` is 0-based. */
export function degreeNote(tonic: Note, family: ScaleFamily, index: number): Note {
  const size = family.intervals.length;
  return spellDegree(tonic, letterSteps(family)[mod(index, size)]!, family.intervals[mod(index, size)]!);
}

export type RelatedKey = { tonic: Note; family: ScaleFamily };

/** The same seven notes, resting on a different tonic — C major and A natural minor. */
export function relativeKey(tonic: Note, family: ScaleFamily): RelatedKey | undefined {
  if (family.relative === undefined) return undefined;
  const { familyId, degree } = family.relative;
  return { tonic: degreeNote(tonic, family, degree), family: findFamily(familyId) };
}

/** The same root, different notes — C major and C natural minor. */
export function parallelKey(tonic: Note, family: ScaleFamily): RelatedKey | undefined {
  if (family.parallel === undefined) return undefined;
  return { tonic, family: findFamily(family.parallel) };
}
