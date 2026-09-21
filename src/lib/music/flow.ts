/**
 * The common-chord-progressions flowchart, as data.
 *
 * The chart every theory book draws — tonic on the left, pre-dominants in the middle, the
 * dominant on the right, an arrow home — is not a list of progressions. It is a list of *moves*,
 * and the progressions people name are paths through it. Storing the moves rather than the paths
 * is what turns the chart into something you can walk: from wherever you are, it can say what
 * usually happens next and why, and the answer is a real chord in the key you have open.
 *
 * Like `progressions.ts`, everything here is a scale degree, so one chart reads correctly in every
 * key. What it cannot be is one chart for every *family*: the move a chord makes depends on what
 * sits a step under the tonic. With a leading tone, the seventh degree is a diminished chord that
 * has to resolve up a half step, and it belongs with the dominant. With a subtonic — natural
 * minor's whole step — it is a major triad that resolves nowhere and travels everywhere, and
 * half the moves on the chart change with it. That difference is read off the family's own
 * intervals rather than off a hand-kept list of family ids, so a family added later gets the right
 * chart by having the notes it has.
 *
 * The chart is not a rule. It is what the common repertoire does often enough to be worth knowing
 * before you decide to do something else, which is why the UI lets you play any chord at any point
 * and only marks whether the chart saw it coming.
 */

import { type Chord, chordOnDegree } from './chords';
import type { Note } from './pitch';
import { buildScale, type ScaleFamily } from './scales';

/** What a chord is doing where it stands, which is what the chart's columns are. */
export type HarmonicRole = 'tonic' | 'pre-dominant' | 'dominant';

/** Whether the seventh degree is a half step under the tonic or a whole one. */
export type SeventhKind = 'leading-tone' | 'subtonic';

/**
 * How well-trodden a move is.
 *
 * Three levels rather than two because the useful distinction is not right/wrong: `strong` is the
 * move the chart exists to teach, `common` is ordinary, and `colour` is the one that is rarer and
 * usually deliberate.
 */
export type MoveStrength = 'strong' | 'common' | 'colour';

export type FlowMove = {
  /** 0-based degree the move lands on. */
  to: number;
  strength: MoveStrength;
  /** Why this move goes where it does. */
  note: string;
};

export type FlowNode = {
  /** 0-based degree the chord is built on. */
  degree: number;
  /** The degree's own name — Tonic, Subdominant, Leading tone. */
  name: string;
  role: HarmonicRole;
  /** What this chord is for, in one line. */
  blurb: string;
  moves: FlowMove[];
};

/** The columns, left to right, and what each one is for. */
export const FLOW_ROLES: { role: HarmonicRole; label: string; hint: string }[] = [
  {
    role: 'tonic',
    label: 'Home',
    hint: 'Where a phrase can rest. From here anything is available, which is what makes it home.',
  },
  {
    role: 'pre-dominant',
    label: 'Setting up',
    hint: 'A step away from home, chosen mostly for where it goes next.',
  },
  {
    role: 'dominant',
    label: 'The pull',
    hint: 'Unstable on purpose. Everything here is heard as wanting the tonic back.',
  },
];

type MoveSpec = FlowMove & { only?: SeventhKind };
type NodeSpec = Omit<FlowNode, 'moves'> & { only?: SeventhKind; moves: MoveSpec[] };

/**
 * Every move the chart draws, by the degree it starts on.
 *
 * `only` marks the moves that exist in one kind of key and not the other — see the module header.
 * Everything unmarked is true either way, which is most of it: the pull of the dominant and the
 * job of a pre-dominant do not care whether the key is major or minor.
 */
