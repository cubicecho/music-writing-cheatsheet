/**
 * Common chord progressions, stored as the shape they are rather than as chord names.
 *
 * A progression here is a list of scale degrees. That is the whole trick: degrees are the same
 * idea in every key and every family, so one entry realises correctly in A major and in E♭
 * harmonic minor without a second table — and transplanting a major-key shape into a minor scale
 * produces a real, playable progression instead of nonsense, which is a lesson in itself.
 *
 * The exception is the borrowed chord. `borrowedFrom` names another family to take that one chord
 * from, on the same tonic, because some of the most-used progressions in music are not diatonic:
 * the Andalusian cadence needs a major V that natural minor does not contain, and the ♭VII of
 * rock needs a flat 7th the major scale does not contain. Rather than trust the label, the
 * realiser compares the borrowed chord against what the home scale would have given and only
 * calls it borrowed when the notes actually differ.
 */

import { type Chord, chordOnDegree } from './chords';
import type { Note } from './pitch';
import { notesEqual } from './pitch';
import { buildScale, findFamily, SCALE_FAMILIES, type ScaleFamily } from './scales';

export type ProgressionStep = {
  /** 0-based degree of the scale in play. */
  degree: number;
  /** Take this chord from another family on the same tonic. */
  borrowedFrom?: string;
};

export type Progression = {
  id: string;
  name: string;
  steps: ProgressionStep[];
  /** The families this is the native sound of. Elsewhere it still works, as a transplant. */
  families: string[];
  description: string;
  /** Well-known songs built on it. */
  heardIn?: string;
};

const step = (degree: number, borrowedFrom?: string): ProgressionStep =>
  borrowedFrom === undefined ? { degree } : { degree, borrowedFrom };

export const PROGRESSIONS: Progression[] = [
  {
    id: 'four-chords',
    name: 'The four chords',
    steps: [step(0), step(4), step(5), step(3)],
    families: ['major', 'harmonic-major'],
    description:
      'The one a famous comedy routine plays every pop song over. It works because it touches the tonic, the dominant, the relative minor and the subdominant in four moves — the whole key in one loop.',
    heardIn: '"Let It Be", "With or Without You", "Don\'t Stop Believin\'"',
  },
  {
    id: 'axis-minor-first',
    name: 'Four chords, minor first',
    steps: [step(5), step(3), step(0), step(4)],
    families: ['major'],
    description:
      'The same four chords rotated to start on the relative minor. Nothing changes but where the loop begins, and the whole thing turns wistful — the clearest demonstration that a progression is a path, not a set.',
  },
  {
    id: 'doo-wop',
    name: 'Doo-wop',
    steps: [step(0), step(5), step(3), step(4)],
    families: ['major'],
    description:
      'The 1950s ballad loop. It steps down into the relative minor and then walks back up the other side of the key.',
    heardIn: '"Stand By Me", "Earth Angel"',
  },
  {
    id: 'three-chords',
    name: 'Three chords',
    steps: [step(0), step(3), step(4)],
    families: ['major', 'harmonic-major'],
    description:
      'The three major triads a major scale contains, and most of folk, country, blues and punk. Learn these in every key before anything else.',
  },
  {
    id: 'twelve-bar',
    name: '12-bar blues',
    steps: [step(0), step(0), step(0), step(0), step(3), step(3), step(0), step(0), step(4), step(3), step(0), step(4)],
    families: ['major'],
    description:
      'One bar per chord, twelve bars, then round again. The same three chords as above, but the form is the point — where it goes to IV and when it turns around is what makes it a blues.',
  },
  {
    id: 'two-five-one',
    name: 'ii–V–I',
    steps: [step(1), step(4), step(0)],
    families: ['major'],
    description:
      'The cadence jazz is built out of. Each root falls a fourth, and the 7th of one chord becomes the 3rd of the next, so the voices barely move while the harmony travels.',
    heardIn: 'most of the standard repertoire',
  },
  {
    id: 'turnaround',
    name: 'Turnaround',
    steps: [step(0), step(5), step(1), step(4)],
    families: ['major'],
    description:
      'A ii–V–I with two chords in front, landing you back on the tonic ready to start over. The last bars of a jazz chorus, and the whole of "rhythm changes".',
  },
  {
    id: 'flat-seven-rock',
    name: 'The ♭VII of rock',
    steps: [step(0), step(6, 'natural-minor'), step(3)],
    families: ['major'],
    description:
      'A major key with a flat 7th chord dropped in — the one borrowing every rock band does. It is major scale everywhere except that one chord, which comes from the parallel minor.',
    heardIn: '"Sweet Home Alabama", "Sympathy for the Devil"',
  },
  {
    id: 'canon',
    name: "Pachelbel's canon",
    steps: [step(0), step(4), step(5), step(2), step(3), step(0), step(3), step(4)],
    families: ['major'],
    description:
      'Eight chords whose roots walk down the scale in thirds and fourths. Three hundred years old and still turning up in pop choruses.',
  },
  {
    id: 'minor-four',
    name: 'The minor four chords',
    steps: [step(0), step(5), step(2), step(6)],
    families: ['natural-minor'],
    description:
      'The minor-key counterpart of the four chords: a minor tonic and the three major triads sitting above it. Sad and anthemic at the same time, which is why it is everywhere.',
  },
  {
    id: 'rock-minor',
    name: 'Rock minor',
    steps: [step(0), step(2), step(6), step(3)],
    families: ['natural-minor'],
    description:
      'Minor tonic, relative major, flat seven, minor four. No leading tone anywhere, so it never resolves hard — it just keeps going.',
  },
  {
    id: 'andalusian',
    name: 'Andalusian cadence',
    steps: [step(0), step(6, 'natural-minor'), step(5, 'natural-minor'), step(4, 'harmonic-minor')],
    families: ['natural-minor', 'harmonic-minor'],
    description:
      'Four chords walking straight down the scale to a major V. That last chord is the flamenco sound: it needs a raised 7th, which natural minor does not have and harmonic minor exists to supply.',
    heardIn: 'flamenco, "Hit the Road Jack", "Runaway"',
  },
  {
    id: 'minor-cadence',
    name: 'Minor cadence',
    steps: [step(0), step(3), step(4, 'harmonic-minor'), step(0)],
    families: ['natural-minor', 'harmonic-minor'],
    description:
      'i–iv–V–i. The major V is the whole reason harmonic minor was invented: a minor v drifts back to the tonic, a major V drags you there.',
  },
  {
    id: 'minor-two-five-one',
    name: 'Minor ii–V–i',
    steps: [step(1), step(4, 'harmonic-minor'), step(0)],
    families: ['natural-minor', 'harmonic-minor', 'melodic-minor'],
    description:
      'The jazz cadence in a minor key: a half-diminished ii, an altered-sounding V, a minor i. Turn on 7th chords to hear what it is actually doing.',
    heardIn: '"Autumn Leaves", "Blue Bossa"',
  },
  {
    id: 'melodic-minor-lift',
    name: 'Minor tonic, major IV',
    steps: [step(0), step(3), step(4), step(0)],
    families: ['melodic-minor'],
    description:
      'Melodic minor is the only scale here that gives you a minor tonic with a major IV *and* a major V above it. That combination is the entire reason jazz treats it as a scale rather than a rule about melodies.',
  },
  {
    id: 'harmonic-major-plagal',
    name: 'Major with a minor iv',
    steps: [step(0), step(3), step(0)],
    families: ['harmonic-major'],
    description:
      'A major key that leans on a minor subdominant. The ♭6 in that chord is the only note separating harmonic major from the plain major scale, and it does all the work.',
  },
];

