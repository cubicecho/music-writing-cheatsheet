import { describe, expect, it } from 'vitest';
import { flowMove, flowNode, harmonyFlow, realizeFlow, seventhKind } from './flow';
import { parseNote } from './pitch';
import { findProgression, PROGRESSIONS } from './progressions';
import { findFamily, SCALE_FAMILIES } from './scales';

const chart = (familyId: string) => harmonyFlow(findFamily(familyId));

const chordsOf = (tonic: string, familyId: string) =>
  realizeFlow(parseNote(tonic)!, findFamily(familyId)).map(({ chord }) => chord.symbol);

const columnOf = (familyId: string, role: string) =>
  chart(familyId)
    .filter((node) => node.role === role)
    .map((node) => node.degree);

describe('the chart a family gets', () => {
  it('gives every family seven nodes, one per degree', () => {
    for (const family of SCALE_FAMILIES) {
      expect(harmonyFlow(family).map((node) => node.degree)).toEqual([0, 1, 2, 3, 4, 5, 6]);
    }
  });

  it('reads the seventh degree off the notes, not off the family’s name', () => {
    expect(seventhKind(findFamily('major'))).toBe('leading-tone');
    expect(seventhKind(findFamily('natural-minor'))).toBe('subtonic');
    // Harmonic minor exists to put the leading tone back, so it gets the major key's chart.
    expect(seventhKind(findFamily('harmonic-minor'))).toBe('leading-tone');
    expect(seventhKind(findFamily('melodic-minor'))).toBe('leading-tone');
  });

  it('calls the seventh degree a leading tone only where it is one', () => {
    expect(flowNode(findFamily('major'), 6).name).toBe('Leading tone');
    expect(flowNode(findFamily('natural-minor'), 6).name).toBe('Subtonic');
  });

  it('puts the dominant column where the pull actually is', () => {
    expect(columnOf('major', 'dominant')).toEqual([4, 6]);
    expect(columnOf('major', 'pre-dominant')).toEqual([1, 3]);
    expect(columnOf('major', 'tonic')).toEqual([0, 2, 5]);
  });

  it('never draws a move to a degree it has no node for', () => {
    for (const family of SCALE_FAMILIES) {
      const degrees = harmonyFlow(family).map((node) => node.degree);
      for (const node of harmonyFlow(family)) {
        for (const move of node.moves) {
          expect(degrees).toContain(move.to);
          expect(move.to).not.toBe(node.degree);
        }
      }
    }
  });

  it('gives each node at most one move to any one degree', () => {
    for (const family of SCALE_FAMILIES) {
      for (const node of harmonyFlow(family)) {
        const targets = node.moves.map((move) => move.to);
        expect(new Set(targets).size).toBe(targets.length);
      }
    }
  });
});

describe('what the chart says about the dominant', () => {
  it('makes the cadence the strongest move on the chart', () => {
    expect(flowMove(findFamily('major'), 4, 0)?.strength).toBe('strong');
    expect(flowMove(findFamily('natural-minor'), 4, 0)?.strength).toBe('strong');
  });

  it('keeps the deceptive cadence, which is the only other place a dominant goes', () => {
    expect(flowNode(findFamily('major'), 4).moves.map((move) => move.to)).toEqual([0, 5]);
  });

  it('sends a leading-tone chord home and a subtonic one anywhere', () => {
    expect(flowNode(findFamily('major'), 6).moves.map((move) => move.to)).toEqual([0, 4]);
    expect(flowNode(findFamily('natural-minor'), 6).moves.map((move) => move.to)).toEqual([0, 2, 3, 5]);
  });

  it('offers the flat seven from the tonic in a minor key and not in a major one', () => {
    expect(flowMove(findFamily('natural-minor'), 0, 6)?.strength).toBe('common');
    // Major has the move too, but onto a diminished chord, which is a different thing to do.
    expect(flowMove(findFamily('major'), 0, 6)?.strength).toBe('colour');
    expect(flowMove(findFamily('major'), 5, 6)).toBeUndefined();
    expect(flowMove(findFamily('natural-minor'), 5, 6)?.strength).toBe('common');
  });
});

describe('the chart against the progressions people actually wrote', () => {
  /** Every consecutive pair of a named progression, checked against the chart's moves. */
  const walk = (progressionId: string, familyId: string) => {
    const family = findFamily(familyId);
    const { steps } = findProgression(progressionId);
    return steps
      .slice(1)
      .map((step, index) => ({ from: steps[index]!.degree, to: step.degree }))
      .filter(({ from, to }) => from !== to)
      .filter(({ from, to }) => flowMove(family, from, to) === undefined);
  };

  it('endorses every move of the major-key standards', () => {
    expect(walk('four-chords', 'major')).toEqual([]);
    expect(walk('doo-wop', 'major')).toEqual([]);
    expect(walk('three-chords', 'major')).toEqual([]);
    expect(walk('two-five-one', 'major')).toEqual([]);
    expect(walk('turnaround', 'major')).toEqual([]);
  });

  it('endorses every move of the minor-key standards', () => {
    expect(walk('minor-four', 'natural-minor')).toEqual([]);
    expect(walk('rock-minor', 'natural-minor')).toEqual([]);
    expect(walk('andalusian', 'natural-minor')).toEqual([]);
    expect(walk('minor-cadence', 'natural-minor')).toEqual([]);
  });

  it('does not pretend to cover everything — Pachelbel walks off the chart', () => {
    // V–vi is on the chart and vi–iii is not: the canon descends where the chart ascends, which is
    // a real thing about the canon rather than a gap to paper over.
    expect(walk('canon', 'major')).toEqual([{ from: 5, to: 2 }]);
  });

  it('refuses the blues its V–IV, which is the whole reason the blues is not a functional form', () => {
    // Bar 9 to bar 10. Every chart of common practice draws the arrow the other way, and the blues
    // goes backwards down it — so the honest answer is that the chart does not cover this, not that
    // the move is wrong. Everything else in the twelve bars it does cover.
    expect(walk('twelve-bar', 'major')).toEqual([{ from: 4, to: 3 }]);
  });

  it('leaves no named progression more than one move off the chart in its own family', () => {
    for (const progression of PROGRESSIONS) {
      for (const familyId of progression.families) {
        expect(walk(progression.id, familyId).length).toBeLessThanOrEqual(1);
      }
    }
  });
});

describe('realising the chart in a key', () => {
  it('lays C major out as the chords everybody already knows', () => {
    expect(chordsOf('C', 'major')).toEqual(['C', 'Dm', 'Em', 'F', 'G', 'Am', 'B°']);
  });

  it('gives A minor the flat seven where a major key has a diminished chord', () => {
    expect(chordsOf('A', 'natural-minor')).toEqual(['Am', 'B°', 'C', 'Dm', 'Em', 'F', 'G']);
  });

  it('spells the chart in the key’s own accidentals', () => {
    expect(chordsOf('F#', 'major')).toEqual(['F♯', 'G♯m', 'A♯m', 'B', 'C♯', 'D♯m', 'E♯°']);
  });

  it('follows the family: harmonic minor’s dominant is major and its seventh is diminished', () => {
    expect(chordsOf('A', 'harmonic-minor')).toEqual(['Am', 'B°', 'C+', 'Dm', 'E', 'F', 'G♯°']);
  });
});