const NODES: NodeSpec[] = [
  {
    degree: 0,
    name: 'Tonic',
    role: 'tonic',
    blurb:
      'Home. Every other chord is heard as a distance from this one, so it is the only chord that can go anywhere.',
    moves: [
      {
        to: 3,
        strength: 'strong',
        note: 'Out to the subdominant — the oldest move in the book, and the one that opens a phrase without threatening to end it.',
      },
      {
        to: 4,
        strength: 'strong',
        note: 'Straight to the dominant, which turns the next bar into a question with one answer.',
      },
      {
        to: 1,
        strength: 'common',
        note: 'Into the supertonic: the long way to the same dominant, and the smoother one.',
      },
      {
        to: 5,
        strength: 'common',
        note: 'To the submediant, the other side of the key. Same seven notes, opposite mood.',
      },
      {
        to: 2,
        strength: 'colour',
        note: 'To the mediant. It shares two notes with home, so it is barely a move — which is the point of it.',
      },
      {
        to: 6,
        strength: 'colour',
        only: 'leading-tone',
        note: 'Onto the leading-tone chord. Diminished and a half step under the tonic, so it is already leaning back.',
      },
      {
        to: 6,
        strength: 'common',
        only: 'subtonic',
        note: 'Down a whole step to the flat seven. No leading tone in it, so nothing pulls — it just goes, which is why rock lives here.',
      },
    ],
  },
  {
    degree: 1,
    name: 'Supertonic',
    role: 'pre-dominant',
    blurb: 'A pre-dominant. It exists to set up the dominant, and it is the smoothest way in.',
    moves: [
      {
        to: 4,
        strength: 'strong',
        note: 'ii–V. The root falls a fourth and the 7th of one chord becomes the 3rd of the next, so the voices barely move while the harmony travels.',
      },
      {
        to: 6,
        strength: 'common',
        only: 'leading-tone',
        note: 'To the other dominant-function chord — the V’s sound without its root under it.',
      },
      {
        to: 0,
        strength: 'colour',
        note: 'Home without the dominant. Weaker, and sometimes exactly what the line wants.',
      },
    ],
  },
  {
    degree: 2,
    name: 'Mediant',
    role: 'tonic',
    blurb:
      'The rarest chord in the key. It shares notes with the tonic on one side and the dominant on the other, which makes it easy to pass through and hard to sit on.',
    moves: [
      {
        to: 5,
        strength: 'strong',
        note: 'Down to the submediant: roots a fourth apart, two notes in common, and the standard way out of the mediant.',
      },
      { to: 3, strength: 'common', note: 'Out to the subdominant and into the pre-dominant half of the chart.' },
      { to: 1, strength: 'colour', note: 'Straight to the other pre-dominant, skipping the scenic route.' },
      {
        to: 6,
        strength: 'common',
        only: 'subtonic',
        note: 'Down a fourth to the flat seven — the second half of the rock-minor loop.',
      },
    ],
  },
  {
    degree: 3,
    name: 'Subdominant',
    role: 'pre-dominant',
    blurb:
      'A pre-dominant, and the other direction out of home: one step away from the tonic, away from the dominant rather than towards it.',
    moves: [
      {
        to: 4,
        strength: 'strong',
        note: 'IV–V. The plainest approach to the dominant there is, and most of folk, country and punk.',
      },
      {
        to: 1,
        strength: 'common',
        note: 'Sideways to the other pre-dominant. Same job, roots a third apart, and it buys you another bar before the dominant.',
      },
      {
        to: 6,
        strength: 'common',
        only: 'leading-tone',
        note: 'To the leading-tone chord, which is the dominant with a different note in the bass.',
      },
      {
        to: 0,
        strength: 'common',
        note: 'Straight home — the plagal cadence, the “amen”. It settles without ever having asked the question.',
      },
    ],
  },
  {
    degree: 4,
    name: 'Dominant',
    role: 'dominant',
    blurb:
      'The chord that is not stable. It contains the note a half step under the tonic in most keys, and the ear hears that as an instruction.',
    moves: [
      { to: 0, strength: 'strong', note: 'The authentic cadence. This is what the whole chart is pointing at.' },
      {
        to: 5,
        strength: 'common',
        note: 'The deceptive cadence: the ear has already heard the tonic coming and gets the submediant instead.',
      },
    ],
  },
  {
    degree: 5,
    name: 'Submediant',
    role: 'tonic',
    blurb:
      'A tonic substitute — two notes in common with home, and a different colour. Where a loop usually turns around.',
    moves: [
      {
        to: 1,
        strength: 'strong',
        note: 'Into the supertonic and on towards the dominant. The first half of most turnarounds.',
      },
      { to: 3, strength: 'strong', note: 'To the subdominant, which is the four-chord loop everybody already knows.' },
      { to: 4, strength: 'common', note: 'Skipping the pre-dominant and going straight for the cadence.' },
      {
        to: 6,
        strength: 'common',
        only: 'subtonic',
        note: 'Up a step to the flat seven, or down from it — this pair is the whole epic-minor sound.',
      },
      {
        to: 2,
        strength: 'colour',
        only: 'subtonic',
        note: 'To the mediant, which in a minor key is the relative major: this move is that key’s own IV–I, heard from inside the minor.',
      },
    ],
  },
  {
    degree: 6,
    only: 'leading-tone',
    name: 'Leading tone',
    role: 'dominant',
    blurb:
      'A diminished chord a half step under the tonic — the dominant with its root taken off. It cannot stay where it is.',
    moves: [
      { to: 0, strength: 'strong', note: 'Up a half step, home. The resolution the chord is named for.' },
      {
        to: 4,
        strength: 'colour',
        note: 'Hand over to the dominant proper and let it do the same job with a root under it.',
      },
    ],
  },
  {
    degree: 6,
    only: 'subtonic',
    name: 'Subtonic',
    role: 'dominant',
    blurb:
      'The flat seven: a whole step under the tonic instead of a half, so there is no leading tone in it. It pushes rather than pulls, which is why it can go almost anywhere.',
    moves: [
      {
        to: 0,
        strength: 'strong',
        note: '♭VII–i. A cadence with no leading tone in it at all — modal rather than functional, and the sound of most rock in a minor key.',
      },
      {
        to: 2,
        strength: 'common',
        note: 'To the mediant. In a minor key that is the relative major, and this move is its own V–I.',
      },
      { to: 3, strength: 'common', note: 'Across to the subdominant, which keeps the descent going.' },
      {
        to: 5,
        strength: 'common',
        note: 'Down to the submediant — the next step of the walk down that the Andalusian cadence finishes.',
      },
    ],
  },
];

