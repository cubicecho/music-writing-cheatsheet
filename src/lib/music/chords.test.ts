import { describe, expect, it } from 'vitest';
import { chordsInScale } from './chords';
import { parseNote } from './pitch';
import { buildMode, buildScale, findFamily, SCALE_FAMILIES } from './scales';

const symbols = (tonic: string, familyId: string, modeIndex = 0, seventh = false) =>
  chordsInScale(buildMode(parseNote(tonic)!, findFamily(familyId), modeIndex), seventh).map((chord) => chord.symbol);

describe('triads', () => {
  it('builds the chords of C major', () => {
    expect(symbols('C', 'major')).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']);
  });

  it('builds the chords of A natural minor from the same family', () => {
    expect(symbols('A', 'major', 5)).toEqual(['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G']);
  });

  it('gives the natural minor family the same chords, in its own order', () => {
    expect(symbols('A', 'natural-minor')).toEqual(['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G']);
  });

  it('leaves the v minor, which is the whole difference from harmonic minor', () => {
    expect(symbols('A', 'natural-minor')[4]).toBe('Em');
    expect(symbols('A', 'harmonic-minor')[4]).toBe('E');
  });

  it('finds the augmented triad harmonic minor hides on its ♭3', () => {
    expect(symbols('A', 'harmonic-minor')).toEqual(['Am', 'B°', 'C+', 'Dm', 'E', 'F', 'G♯°']);
  });

  it('spells chord roots from the scale, so F♯ major gets an A♯m and not a B♭m', () => {
    expect(symbols('F#', 'major')).toEqual(['F♯', 'G♯m', 'A♯m', 'B', 'C♯', 'D♯m', 'E♯°']);
  });
});

describe('seventh chords', () => {
  it('builds the sevenths of C major', () => {
    expect(symbols('C', 'major', 0, true)).toEqual(['Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7', 'Am7', 'Bm7♭5']);
  });

  it('builds the sevenths of A natural minor', () => {
    expect(symbols('A', 'natural-minor', 0, true)).toEqual(['Am7', 'Bm7♭5', 'Cmaj7', 'Dm7', 'Em7', 'Fmaj7', 'G7']);
  });

  it('names the minor-major 7th that harmonic minor puts on its tonic', () => {
    const chords = symbols('A', 'harmonic-minor', 0, true);
    expect(chords[0]).toBe('Am(maj7)');
    expect(chords[2]).toBe('Cmaj7♯5');
    expect(chords[6]).toBe('G♯°7');
  });

  it('names the chords melodic minor builds on its ♯4 and ♯5 modes', () => {
    expect(symbols('C', 'melodic-minor', 2, true)[0]).toBe('Cmaj7♯5'); // Lydian augmented
    expect(symbols('C', 'melodic-minor', 3, true)[0]).toBe('C7'); // Lydian dominant
  });

  it('stacks the altered scale literally, which is a m7♭5 and not the altered dominant', () => {
    // C altered is C D♭ E♭ F♭ G♭ A♭ B♭, and thirds off it give C E♭ G♭ B♭. Calling that a C7♯9♭5
    // means respelling E♭ as D♯ and F♭ as E — the enharmonic move a player makes, and a claim
    // about function rather than about the notes. The stack reports the notes.
    expect(symbols('C', 'melodic-minor', 6, true)[0]).toBe('Cm7♭5');
  });
});

describe('the numerals', () => {
  it('cases them by quality and carries the degree accidental', () => {
    const numerals = chordsInScale(buildMode(parseNote('C')!, findFamily('major'), 4)).map((chord) => chord.numeral);
    expect(numerals).toEqual(['I', 'ii', 'iii°', 'IV', 'v', 'vi', '♭VII']);
  });
});

describe('chord tones', () => {
  it('labels each note by what it is doing in the chord', () => {
    const [tonic] = chordsInScale(buildScale(parseNote('C')!, findFamily('major').intervals), true);
    expect(tonic!.tones.map((tone) => tone.interval.short)).toEqual(['P1', 'M3', 'P5', 'M7']);
  });
});

describe('across every mode of every family', () => {
  it('names each chord rather than falling back to a description', () => {
    const unnamed: string[] = [];
    for (const family of SCALE_FAMILIES) {
      for (let modeIndex = 0; modeIndex < 7; modeIndex += 1) {
        const scale = buildMode(parseNote('C')!, family, modeIndex);
        for (const seventh of [false, true]) {
          for (const chord of chordsInScale(scale, seventh)) {
            if (chord.unnamed) unnamed.push(`${family.id}/${modeIndex}/${chord.symbol}`);
          }
        }
      }
    }
    expect(unnamed).toEqual([]);
  });

  it('gives every chord three or four distinct notes', () => {
    for (const family of SCALE_FAMILIES) {
      for (let modeIndex = 0; modeIndex < 7; modeIndex += 1) {
        const scale = buildMode(parseNote('C')!, family, modeIndex);
        expect(chordsInScale(scale).every((chord) => chord.notes.length === 3)).toBe(true);
        expect(chordsInScale(scale, true).every((chord) => chord.notes.length === 4)).toBe(true);
      }
    }
  });
});
