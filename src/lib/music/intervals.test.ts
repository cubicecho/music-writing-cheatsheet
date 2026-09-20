import { describe, expect, it } from 'vitest';
import { describeInterval } from './intervals';

describe('describeInterval', () => {
  it('names the degrees of the major scale', () => {
    const names = [0, 2, 4, 5, 7, 9, 11].map((semitones, step) => describeInterval(step, semitones).name);
    expect(names).toEqual([
      'Perfect unison',
      'Major 2nd',
      'Major 3rd',
      'Perfect 4th',
      'Perfect 5th',
      'Major 6th',
      'Major 7th',
    ]);
  });

  it('tells an augmented 4th from a diminished 5th, which semitones alone cannot', () => {
    expect(describeInterval(3, 6).name).toBe('Augmented 4th');
    expect(describeInterval(4, 6).name).toBe('Diminished 5th');
    expect(describeInterval(3, 6).isTritone).toBe(true);
    expect(describeInterval(4, 6).isTritone).toBe(true);
  });

  it('uses a perfect reference for 1, 4 and 5 and a major one for the rest', () => {
    expect(describeInterval(4, 8).short).toBe('A5');
    expect(describeInterval(5, 8).short).toBe('m6');
  });

  it('writes the degree the way a player says it', () => {
    expect(describeInterval(2, 3).degree).toBe('♭3');
    expect(describeInterval(3, 6).degree).toBe('♯4');
    expect(describeInterval(6, 10).degree).toBe('♭7');
    expect(describeInterval(6, 9).degree).toBe('♭♭7');
    expect(describeInterval(1, 2).degree).toBe('2');
  });
});