export function findProgression(id: string): Progression {
  const progression = PROGRESSIONS.find((candidate) => candidate.id === id);
  if (!progression) throw new Error(`No progression "${id}"`);
  return progression;
}

export type ProgressionChord = {
  chord: Chord;
  /** Set when the chord came from another family *and* differs from the home scale's chord. */
  borrowedFrom?: ScaleFamily;
};

/** The actual chords a list of degrees becomes in one key and one scale family. */
export function realizeSteps(
  tonic: Note,
  family: ScaleFamily,
  steps: ProgressionStep[],
  seventh = false,
): ProgressionChord[] {
  const home = buildScale(tonic, family.intervals);

  return steps.map(({ degree, borrowedFrom }) => {
    const native = chordOnDegree(home, degree, seventh);
    if (borrowedFrom === undefined) return { chord: native };

    const source = findFamily(borrowedFrom);
    const chord = chordOnDegree(buildScale(tonic, source.intervals), degree, seventh);
    // The label says where the chord may come from; whether it is really a borrowing depends on
    // the scale in play, so let the notes decide rather than the label.
    const same = chord.notes.every((note, index) => notesEqual(note, native.notes[index]!));
    return same ? { chord } : { chord, borrowedFrom: source };
  });
}

/** The actual chords a progression becomes in one key and one scale family. */
export function realizeProgression(
  tonic: Note,
  family: ScaleFamily,
  progression: Progression,
  seventh = false,
): ProgressionChord[] {
  return realizeSteps(tonic, family, progression.steps, seventh);
}

export type PaletteEntry = ProgressionChord & { step: ProgressionStep };

/**
 * Every chord within reach of a key: its own seven, and then whatever the other families stand on
 * the same degrees that this one has not already given you.
 *
 * Deduplicating by symbol rather than by family is what keeps the borrowed row short. Four other
 * families offer 28 chords between them and most are chords the key already has — what is left is
 * the handful that are genuinely elsewhere, which is exactly the list worth having in front of you
 * while you write.
 */
export function chordPalette(
  tonic: Note,
  family: ScaleFamily,
  seventh = false,
): { native: PaletteEntry[]; borrowed: PaletteEntry[] } {
  const home = buildScale(tonic, family.intervals);
  const native = home.degrees.map((_, degree) => ({
    step: { degree },
    chord: chordOnDegree(home, degree, seventh),
  }));

  const seen = new Set(native.map((entry) => entry.chord.symbol));
  const borrowed: PaletteEntry[] = [];

  for (const source of SCALE_FAMILIES) {
    if (source.id === family.id) continue;
    const scale = buildScale(tonic, source.intervals);
    scale.degrees.forEach((_, degree) => {
      const chord = chordOnDegree(scale, degree, seventh);
      if (seen.has(chord.symbol)) return;
      seen.add(chord.symbol);
      borrowed.push({ step: { degree, borrowedFrom: source.id }, chord, borrowedFrom: source });
    });
  }

  return { native, borrowed };
}

/** The progressions native to a family, and the rest — which still work, as transplants. */
export function groupProgressions(familyId: string): { native: Progression[]; transplanted: Progression[] } {
  const native = PROGRESSIONS.filter((progression) => progression.families.includes(familyId));
  const transplanted = PROGRESSIONS.filter((progression) => !progression.families.includes(familyId));
  return { native, transplanted };
}