/**
 * Whether the family's seventh degree is a leading tone or a subtonic.
 *
 * Read off the intervals rather than off the family id, so this is still right for a family added
 * to `SCALE_FAMILIES` tomorrow. Eleven semitones is a half step under the octave; anything else is
 * a whole step or more and does not pull.
 */
export function seventhKind(family: ScaleFamily): SeventhKind {
  return family.intervals[6] === 11 ? 'leading-tone' : 'subtonic';
}

/** The chart for one family: its seven nodes, each with the moves that exist in this kind of key. */
export function harmonyFlow(family: ScaleFamily): FlowNode[] {
  const kind = seventhKind(family);
  const applies = (spec: { only?: SeventhKind }) => spec.only === undefined || spec.only === kind;

  return NODES.filter(applies).map(({ only: _only, moves, ...node }) => ({
    ...node,
    moves: moves.filter(applies).map(({ only: _moveOnly, ...move }) => move),
  }));
}

/** The node for one degree of the chart. */
export function flowNode(family: ScaleFamily, degree: number): FlowNode {
  const node = harmonyFlow(family).find((candidate) => candidate.degree === degree);
  if (!node) throw new Error(`No chart node for degree ${degree}`);
  return node;
}

/** The move from one degree to another, when the chart draws one. */
export function flowMove(family: ScaleFamily, from: number, to: number): FlowMove | undefined {
  return flowNode(family, from).moves.find((move) => move.to === to);
}

export type FlowChord = { node: FlowNode; chord: Chord };

/** The chart's nodes as the chords they actually are in one key. */
export function realizeFlow(tonic: Note, family: ScaleFamily, seventh = false): FlowChord[] {
  const scale = buildScale(tonic, family.intervals);
  return harmonyFlow(family).map((node) => ({ node, chord: chordOnDegree(scale, node.degree, seventh) }));
}
