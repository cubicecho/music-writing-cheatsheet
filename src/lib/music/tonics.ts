import { formatNote, formatNoteAscii, type Note, notesEqual, parseNote, pitchClass } from './pitch';

/**
 * The roots offered in the key picker.
 *
 * Both spellings of each black key are here rather than one canonical choice, because the
 * spelling is the point: D♯ minor and E♭ minor are the same notes and only one of them is
 * readable, and which one that is depends on the scale you are about to build.
 */
const SPELLINGS = ['C', 'C#', 'Db', 'D', 'D#', 'Eb', 'E', 'F', 'F#', 'Gb', 'G', 'G#', 'Ab', 'A', 'A#', 'Bb', 'B'];

export type Tonic = {
  /** ASCII, safe for a URL or a `<select>` value: `C`, `F#`, `Bb`. */
  id: string;
  /** With real accidentals, for display. */
  label: string;
  note: Note;
};

export const TONICS: Tonic[] = SPELLINGS.map((spelling) => {
  const note = parseNote(spelling);
  if (!note) throw new Error(`Bad tonic spelling "${spelling}"`);
  return { id: formatNoteAscii(note), label: formatNote(note), note };
});

/**
 * The picker entry for a note, falling back to whatever is spelled the same on a keyboard.
 *
 * The fallback is for the theoretical keys. D♯ major is selectable and its relative minor is
 * B♯ minor, which is not on the list and which nobody writes; C minor is the same seven notes
 * and is, so that is what you get taken to.
 */
export function findTonic(note: Note): Tonic | undefined {
  return (
    TONICS.find((candidate) => notesEqual(candidate.note, note)) ??
    TONICS.find((candidate) => pitchClass(candidate.note) === pitchClass(note))
  );
}
