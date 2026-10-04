/**
 * Where a rhythm's hits fall in time.
 *
 * One answer, in MIDI ticks, that the sound and the download both read — so what you hear in the
 * browser and what lands in the file cannot disagree about where a swung eighth goes.
 */

import { INSTRUMENT_ORDER, type InstrumentId, METERS, type Rhythm } from './patterns';

/** The resolution of the MIDI file. 480 divides by 2, 3 and 4, so every step here is a whole tick. */
export const TICKS_PER_QUARTER = 480;
const TICKS_PER_SIXTEENTH = TICKS_PER_QUARTER / 4;

/** How far through the beat a swung off-beat lands: the last note of a triplet. */
const SWING_RATIO = 2 / 3;

/** What the download holds, and so what the play button plays. */
export const PHRASE_BARS = 4;

export type Level = 'ghost' | 'hit' | 'accent';

const LEVELS: Record<string, Level> = { o: 'ghost', x: 'hit', X: 'accent' };

/** MIDI velocities — the three levels have to be far enough apart to hear on any drum kit. */
export const VELOCITY: Record<Level, number> = { ghost: 44, hit: 92, accent: 122 };

export type Stroke = { instrument: InstrumentId; level: Level };

export type RhythmHit = Stroke & {
  /** Counted from the start of the phrase, not of the bar. */
  step: number;
  tick: number;
};

export function pulseTicks(rhythm: Rhythm): number {
  return METERS[rhythm.meter].pulseSixteenths * TICKS_PER_SIXTEENTH;
}

export function barTicks(rhythm: Rhythm): number {
  return METERS[rhythm.meter].pulses * pulseTicks(rhythm);
}

export function stepsPerBar(rhythm: Rhythm): number {
  return METERS[rhythm.meter].pulses * rhythm.division;
}

/** How many grid steps the pattern is written over — one bar's worth, or two. */
export function patternSteps(rhythm: Rhythm): number {
  return Math.max(...Object.values(rhythm.voices).map((row) => row.length));
}

export function patternBars(rhythm: Rhythm): number {
  return patternSteps(rhythm) / stepsPerBar(rhythm);
}

/** When a step sounds. Only a swung off-beat is anywhere other than its even share of the pulse. */
export function stepTick(rhythm: Rhythm, step: number): number {
  const pulse = Math.floor(step / rhythm.division);
  const within = step % rhythm.division;
  const share = rhythm.swing && within === 1 ? SWING_RATIO : within / rhythm.division;
  return Math.round((pulse + share) * pulseTicks(rhythm));
}

/** Everything struck on one step of the pattern, top of the kit first. */
export function strokesAt(rhythm: Rhythm, step: number): Stroke[] {
  const at = step % patternSteps(rhythm);
  return INSTRUMENT_ORDER.flatMap((instrument) => {
    const level = LEVELS[rhythm.voices[instrument]?.[at] ?? '.'];
    return level === undefined ? [] : [{ instrument, level }];
  });
}

/** Every hit in `bars` bars, the pattern repeating as often as it takes to fill them. */
export function rhythmHits(rhythm: Rhythm, bars: number = PHRASE_BARS): RhythmHit[] {
  const steps = bars * stepsPerBar(rhythm);
  return Array.from({ length: steps }, (_, step) =>
    strokesAt(rhythm, step).map((stroke) => ({ ...stroke, step, tick: stepTick(rhythm, step) })),
  ).flat();
}

/** Milliseconds per tick at the rhythm's own tempo. */
export function tickMs(rhythm: Rhythm): number {
  return 60_000 / (rhythm.bpm * pulseTicks(rhythm));
}

/**
 * How one bar is counted out loud, a label per step.
 *
 * A simple meter is "1 e & a"; a compound one counts its eighths, 1 to 6, because that is how 6/8
 * is taught and "1 & a 2 & a" is how a triplet is.
 */
export function stepLabels(rhythm: Rhythm): string[] {
  const SYLLABLES = { 2: ['&'], 3: [], 4: ['e', '&', 'a'] } as const;
  return Array.from({ length: stepsPerBar(rhythm) }, (_, step) => {
    if (rhythm.division === 3) return String(step + 1);
    const within = step % rhythm.division;
    return within === 0 ? String(step / rhythm.division + 1) : SYLLABLES[rhythm.division][within - 1]!;
  });
}

/** "♩ = 112" — with the dot when the pulse is a dotted quarter, since that is the note being counted. */
export function tempoMark(rhythm: Rhythm): string {
  return `${METERS[rhythm.meter].pulseSixteenths === 6 ? '♩.' : '♩'} = ${rhythm.bpm}`;
}
