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
import type { InstrumentId } from './rhythm';

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

/**
 * Drums, out of the same two ingredients as everything else here: an oscillator for anything with
 * a pitch, and filtered noise for anything without one. None of it would fool anybody, and it does
 * not need to — the job is to tell a kick from a snare from a hi-hat while the grid lights up.
 */

/** The drum bus sits above the chords' level: a percussive hit is over before it sounds as loud. */
const DRUM_GAIN = 2.2;

let noise: AudioBuffer | undefined;

/** A second of white noise, made once. Every cymbal and the snare's rattle are slices of it. */
function noiseBuffer(ctx: BaseAudioContext): AudioBuffer {
  if (noise === undefined) {
    noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const samples = noise.getChannelData(0);
    for (let index = 0; index < samples.length; index += 1) samples[index] = Math.random() * 2 - 1;
  }
  return noise;
}

/** A fast attack and an exponential fall — the only envelope a struck thing has. */
function strike(destination: AudioNode, start: number, level: number, decay: number): GainNode {
  const envelope = destination.context.createGain();
  envelope.gain.setValueAtTime(0, start);
  envelope.gain.linearRampToValueAtTime(level, start + 0.002);
  envelope.gain.exponentialRampToValueAtTime(0.001, start + decay);
  envelope.connect(destination);
  return envelope;
}

type Tone = { type: OscillatorType; hz: number; fallTo?: number; decay: number; level: number };
type Burst = { filter: 'highpass' | 'bandpass'; hz: number; decay: number; level: number };

function tone(destination: AudioNode, start: number, gain: number, { type, hz, fallTo, decay, level }: Tone): void {
  const osc = destination.context.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(hz, start);
  // The pitch drop is what makes a sine a kick drum rather than a beep.
  if (fallTo !== undefined) osc.frequency.exponentialRampToValueAtTime(fallTo, start + decay * 0.5);
  osc.connect(strike(destination, start, level * gain, decay));
  osc.start(start);
  osc.stop(start + decay + 0.05);
}

function burst(destination: AudioNode, start: number, gain: number, { filter, hz, decay, level }: Burst): void {
  const ctx = destination.context;
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  const shape = ctx.createBiquadFilter();
  shape.type = filter;
  shape.frequency.value = hz;
  source.connect(shape).connect(strike(destination, start, level * gain, decay));
  source.start(start);
  source.stop(start + decay + 0.05);
}

/** What each instrument is made of. Typed against the whole kit, so a new one cannot be silent. */
const KIT: Record<InstrumentId, { tones?: Tone[]; bursts?: Burst[] }> = {
  kick: { tones: [{ type: 'sine', hz: 150, fallTo: 45, decay: 0.3, level: 1 }] },
  snare: {
    tones: [{ type: 'triangle', hz: 190, decay: 0.1, level: 0.45 }],
    bursts: [{ filter: 'highpass', hz: 1500, decay: 0.17, level: 0.6 }],
  },
  rim: {
    tones: [{ type: 'sine', hz: 820, decay: 0.035, level: 0.5 }],
    bursts: [{ filter: 'bandpass', hz: 1800, decay: 0.04, level: 0.7 }],
  },
  hat: { bursts: [{ filter: 'highpass', hz: 7000, decay: 0.05, level: 0.4 }] },
  openHat: { bursts: [{ filter: 'highpass', hz: 7000, decay: 0.32, level: 0.4 }] },
  pedal: { bursts: [{ filter: 'highpass', hz: 6000, decay: 0.035, level: 0.3 }] },
  ride: {
    tones: [{ type: 'sine', hz: 4300, decay: 0.3, level: 0.07 }],
    bursts: [{ filter: 'bandpass', hz: 6500, decay: 0.4, level: 0.3 }],
  },
  claves: { tones: [{ type: 'sine', hz: 2450, decay: 0.07, level: 0.7 }] },
  bell: {
    tones: [
      { type: 'square', hz: 545, decay: 0.2, level: 0.16 },
      { type: 'square', hz: 815, decay: 0.2, level: 0.16 },
    ],
  },
};

export type DrumHit = { instrument: InstrumentId; ms: number; gain: number };

/**
 * Plays a list of drum hits in time, reporting which grid step is sounding.
 *
 * The same split as `playSequence`, for the same reason: the hits are scheduled on the audio clock
 * and the `onStep` callbacks on `setTimeout`. `stepMs` is passed in rather than derived, because a
 * swung rhythm's steps are not evenly spaced and only the rhythm knows where they fall.
 */
export function playDrums(
  hits: DrumHit[],
  { stepMs, totalMs, onStep }: { stepMs: number[]; totalMs: number; onStep?: (index: number | null) => void },
): Playback {
  const destination = master();
  if (destination === undefined || hits.length === 0) {
    onStep?.(null);
    return { stop: () => {} };
  }

  const ctx = destination.context;
  const bus = ctx.createGain();
  bus.gain.value = DRUM_GAIN;
  bus.connect(destination);

  const start = ctx.currentTime + 0.05;
  for (const { instrument, ms, gain } of hits) {
    const at = start + ms / 1000;
    for (const part of KIT[instrument].tones ?? []) tone(bus, at, gain, part);
    for (const part of KIT[instrument].bursts ?? []) burst(bus, at, gain, part);
  }

  const timers = stepMs.map((ms, index) => window.setTimeout(() => onStep?.(index), ms));
  timers.push(window.setTimeout(() => onStep?.(null), totalMs));

  const stop = () => {
    for (const timer of timers) window.clearTimeout(timer);
    bus.gain.setTargetAtTime(0, ctx.currentTime, 0.03);
    window.setTimeout(() => bus.disconnect(), 400);
    onStep?.(null);
  };

  return { stop };
}
