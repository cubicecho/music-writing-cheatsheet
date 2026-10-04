import { describe, expect, it } from 'vitest';
import {
  barTicks,
  findRhythm,
  INSTRUMENTS,
  notate,
  patternBars,
  RHYTHMS,
  rhythmHits,
  rhythmToMidi,
  STYLES,
  stepLabels,
  stepsPerBar,
  stepTick,
  strokesAt,
  tempoMark,
  variableLength,
} from './index';

/** A beat as a string a musician could read back: `q` `e` `s` for notes, `r` before a rest, `.` for a dot. */
const spell = (rhythm: ReturnType<typeof findRhythm>): string =>
  notate(rhythm)
    .map((bar) =>
      bar
        .map((beat) =>
          beat
            .map(({ value, strokes }) => `${strokes.length === 0 ? 'r' : ''}${value.base[0]}${value.dotted ? '.' : ''}`)
            .join(' '),
        )
        .join(' | '),
    )
    .join(' || ');

/** The note-ons of a MIDI file, as [key, velocity] — enough to check what was written without a parser. */
const noteOns = (bytes: Uint8Array): [number, number][] => {
  const found: [number, number][] = [];
  bytes.forEach((byte, index) => {
    if (byte === 0x99) found.push([bytes[index + 1]!, bytes[index + 2]!]);
  });
  return found;
};

describe('the catalogue', () => {
  it('gives every rhythm a unique id and a style that exists', () => {
    expect(new Set(RHYTHMS.map((rhythm) => rhythm.id)).size).toBe(RHYTHMS.length);
    for (const rhythm of RHYTHMS) expect(STYLES.map((style) => style.id)).toContain(rhythm.style);
  });

  it('has something to show under every style', () => {
    for (const style of STYLES) expect(RHYTHMS.some((rhythm) => rhythm.style === style.id)).toBe(true);
  });

  it('writes every row over a whole number of bars, and every row of a rhythm over the same number', () => {
    for (const rhythm of RHYTHMS) {
      const lengths = new Set(Object.values(rhythm.voices).map((row) => row.length));
      expect(lengths.size, rhythm.id).toBe(1);
      expect([1, 2], rhythm.id).toContain(patternBars(rhythm));
    }
  });

  it('uses only the four characters a row is allowed', () => {
    for (const rhythm of RHYTHMS) {
      for (const row of Object.values(rhythm.voices)) expect(row, rhythm.id).toMatch(/^[.xXo]+$/);
    }
  });

  it('only swings rhythms written in eighths', () => {
    for (const rhythm of RHYTHMS.filter((candidate) => candidate.swing)) expect(rhythm.division, rhythm.id).toBe(2);
  });

  it('can write every rhythm it ships on a staff', () => {
    for (const rhythm of RHYTHMS) expect(() => notate(rhythm), rhythm.id).not.toThrow();
  });
});

describe('timing', () => {
  it('counts 6/8 as two beats of three eighths and 3/4 as three beats of two', () => {
    expect(stepsPerBar(findRhythm('six-eight'))).toBe(6);
    expect(stepsPerBar(findRhythm('waltz'))).toBe(6);
    expect(stepTick(findRhythm('six-eight'), 3)).toBe(720);
    expect(stepTick(findRhythm('waltz'), 2)).toBe(480);
    expect(barTicks(findRhythm('six-eight'))).toBe(barTicks(findRhythm('waltz')));
  });

  it('plays a swung off-beat on the last third of the beat, and leaves the beats alone', () => {
    const shuffle = findRhythm('shuffle');
    expect(stepTick(shuffle, 1)).toBe(320);
    expect(stepTick(shuffle, 2)).toBe(480);
    expect(stepTick(findRhythm('rock-eighths'), 1)).toBe(240);
  });

  it('puts the backbeat of a rock beat on 2 and 4', () => {
    const snare = rhythmHits(findRhythm('rock-eighths'), 1).filter((hit) => hit.instrument === 'snare');
    expect(snare.map((hit) => hit.tick)).toEqual([480, 1440]);
  });

  it('repeats a two-bar pattern twice to fill four bars', () => {
    const clave = findRhythm('son-clave-3-2');
    expect(patternBars(clave)).toBe(2);
    expect(rhythmHits(clave)).toHaveLength(10);
    expect(rhythmHits(clave)[5]!.tick).toBe(2 * barTicks(clave));
  });

  it('plays 2–3 clave as 3–2 clave started a bar later', () => {
    const [threeTwo, twoThree] = [findRhythm('son-clave-3-2'), findRhythm('son-clave-2-3')];
    const half = stepsPerBar(threeTwo);
    for (let step = 0; step < 2 * half; step += 1) {
      expect(strokesAt(twoThree, step)).toEqual(strokesAt(threeTwo, step + half));
    }
  });

  it('reads accents and ghost notes off the row', () => {
    const funk = findRhythm('funk-sixteenths');
    expect(strokesAt(funk, 4)).toContainEqual({ instrument: 'snare', level: 'accent' });
    expect(strokesAt(funk, 7)).toContainEqual({ instrument: 'snare', level: 'ghost' });
    expect(strokesAt(funk, 0)).toContainEqual({ instrument: 'kick', level: 'hit' });
  });

  it('counts sixteenths as "1 e & a" and compound eighths by number', () => {
    expect(stepLabels(findRhythm('dembow')).slice(0, 5)).toEqual(['1', 'e', '&', 'a', '2']);
    expect(stepLabels(findRhythm('rock-eighths'))).toEqual(['1', '&', '2', '&', '3', '&', '4', '&']);
    expect(stepLabels(findRhythm('six-eight'))).toEqual(['1', '2', '3', '4', '5', '6']);
  });

  it('marks the tempo of a compound meter in dotted quarters', () => {
    expect(tempoMark(findRhythm('six-eight'))).toBe('♩. = 58');
    expect(tempoMark(findRhythm('rock-eighths'))).toBe('♩ = 112');
  });
});

