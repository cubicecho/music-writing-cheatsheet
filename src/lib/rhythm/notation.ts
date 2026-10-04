/**
 * A rhythm as written notes: which durations and which rests a grid of hits turns into.
 *
 * The grid says *when*; a staff also has to say *how long*, and a drum has no length. So this
 * follows the convention drum charts use: everything is one voice, a note lasts until the next
 * thing is struck or the beat ends, and a beat that opens with silence opens with a rest. Nothing
 * is ever tied across a beat, which is what keeps every beat readable on its own — a clave comes
 * out as quarter, eighth rest, eighth rather than as two dotted quarters.
 *
 * Pure: the SVG that draws this is `RhythmStaff`, and it decides nothing about rhythm.
 */

import { METERS, type Rhythm } from './patterns';
import { patternBars, type Stroke, stepsPerBar, strokesAt } from './timing';

export type NoteValue = { base: 'quarter' | 'eighth' | 'sixteenth'; dotted: boolean };

export type StaffSymbol = {
  /** The grid step it starts on, counted from the start of the pattern. */
  step: number;
  value: NoteValue;
  /** What is struck. Empty for a rest. */
  strokes: Stroke[];
};

/** A beat's worth of symbols — the unit that is beamed together. */
export type StaffBeat = StaffSymbol[];

/** Every length a note inside one pulse can have, in sixteenths. Five is not one of them. */
const VALUES: Record<number, NoteValue> = {
  1: { base: 'sixteenth', dotted: false },
  2: { base: 'eighth', dotted: false },
  3: { base: 'eighth', dotted: true },
  4: { base: 'quarter', dotted: false },
  6: { base: 'quarter', dotted: true },
};

function noteValue(rhythm: Rhythm, steps: number): NoteValue {
  const sixteenths = (steps * METERS[rhythm.meter].pulseSixteenths) / rhythm.division;
  const value = VALUES[sixteenths];
  if (value === undefined) throw new Error(`No note is ${sixteenths} sixteenths long`);
  return value;
}

function notateBeat(rhythm: Rhythm, start: number): StaffBeat {
  const end = start + rhythm.division;
  const struck = Array.from({ length: rhythm.division }, (_, offset) => start + offset).filter(
    (step) => strokesAt(rhythm, step).length > 0,
  );
  // The beat's own first step is always a boundary: either something is struck there, or the
  // silence up to the first hit has to be written as a rest.
  const starts = struck[0] === start ? struck : [start, ...struck];

  return starts.map((step, index) => ({
    step,
    value: noteValue(rhythm, (starts[index + 1] ?? end) - step),
    strokes: strokesAt(rhythm, step),
  }));
}

/** The pattern as bars of beats of notes and rests. */
export function notate(rhythm: Rhythm): StaffBeat[][] {
  const { pulses } = METERS[rhythm.meter];
  return Array.from({ length: patternBars(rhythm) }, (_, bar) =>
    Array.from({ length: pulses }, (_, pulse) =>
      notateBeat(rhythm, bar * stepsPerBar(rhythm) + pulse * rhythm.division),
    ),
  );
}
