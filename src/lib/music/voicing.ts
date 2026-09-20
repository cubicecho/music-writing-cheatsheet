/**
 * Turning spelled notes into pitches you can actually sound.
 *
 * This is where the letter-plus-alteration representation finally collapses down to a number:
 * E♯ and F are different notes everywhere else in this core, and here they are the same key on a
 * keyboard. Kept apart from the audio driver on purpose — the arithmetic is worth testing and the
 * Web Audio plumbing is not.
 */

import { mod, type Note, pitchClass } from './pitch';
import type { Scale } from './scales';

/** Middle C. The octave numbering is scientific pitch notation, so C4 is 60. */
export const MIDDLE_C = 60;

export function midiNumber(note: Note, octave: number): number {
  return 12 * (octave + 1) + pitchClass(note);
}

export function frequency(midi: number): number {
  return 440 * 2 ** ((midi - 69) / 12);
}

/**
 * A chord as ascending pitches, close position, root on the bottom.
 *
 * Chord tones are stacked thirds, so their distances above the root always ascend — no voice ever
 * needs moving up an octave to keep the stack in order.
 */
export function voiceChord(notes: Note[], octave = 4): number[] {
  const root = notes[0];
  if (root === undefined) return [];
  const bottom = midiNumber(root, octave);
  return notes.map((note) => bottom + mod(pitchClass(note) - pitchClass(root), 12));
}

/** The scale ascending, closed off by the octave above the tonic — how you would practise it. */
export function voiceScale(scale: Scale, octave = 4): number[] {
  const bottom = midiNumber(scale.tonic, octave);
  return [...scale.intervals.map((semitones) => bottom + semitones), bottom + 12];
}
