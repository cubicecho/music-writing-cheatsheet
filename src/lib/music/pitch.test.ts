import { describe, expect, it } from 'vitest';
import { formatNote, formatNoteAscii, parseNote, pitchClass, spellDegree } from './pitch';

describe('pitchClass', () => {
  it('derives the pitch from the letter and the alteration', () => {
    expect(pitchClass({ letter: 0, alter: 0 })).toBe(0); // C
    expect(pitchClass({ letter: 6, alter: 0 })).toBe(11); // B
    expect(pitchClass({ letter: 6, alter: 1 })).toBe(0); // B♯ wraps to C
    expect(pitchClass({ letter: 0, alter: -1 })).toBe(11); // C♭ wraps back to B
  });
});

describe('parseNote / formatNote', () => {
  it('round-trips every spelling it accepts', () => {
    for (const text of ['C', 'F#', 'Bb', 'G##', 'Ebb']) {
      expect(formatNoteAscii(parseNote(text)!)).toBe(text);
    }
  });

  it('formats accidentals with the real glyphs', () => {
    expect(formatNote(parseNote('F#')!)).toBe('F♯');
    expect(formatNote(parseNote('Bb')!)).toBe('B♭');
    expect(formatNote(parseNote('G##')!)).toBe('G𝄪');
  });

  it('rejects what is not a note', () => {
    expect(parseNote('H')).toBeNull();
    expect(parseNote('C#b')).toBeNull();
    expect(parseNote('')).toBeNull();
  });
});

describe('spellDegree', () => {
  it('gives the seventh of F♯ major an E♯, not an F', () => {
    const tonic = parseNote('F#')!;
    expect(formatNoteAscii(spellDegree(tonic, 6, 11))).toBe('E#');
  });

  it('gives the fourth of C♭ major an F♭', () => {
    const tonic = parseNote('Cb')!;
    expect(formatNoteAscii(spellDegree(tonic, 3, 5))).toBe('Fb');
  });

  it('keeps the letter the step count asks for even when the accidental is doubled', () => {
    // The 7th of D♯ harmonic minor is C𝄪 — a scale nobody writes, spelled the way it has to be.
    const tonic = parseNote('D#')!;
    expect(formatNoteAscii(spellDegree(tonic, 6, 11))).toBe('C##');
  });
});