describe('notation', () => {
  it('writes a rock beat as eight eighths', () => {
    expect(spell(findRhythm('rock-eighths'))).toBe('e e | e e | e e | e e');
  });

  it('writes son clave beat by beat, with a rest where a beat opens on silence', () => {
    expect(spell(findRhythm('son-clave-3-2'))).toBe('q | re e | rq | q || rq | q | q | rq');
  });

  it('gives a lone hit in a 6/8 beat the whole dotted quarter', () => {
    const lone = { ...findRhythm('six-eight'), voices: { kick: 'x.....' } };
    expect(spell(lone)).toBe('q. | rq.');
  });

  it('writes a dembow snare as a dotted-eighth rest and a sixteenth', () => {
    const snare = { ...findRhythm('dembow'), voices: { snare: '...x..x....x..x.' } };
    expect(spell(snare)).toBe('re. s | re e | re. s | re e');
  });

  it('stacks everything struck together onto one note', () => {
    const [first] = notate(findRhythm('rock-eighths'))[0]![0]!;
    expect(first!.strokes.map((stroke) => stroke.instrument)).toEqual(['hat', 'kick']);
  });
});

describe('the MIDI file', () => {
  const rock = rhythmToMidi(findRhythm('rock-eighths'));

  it('is a one-track file at 480 ticks to the quarter', () => {
    expect(String.fromCharCode(...rock.slice(0, 4))).toBe('MThd');
    expect([...rock.slice(4, 14)]).toEqual([0, 0, 0, 6, 0, 0, 0, 1, 0x01, 0xe0]);
    expect(String.fromCharCode(...rock.slice(14, 18))).toBe('MTrk');
  });

  it('declares a track exactly as long as the one it wrote', () => {
    const declared = new DataView(rock.buffer).getUint32(18);
    expect(declared).toBe(rock.length - 22);
  });

  it('holds four bars: 32 hi-hats, 8 snares and 8 kicks, on the General MIDI keys', () => {
    const keys = noteOns(rock).map(([key]) => key);
    expect(keys.filter((key) => key === INSTRUMENTS.hat.midi)).toHaveLength(32);
    expect(keys.filter((key) => key === INSTRUMENTS.snare.midi)).toHaveLength(8);
    expect(keys.filter((key) => key === INSTRUMENTS.kick.midi)).toHaveLength(8);
  });

  it('ends on the fourth barline, so the file loops', () => {
    // The last note-off is 60 ticks after the last eighth (tick 7440), and four bars are 7680.
    expect([...rock.slice(-5)]).toEqual([...variableLength(7680 - 7500), 0xff, 0x2f, 0x00]);
  });

  it('writes a ghost note quieter than a hit and an accent louder', () => {
    const velocities = new Set(
      noteOns(rhythmToMidi(findRhythm('funk-sixteenths')))
        .filter(([key]) => key === INSTRUMENTS.snare.midi)
        .map(([, velocity]) => velocity),
    );
    expect([...velocities].sort((a, b) => a - b)).toEqual([44, 122]);
  });

  it('sets the tempo in quarter notes even when the beat is a dotted quarter', () => {
    // 58 dotted quarters a minute is 87 quarters: 60,000,000 / 87 microseconds each.
    const tempo = [...rhythmToMidi(findRhythm('six-eight'))].join(',');
    const micros = Math.round(60_000_000 / 87);
    expect(tempo).toContain([0xff, 0x51, 0x03, micros >> 16, (micros >> 8) & 0xff, micros & 0xff].join(','));
    expect(tempo).toContain([0xff, 0x58, 0x04, 6, 3, 36, 8].join(','));
  });

  it('encodes waits as variable-length numbers', () => {
    expect(variableLength(0)).toEqual([0]);
    expect(variableLength(127)).toEqual([0x7f]);
    expect(variableLength(200)).toEqual([0x81, 0x48]);
    expect(variableLength(7680)).toEqual([0xbc, 0x00]);
  });
});
