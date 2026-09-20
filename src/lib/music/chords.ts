/**
 * The chords a scale contains, found the way a writer finds them: stack thirds on each degree
 * using only notes already in the scale.
 *
 * "Skip a note, take a note" is the whole algorithm — degree i, i+2, i+4 for a triad and i+6 for
 * the seventh. What comes out is named by the intervals it happens to span, which is why the
 * exotic families produce chords the common tables leave out (a ♯5 minor triad, a dim(maj7)) and
 * why the naming table below is a lookup with an honest fallback rather than a chain of ifs.
 */

import { describeInterval } from './intervals';
import { formatNote, mod, type Note, pitchClass } from './pitch';
import type { Scale } from './scales';

export type TriadQuality = 'major' | 'minor' | 'diminished' | 'augmented' | 'sus2' | 'sus4' | 'other';

export type Chord = {
  /** 0-based scale degree the chord is built on. */
  degreeIndex: number;
  root: Note;
  notes: Note[];
  /** `Cmaj7`, `F♯m7♭5`. */
  symbol: string;
  /** `maj7`, `m7♭5` — the symbol without the root. */
  suffix: string;
  /** `Imaj7`, `vii°` — the chord's function in the key. */
  numeral: string;
  quality: TriadQuality;
  /** What each note is doing: root, 3rd, 5th, 7th — as intervals above the chord root. */
  tones: { note: Note; interval: ReturnType<typeof describeInterval> }[];
  /** True when the stack is not a recognised chord and the suffix is a description instead. */
  unnamed: boolean;
};

const ROMAN = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII'];

/** Keyed by semitones from root to 3rd and to 5th. */
const TRIADS: Record<string, { quality: TriadQuality; suffix: string }> = {
  '4,7': { quality: 'major', suffix: '' },
  '3,7': { quality: 'minor', suffix: 'm' },
  '3,6': { quality: 'diminished', suffix: '°' },
  '4,8': { quality: 'augmented', suffix: '+' },
  '2,7': { quality: 'sus2', suffix: 'sus2' },
  '5,7': { quality: 'sus4', suffix: 'sus4' },
  '4,6': { quality: 'major', suffix: '♭5' },
  '3,8': { quality: 'minor', suffix: 'm♯5' },
  '2,6': { quality: 'other', suffix: 'sus2♭5' },
  '5,8': { quality: 'other', suffix: 'sus4♯5' },
};

/** Keyed by the triad suffix and the semitones from root to 7th. */
const SEVENTHS: Record<string, string> = {
  ',11': 'maj7',
  ',10': '7',
  ',9': '6',
  'm,10': 'm7',
  'm,11': 'm(maj7)',
  'm,9': 'm6',
  '°,9': '°7',
  '°,10': 'm7♭5',
  '°,11': '°(maj7)',
  '+,11': 'maj7♯5',
  '+,10': '7♯5',
  'sus4,10': '7sus4',
  'sus4,11': 'maj7sus4',
  'sus2,10': '7sus2',
  'sus2,11': 'maj7sus2',
  '♭5,10': '7♭5',
  '♭5,11': 'maj7♭5',
  'm♯5,10': 'm7♯5',
  'm♯5,11': 'm(maj7)♯5',
};

function semitonesAbove(root: Note, note: Note): number {
  return mod(pitchClass(note) - pitchClass(root), 12);
}

/**
 * The roman numeral, cased and decorated by quality, and carrying the degree's own accidental —
 * so Mixolydian's seventh chord reads `♭VII` rather than `VII`, which is how a writer refers to it.
 */
function numeralFor(scale: Scale, degreeIndex: number, quality: TriadQuality, suffix: string): string {
  const degree = scale.degrees[degreeIndex]!.interval.degree;
  const accidental = degree.replace(/\d+$/, '');
  const base = ROMAN[degreeIndex] ?? `${degreeIndex + 1}`;
  const numeral = quality === 'minor' || quality === 'diminished' ? base.toLowerCase() : base;
  const mark = quality === 'diminished' ? '°' : quality === 'augmented' ? '+' : suffix.startsWith('sus') ? 'sus' : '';
  return `${accidental}${numeral}${mark}`;
}

/** The chord sitting on one degree of `scale`, as a triad or, with `seventh`, a four-note chord. */
export function chordOnDegree(scale: Scale, degreeIndex: number, seventh = false): Chord {
  const size = scale.degrees.length;
  const pick = (step: number) => scale.degrees[mod(degreeIndex + step, size)]!.note;
  const root = pick(0);
  const notes = seventh ? [root, pick(2), pick(4), pick(6)] : [root, pick(2), pick(4)];

  const third = semitonesAbove(root, notes[1]!);
  const fifth = semitonesAbove(root, notes[2]!);
  const triad = TRIADS[`${third},${fifth}`];

  const quality: TriadQuality = triad?.quality ?? 'other';
  let suffix = triad?.suffix ?? `(${describeInterval(2, third).short}${describeInterval(4, fifth).short})`;
  let unnamed = triad === undefined;

  if (seventh) {
    const top = semitonesAbove(root, notes[3]!);
    const named = triad ? SEVENTHS[`${triad.suffix},${top}`] : undefined;
    if (named) {
      suffix = named;
    } else {
      suffix = `${suffix}(add ${describeInterval(6, top).short})`;
      unnamed = true;
    }
  }

  return {
    degreeIndex,
    root,
    notes,
    symbol: `${formatNote(root)}${suffix}`,
    suffix,
    numeral: numeralFor(scale, degreeIndex, quality, triad?.suffix ?? ''),
    quality,
    tones: notes.map((note, index) => ({
      note,
      interval: describeInterval(index * 2, semitonesAbove(root, note)),
    })),
    unnamed,
  };
}

/** Every chord in the scale, one per degree. */
export function chordsInScale(scale: Scale, seventh = false): Chord[] {
  return scale.degrees.map((_, index) => chordOnDegree(scale, index, seventh));
}
