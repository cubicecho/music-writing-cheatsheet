/**
 * Notes are spelled, not numbered.
 *
 * A pitch class alone cannot tell G♯ from A♭, and a cheatsheet that prints the wrong one is
 * teaching the wrong thing: the seventh degree of F♯ major is E♯, and calling it F would put two
 * F's in a scale that has one of every letter. So a note is a letter plus an alteration, and the
 * pitch class is derived from it rather than the other way round.
 */

export const LETTERS = ['C', 'D', 'E', 'F', 'G', 'A', 'B'] as const;

/** Semitones above C for each natural letter, in the same order as `LETTERS`. */
const NATURAL_PITCH_CLASS = [0, 2, 4, 5, 7, 9, 11];

export type Note = {
  /** Index into `LETTERS`: 0 = C … 6 = B. */
  letter: number;
  /** Semitones of alteration: -2 = double flat … 2 = double sharp. */
  alter: number;
};

const ACCIDENTALS: Record<number, string> = {
  [-2]: '𝄫',
  [-1]: '♭',
  0: '',
  1: '♯',
  2: '𝄪',
};

/** Always-positive remainder — `%` in JS keeps the sign of the dividend, which is never what we want here. */
export function mod(value: number, size: number): number {
  return ((value % size) + size) % size;
}

export function pitchClass(note: Note): number {
  return mod(NATURAL_PITCH_CLASS[mod(note.letter, 7)]! + note.alter, 12);
}

export function formatNote(note: Note): string {
  const accidental = ACCIDENTALS[note.alter] ?? (note.alter > 0 ? '♯'.repeat(note.alter) : '♭'.repeat(-note.alter));
  return `${LETTERS[mod(note.letter, 7)]}${accidental}`;
}

/** ASCII spelling, for anywhere the unicode accidentals are not welcome — URLs, ids, tests. */
export function formatNoteAscii(note: Note): string {
  const accidental = note.alter > 0 ? '#'.repeat(note.alter) : 'b'.repeat(-note.alter);
  return `${LETTERS[mod(note.letter, 7)]}${accidental}`;
}

export function notesEqual(a: Note, b: Note): boolean {
  return a.letter === b.letter && a.alter === b.alter;
}

export function parseNote(text: string): Note | null {
  const match = /^([A-Ga-g])(#{1,2}|b{1,2}|♯{1,2}|♭{1,2}|𝄫|𝄪)?$/.exec(text.trim());
  if (!match) return null;
  const letter = LETTERS.indexOf(match[1]!.toUpperCase() as (typeof LETTERS)[number]);
  const accidental = match[2] ?? '';
  const alter =
    accidental === '𝄪'
      ? 2
      : accidental === '𝄫'
        ? -2
        : /[#♯]/.test(accidental)
          ? accidental.length
          : /[b♭]/.test(accidental)
            ? -accidental.length
            : 0;
  return { letter, alter };
}

/**
 * Spells the note `degreeIndex` scale steps above `tonic` that lands `semitones` above it.
 *
 * The letter comes from the step count and the accidental is whatever it takes to reach the
 * pitch — which is the rule that gives a seven-note scale one of every letter for free.
 */
export function spellDegree(tonic: Note, degreeIndex: number, semitones: number): Note {
  const letter = mod(tonic.letter + degreeIndex, 7);
  const target = mod(pitchClass(tonic) + semitones, 12);
  let alter = mod(target - NATURAL_PITCH_CLASS[letter]!, 12);
  if (alter > 6) alter -= 12;
  return { letter, alter };
}
