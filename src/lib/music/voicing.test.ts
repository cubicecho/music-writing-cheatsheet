import { describe, expect, it } from 'vitest';
import { chordOnDegree, chordsInScale } from './chords';
import { parseNote } from './pitch';
import { buildScale, findFamily } from './scales';
import { frequency, MIDDLE_C, midiNumber, voiceChord, voiceScale } from './voicing';

const cMajor = () => buildScale(parseNote('C')!, findFamily('major').intervals);

describe('midiNumber', () => {
  it('puts middle C at 60 and A4 at 69', () => {
    expect(midiNumber(parseNote('C')!, 4)).toBe(MIDDLE_C);
    expect(midiNumber(parseNote('A')!, 4)).toBe(69);
  });

  it('collapses enharmonics, which is the one place this core is allowed to', () => {
    expect(midiNumber(parseNote('E#')!, 4)).toBe(midiNumber(parseNote('F')!, 4));
    expect(midiNumber(parseNote('Cb')!, 4)).toBe(midiNumber(parseNote('B')!, 4));
  });
});

describe('frequency', () => {
  it('tunes A4 to 440 and drops an octave for 12 fewer semitones', () => {
    expect(frequency(69)).toBeCloseTo(440);
    expect(frequency(57)).toBeCloseTo(220);
    expect(frequency(81)).toBeCloseTo(880);
  });
});

describe('voiceChord', () => {
  it('stacks a triad above its root', () => {
    expect(voiceChord(chordOnDegree(cMajor(), 0).notes)).toEqual([60, 64, 67]);
  });

  it('keeps the root on the bottom even when the chord spells higher letters', () => {
    // Am is A C E: the C and E are above the A, not below it.
    expect(voiceChord(chordOnDegree(cMajor(), 5).notes)).toEqual([69, 72, 76]);
  });

  it('adds the 7th on top', () => {
    expect(voiceChord(chordOnDegree(cMajor(), 4, true).notes)).toEqual([67, 71, 74, 77]);
  });

  it('never voices a chord out of order, in any scale', () => {
    for (const familyId of ['major', 'natural-minor', 'harmonic-minor', 'melodic-minor', 'harmonic-major']) {
      const scale = buildScale(parseNote('C')!, findFamily(familyId).intervals);
      for (const seventh of [false, true]) {
        for (const chord of chordsInScale(scale, seventh)) {
          const pitches = voiceChord(chord.notes);
          expect(pitches).toEqual([...pitches].sort((a, b) => a - b));
          expect(new Set(pitches).size).toBe(pitches.length);
        }
      }
    }
  });
});

describe('voiceScale', () => {
  it('runs up the scale and closes on the octave', () => {
    expect(voiceScale(cMajor())).toEqual([60, 62, 64, 65, 67, 69, 71, 72]);
  });
});
