/**
 * The one impure corner of the app: making a sound.
 *
 * Everything else here describes music in text, which is the weak point of every cheatsheet —
 * "♭VI" means nothing until you have heard one. This turns the numbers `voicing.ts` produces into
 * pitches. No samples and no library: a couple of oscillators and an envelope, which is enough to
 * tell a major 3rd from a minor one and small enough to need no dependency.
 *
 * Browsers will not start an AudioContext outside a user gesture, so the context is created on the
 * first play and every entry point here is reached from a click.
 */

import { frequency } from './music';

const MASTER_GAIN = 0.22;
/** Rolls the notes of a chord out slightly, like a hand rather than a machine. */
const STRUM_SECONDS = 0.022;

type Context = AudioContext & { __master?: GainNode };

let context: Context | undefined;

function master(): GainNode | undefined {
  if (context === undefined) {
    const Ctor = typeof window === 'undefined' ? undefined : window.AudioContext;
    if (Ctor === undefined) return undefined;
    context = new Ctor() as Context;
  }
  // Suspended is the normal state for a context built before the first gesture, and resuming is
  // safe to call on one that is already running.
  void context.resume();

  if (context.__master === undefined) {
    const gain = context.createGain();
    gain.gain.value = MASTER_GAIN;
    gain.connect(context.destination);
    context.__master = gain;
  }
  return context.__master;
}

/** True when this browser will make a sound, so the UI can leave the buttons out if it will not. */
export function audioAvailable(): boolean {
  return typeof window !== 'undefined' && window.AudioContext !== undefined;
}

/**
 * One note.
 *
 * A triangle for the body and a quiet sine an octave up for a bit of ring — an organ more than a
 * piano. The envelope matters more than the waveform: without the ramps every note clicks.
 */
function voice(destination: GainNode, midi: number, start: number, duration: number): void {
  const ctx = destination.context;
  const hz = frequency(midi);

  const envelope = ctx.createGain();
  envelope.connect(destination);

  const peak = 0.3;
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(peak, start + 0.012);
  envelope.gain.linearRampToValueAtTime(peak * 0.65, start + 0.12);
  envelope.gain.setTargetAtTime(0, start + duration, 0.12);

  for (const [type, level, ratio] of [
    ['triangle', 1, 1],
    ['sine', 0.35, 2],
  ] as const) {
    const osc = ctx.createOscillator();
    osc.type = type;
    osc.frequency.value = hz * ratio;

    const mix = ctx.createGain();
    mix.gain.value = level;

    osc.connect(mix).connect(envelope);
    osc.start(start);
    osc.stop(start + duration + 0.8);
  }
}

export type Voice = { pitches: number[]; strum?: boolean };

/** Plays one chord, one note, or a scale note — anything that sounds at a single moment. */
export function playPitches(
  pitches: number[],
  { strum = true, duration = 1.1 }: { strum?: boolean; duration?: number } = {},
): void {
  const destination = master();
  if (destination === undefined || pitches.length === 0) return;

  const start = destination.context.currentTime + 0.02;
  pitches.forEach((midi, index) => {
    voice(destination, midi, start + (strum ? index * STRUM_SECONDS : 0), duration);
  });
}

export type Playback = { stop: () => void };

/**
 * Plays a list of chords in time, reporting which one is sounding so the UI can follow along.
 *
 * The notes are scheduled up front, because Web Audio's clock is the only one accurate enough to
 * keep time; the `onStep` callbacks ride on `setTimeout`, where being a frame late is invisible.
 */
export function playSequence(
  chords: number[][],
  { beatMs = 900, onStep }: { beatMs?: number; onStep?: (index: number | null) => void } = {},
): Playback {
  const destination = master();
  if (destination === undefined || chords.length === 0) {
    onStep?.(null);
    return { stop: () => {} };
  }

  const ctx = destination.context;
  // Its own gain node so that stopping ramps this sequence down without touching anything else
  // that happens to be ringing.
  const bus = ctx.createGain();
  bus.connect(destination);

  const beat = beatMs / 1000;
  const start = ctx.currentTime + 0.05;
  chords.forEach((pitches, index) => {
    for (const [offset, midi] of pitches.entries()) {
      voice(bus, midi, start + index * beat + offset * STRUM_SECONDS, beat * 0.85);
    }
  });

  const timers = chords.map((_, index) => window.setTimeout(() => onStep?.(index), index * beatMs));
  timers.push(window.setTimeout(() => onStep?.(null), chords.length * beatMs));

  const stop = () => {
    for (const timer of timers) window.clearTimeout(timer);
    bus.gain.setTargetAtTime(0, ctx.currentTime, 0.05);
    window.setTimeout(() => bus.disconnect(), 400);
    onStep?.(null);
  };

  return { stop };
}
