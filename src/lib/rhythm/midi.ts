/**
 * A rhythm as a Standard MIDI File.
 *
 * Written by hand because the format is small and the alternative is a dependency: a header, one
 * track, and a list of events each prefixed by how long to wait since the last one. Everything is
 * on channel 10, the General MIDI percussion channel, so the file plays as drums in any DAW
 * without a mapping step.
 *
 * Pure — this returns bytes, and the component that offers the download is the one that touches
 * the DOM.
 */

import { INSTRUMENTS, METERS, type Rhythm } from './patterns';
import { barTicks, PHRASE_BARS, pulseTicks, rhythmHits, TICKS_PER_QUARTER, VELOCITY } from './timing';

/** Channel 10, counted from zero. */
const DRUM_CHANNEL = 9;
const NOTE_ON = 0x90 | DRUM_CHANNEL;
const NOTE_OFF = 0x80 | DRUM_CHANNEL;
/** A drum note's length is ignored by nearly everything, but a zero-length one is dropped by some. */
const NOTE_TICKS = 60;
const MICROSECONDS_PER_MINUTE = 60_000_000;

const ascii = (text: string): number[] => Array.from(text, (character) => character.charCodeAt(0));

/** Big-endian, as every fixed-width number in the format is. */
const bigEndian = (value: number, bytes: number): number[] =>
  Array.from({ length: bytes }, (_, index) => (value >> (8 * (bytes - 1 - index))) & 0xff);

/**
 * MIDI's variable-length number: seven bits a byte, most significant first, with the top bit set
 * on every byte but the last. It is how the waits between events are stored.
 */
export function variableLength(value: number): number[] {
  const bytes = [value & 0x7f];
  for (let rest = value >> 7; rest > 0; rest >>= 7) bytes.unshift((rest & 0x7f) | 0x80);
  return bytes;
}

const meta = (type: number, data: number[]): number[] => [0xff, type, ...variableLength(data.length), ...data];

/**
 * The phrase as a format-0 MIDI file: tempo, time signature, and `bars` bars of the pattern.
 *
 * The track ends exactly on the last barline rather than after the last note, so the file loops
 * cleanly when it is dropped onto a timeline.
 */
export function rhythmToMidi(rhythm: Rhythm, bars: number = PHRASE_BARS): Uint8Array<ArrayBuffer> {
  const { numerator, denominator } = METERS[rhythm.meter];
  // The file's tempo is always in quarter notes, whatever the pulse is.
  const quarterBpm = (rhythm.bpm * pulseTicks(rhythm)) / TICKS_PER_QUARTER;
  // MIDI clocks per metronome click: 24 to a quarter.
  const clocksPerPulse = (24 * pulseTicks(rhythm)) / TICKS_PER_QUARTER;

  const notes = rhythmHits(rhythm, bars).flatMap(({ tick, instrument, level }) => {
    const key = INSTRUMENTS[instrument].midi;
    return [
      { tick, bytes: [NOTE_ON, key, VELOCITY[level]] },
      { tick: tick + NOTE_TICKS, bytes: [NOTE_OFF, key, 0] },
    ];
  });
  const events = [
    { tick: 0, bytes: meta(0x03, ascii(rhythm.id)) },
    { tick: 0, bytes: meta(0x58, [numerator, Math.log2(denominator), clocksPerPulse, 8]) },
    { tick: 0, bytes: meta(0x51, bigEndian(Math.round(MICROSECONDS_PER_MINUTE / quarterBpm), 3)) },
    // A stable sort, so the three headers stay first and a note-off written before a note-on on
    // the same tick stays before it.
    ...notes.sort((a, b) => a.tick - b.tick),
    { tick: bars * barTicks(rhythm), bytes: meta(0x2f, []) },
  ];

  const track = events.flatMap((event, index) => [
    ...variableLength(event.tick - (events[index - 1]?.tick ?? 0)),
    ...event.bytes,
  ]);

  return Uint8Array.from([
    ...ascii('MThd'),
    ...bigEndian(6, 4),
    ...bigEndian(0, 2),
    ...bigEndian(1, 2),
    ...bigEndian(TICKS_PER_QUARTER, 2),
    ...ascii('MTrk'),
    ...bigEndian(track.length, 4),
    ...track,
  ]);
}
