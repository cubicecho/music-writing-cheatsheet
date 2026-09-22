/**
 * A song as a list of sections, and how long a chord lasts.
 *
 * The chord map hands you one path at a time. A song is several of them in an order — a verse, a
 * chorus, the verse again — so this is the layer above a route: named slots, the running order,
 * and the one piece of timing they all share. Sections hold `ProgressionStep`s like every other
 * progression here, which is to say scale degrees, so a whole song rereads itself in a new key
 * rather than being lost by one.
 *
 * **Every chord lasts the same number of beats, on purpose.** A per-chord duration is a
 * sequencer, and the thing that makes this useful for writing is the opposite of a sequencer: two
 * bars of C is C twice. Repeating a chord is how you say "stay here", which is also how a chord
 * chart is written on paper.
 *
 * Pure, and outside `music/` because none of it is theory — what a section is called and where it
 * sits in the running order are facts about a song, not about a scale.
 */

import type { ProgressionStep } from './music';

/**
 * What a section can be called.
 *
 * A closed list rather than free text: these are the parts songs are actually built from, a list
 * says so, and two people who both call it a pre-chorus spell it the same way.
 */
export const SECTION_LABELS = ['Intro', 'Verse', 'Pre-chorus', 'Chorus', 'Bridge', 'Solo', 'Outro'] as const;

export type SectionLabel = (typeof SECTION_LABELS)[number];

export type SongSection = {
  /** Position is not identity here: a song may hold two verses and move them past each other. */
  id: string;
  label: SectionLabel;
  steps: ProgressionStep[];
};

export type Song = {
  sections: SongSection[];
  /** The section a click on the chart appends to. */
  activeId: string;
  /** How long every chord lasts, in beats. */
  beats: number;
  bpm: number;
};

/** One bar in four, and a tempo a song is usually written near. */
export const DEFAULT_BEATS = 4;
export const DEFAULT_TEMPO = 100;

/** 5 and 7 are missing because nothing that picks a length for *every* chord wants them. */
export const BEAT_CHOICES = [1, 2, 3, 4, 6, 8] as const;
export const TEMPO_CHOICES = [60, 70, 80, 90, 100, 110, 120, 140, 160] as const;

let counter = 0;
const nextId = (): string => {
  counter += 1;
  return `section-${counter}`;
};

export function newSection(label: SectionLabel = 'Verse'): SongSection {
  return { id: nextId(), label, steps: [] };
}

export function newSong(): Song {
  const first = newSection();
  return { sections: [first], activeId: first.id, beats: DEFAULT_BEATS, bpm: DEFAULT_TEMPO };
}

/**
 * What to call each section on screen.
 *
 * A label that appears once is left alone — a song has one bridge and calling it "Bridge 1" is
 * noise. A label used more than once is numbered in running order, which is how people refer to
 * them out loud: second verse, not the verse after the chorus.
 */
export function sectionNames(sections: readonly SongSection[]): string[] {
  const total = new Map<string, number>();
  for (const section of sections) total.set(section.label, (total.get(section.label) ?? 0) + 1);

  const seen = new Map<string, number>();
  return sections.map((section) => {
    if ((total.get(section.label) ?? 0) < 2) return section.label;
    const ordinal = (seen.get(section.label) ?? 0) + 1;
    seen.set(section.label, ordinal);
    return `${section.label} ${ordinal}`;
  });
}

function withSections(song: Song, sections: SongSection[]): Song {
  return { ...song, sections };
}

function mapSection(song: Song, id: string, change: (section: SongSection) => SongSection): Song {
  return withSections(
    song,
    song.sections.map((section) => (section.id === id ? change(section) : section)),
  );
}

export function activateSection(song: Song, id: string): Song {
  return song.sections.some((section) => section.id === id) ? { ...song, activeId: id } : song;
}

/** Appends to the active section, which is the only one the chart is pointed at. */
export function appendStep(song: Song, step: ProgressionStep): Song {
  return mapSection(song, song.activeId, (section) => ({ ...section, steps: [...section.steps, step] }));
}

export function removeStep(song: Song, id: string, position: number): Song {
  return mapSection(song, id, (section) => ({
    ...section,
    steps: section.steps.filter((_, index) => index !== position),
  }));
}

export function clearSection(song: Song, id: string): Song {
  return mapSection(song, id, (section) => ({ ...section, steps: [] }));
}

export function renameSection(song: Song, id: string, label: SectionLabel): Song {
  return mapSection(song, id, (section) => ({ ...section, label }));
}

/** A new section goes on the end and takes the focus, because you added it to fill it. */
export function addSection(song: Song, label: SectionLabel = 'Verse'): Song {
  const section = newSection(label);
  return { ...song, sections: [...song.sections, section], activeId: section.id };
}

/**
 * Copies a section in beside the one it came from.
 *
 * Beside, rather than on the end, because the reason to copy a chorus is that another one goes
 * here — and the copy takes the focus, since a copy is usually the thing you are about to change.
 */
export function duplicateSection(song: Song, id: string): Song {
  const index = song.sections.findIndex((section) => section.id === id);
  if (index === -1) return song;

  const copy: SongSection = {
    id: nextId(),
    label: song.sections[index]!.label,
    steps: [...song.sections[index]!.steps],
  };
  const sections = [...song.sections];
  sections.splice(index + 1, 0, copy);
  return { ...song, sections, activeId: copy.id };
}

export function moveSection(song: Song, id: string, delta: -1 | 1): Song {
  const index = song.sections.findIndex((section) => section.id === id);
  const target = index + delta;
  if (index === -1 || target < 0 || target >= song.sections.length) return song;

  const sections = [...song.sections];
  [sections[index], sections[target]] = [sections[target]!, sections[index]!];
  return withSections(song, sections);
}

/**
 * Removes a section, unless it is the last one — a song with no sections has nowhere to put the
 * next chord, and the chart would have nothing to point at. Clearing is what emptying one is for.
 */
export function removeSection(song: Song, id: string): Song {
  if (song.sections.length < 2) return song;

  const index = song.sections.findIndex((section) => section.id === id);
  if (index === -1) return song;

  const sections = song.sections.filter((section) => section.id !== id);
  // Losing the section you were adding to should leave you adding to its neighbour, not to
  // whatever happened to be first.
  const activeId = song.activeId === id ? sections[Math.max(0, index - 1)]!.id : song.activeId;
  return { ...song, sections, activeId };
}

/** Every chord in the song, in playing order. */
export function songSteps(song: Song): ProgressionStep[] {
  return song.sections.flatMap((section) => section.steps);
}

/** Which section the nth chord of the whole song belongs to, and where it sits inside it. */
export function locateChord(song: Song, index: number): { sectionId: string; position: number } | undefined {
  let remaining = index;
  for (const section of song.sections) {
    if (remaining < section.steps.length) return { sectionId: section.id, position: remaining };
    remaining -= section.steps.length;
  }
  return undefined;
}

/** How long one chord lasts, in milliseconds — the number `playSequence` schedules on. */
export function chordMs(song: Song): number {
  return (60_000 / song.bpm) * song.beats;
}

export function songSeconds(song: Song): number {
  return (songSteps(song).length * chordMs(song)) / 1000;
}

/** `m:ss`, the way a track length is written. */
export function formatClock(seconds: number): string {
  const whole = Math.round(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}
