/**
 * Naming an interval takes two numbers, not one.
 *
 * Eleven semitones is a major seventh or a diminished octave depending on how many letters it
 * spans, and six is the augmented fourth of Lydian or the diminished fifth of Locrian — the same
 * sound, a different job. So every function here takes the scale step (how many letters) together
 * with the distance in semitones, and the quality falls out of the difference between them.
 */

/** Semitones in the major or perfect form of each interval number, indexed by step count 0-7. */
const REFERENCE = [0, 2, 4, 5, 7, 9, 11, 12];

/** Interval numbers built from a perfect rather than a major reference. */
const PERFECT_NUMBERS = new Set([1, 4, 5, 8]);

const ORDINALS = ['unison', '2nd', '3rd', '4th', '5th', '6th', '7th', 'octave'];

export type IntervalQuality =
  | 'perfect'
  | 'major'
  | 'minor'
  | 'augmented'
  | 'diminished'
  | 'doubly augmented'
  | 'doubly diminished';

export type Interval = {
  /** Scale steps spanned, 1-based: 1 = unison, 3 = some kind of third. */
  number: number;
  /** Distance from the tonic in semitones. */
  semitones: number;
  quality: IntervalQuality;
  /** `M3`, `♭5`-style shorthand used on the staff: `P1`, `m3`, `A4`, `d5`. */
  short: string;
  /** Spoken name: "Major third", "Augmented fourth". */
  name: string;
  /** How players say it — the degree against the major scale: `1`, `♭3`, `♯4`, `♭7`. */
  degree: string;
  /** Six semitones, by either spelling. Worth flagging: it is the note that decides a mode's colour. */
  isTritone: boolean;
};

const QUALITY_SHORT: Record<IntervalQuality, string> = {
  perfect: 'P',
  major: 'M',
  minor: 'm',
  augmented: 'A',
  diminished: 'd',
  'doubly augmented': 'AA',
  'doubly diminished': 'dd',
};

function qualityFor(isPerfect: boolean, offset: number): IntervalQuality {
  if (isPerfect) {
    if (offset === 0) return 'perfect';
    if (offset === 1) return 'augmented';
    if (offset === -1) return 'diminished';
    return offset > 0 ? 'doubly augmented' : 'doubly diminished';
  }
  if (offset === 0) return 'major';
  if (offset === -1) return 'minor';
  if (offset === 1) return 'augmented';
  if (offset === -2) return 'diminished';
  return offset > 0 ? 'doubly augmented' : 'doubly diminished';
}

/**
 * `♭`/`♯` prefixes for the player's degree notation, from the same offset the quality used.
 *
 * A minor third is one flat below the major one and a diminished fifth is one below the perfect
 * one, so the offset *is* the accidental count — whichever reference it was measured against.
 */
function degreeFor(number: number, offset: number): string {
  const symbol = offset < 0 ? '♭'.repeat(-offset) : '♯'.repeat(offset);
  return `${symbol}${number}`;
}

/**
 * Describes the interval spanning `steps + 1` letters and `semitones` semitones.
 *
 * `steps` is 0-based so it can be an index straight into a scale: step 0 is the tonic, step 2 is
 * whatever kind of third the scale has there.
 */
export function describeInterval(steps: number, semitones: number): Interval {
  const number = steps + 1;
  const isPerfect = PERFECT_NUMBERS.has(number);
  const offset = semitones - REFERENCE[steps]!;
  const quality = qualityFor(isPerfect, offset);
  const ordinal = ORDINALS[steps] ?? `${number}th`;
  const spokenQuality = quality.charAt(0).toUpperCase() + quality.slice(1);

  return {
    number,
    semitones,
    quality,
    short: `${QUALITY_SHORT[quality]}${number}`,
    name: `${spokenQuality} ${ordinal}`,
    degree: degreeFor(number, offset),
    isTritone: semitones === 6,
  };
}

export { ORDINALS as INTERVAL_ORDINALS };
