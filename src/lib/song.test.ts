import { describe, expect, it } from 'vitest';
import {
  activateSection,
  addSection,
  appendStep,
  chordMs,
  clearSection,
  duplicateSection,
  formatClock,
  locateChord,
  moveSection,
  newSong,
  removeSection,
  removeStep,
  renameSection,
  type SectionLabel,
  type Song,
  sectionNames,
  sectionOrdinals,
  songSeconds,
  songSteps,
} from './song';

/** A song of one section per label, each holding as many chords as it is given. */
const songOf = (...sections: [SectionLabel, number[]][]): Song => {
  let song = newSong();
  sections.forEach(([label, degrees], index) => {
    if (index > 0) song = addSection(song);
    song = renameSection(song, song.activeId, label);
    for (const degree of degrees) song = appendStep(song, { degree });
  });
  return song;
};

const degreesOf = (song: Song) => song.sections.map((section) => section.steps.map((step) => step.degree));
const labelsOf = (song: Song) => song.sections.map((section) => section.label);

describe('a new song', () => {
  it('starts as one empty verse, so there is somewhere to put the first chord', () => {
    const song = newSong();
    expect(song.sections).toHaveLength(1);
    expect(song.sections[0]!.label).toBe('Verse');
    expect(song.sections[0]!.steps).toEqual([]);
    expect(song.activeId).toBe(song.sections[0]!.id);
  });

  it('gives every section its own id, so two verses are still two sections', () => {
    const song = addSection(newSong());
    expect(song.sections[0]!.id).not.toBe(song.sections[1]!.id);
  });
});

describe('what a section is called', () => {
  it('leaves a label that appears once alone', () => {
    expect(sectionNames(songOf(['Intro', []], ['Verse', []], ['Bridge', []]).sections)).toEqual([
      'Intro',
      'Verse',
      'Bridge',
    ]);
  });

  it('numbers a label that repeats, in running order', () => {
    expect(sectionNames(songOf(['Verse', []], ['Chorus', []], ['Verse', []]).sections)).toEqual([
      'Verse 1',
      'Chorus',
      'Verse 2',
    ]);
  });

  it('renumbers when the order changes rather than carrying a number around', () => {
    const song = songOf(['Verse', [0]], ['Chorus', [3]], ['Verse', [4]]);
    const moved = moveSection(song, song.sections[2]!.id, -1);
    expect(sectionNames(moved.sections)).toEqual(['Verse 1', 'Verse 2', 'Chorus']);
  });

  it('hands out the number on its own, for a picker that shows the label and the number apart', () => {
    const song = songOf(['Verse', []], ['Chorus', []], ['Verse', []], ['Bridge', []]);
    expect(sectionOrdinals(song.sections)).toEqual([1, undefined, 2, undefined]);
  });
});

describe('editing a song', () => {
  it('appends to the active section and nowhere else', () => {
    let song = songOf(['Verse', [0, 5]], ['Chorus', [3]]);
    song = activateSection(song, song.sections[0]!.id);
    song = appendStep(song, { degree: 4 });
    expect(degreesOf(song)).toEqual([[0, 5, 4], [3]]);
  });

  it('takes one chord out by position, since a section may pass through a chord twice', () => {
    let song = songOf(['Verse', [0, 3, 0]]);
    song = removeStep(song, song.sections[0]!.id, 0);
    expect(degreesOf(song)).toEqual([[3, 0]]);
  });

  it('empties a section without taking its place in the song', () => {
    let song = songOf(['Verse', [0, 3]], ['Chorus', [4]]);
    song = clearSection(song, song.sections[0]!.id);
    expect(degreesOf(song)).toEqual([[], [4]]);
    expect(song.sections).toHaveLength(2);
  });

  it('copies a section in beside itself, chords and all, and lands on the copy', () => {
    const song = songOf(['Verse', [0, 5]], ['Chorus', [3]]);
    const copied = duplicateSection(song, song.sections[0]!.id);
    expect(degreesOf(copied)).toEqual([[0, 5], [0, 5], [3]]);
    expect(copied.activeId).toBe(copied.sections[1]!.id);
    expect(copied.sections[1]!.id).not.toBe(copied.sections[0]!.id);
  });

  it('copies the chords rather than sharing them, so editing the copy leaves the original', () => {
    const original = songOf(['Verse', [0]]);
    const copied = duplicateSection(original, original.sections[0]!.id);
    const edited = appendStep(copied, { degree: 4 });
    expect(degreesOf(edited)).toEqual([[0], [0, 4]]);
  });

  it('leaves the song alone when asked to copy a section it does not have', () => {
    const song = songOf(['Verse', [0]]);
    expect(duplicateSection(song, 'no-such-section')).toEqual(song);
  });

  it('moves a section past its neighbour, and refuses to move one off either end', () => {
    const song = songOf(['Verse', [0]], ['Chorus', [3]]);
    expect(labelsOf(moveSection(song, song.sections[1]!.id, -1))).toEqual(['Chorus', 'Verse']);
    expect(labelsOf(moveSection(song, song.sections[0]!.id, -1))).toEqual(['Verse', 'Chorus']);
    expect(labelsOf(moveSection(song, song.sections[1]!.id, 1))).toEqual(['Verse', 'Chorus']);
  });

  it('keeps the last section, because the chart needs somewhere to add to', () => {
    const song = songOf(['Verse', [0]]);
    expect(removeSection(song, song.sections[0]!.id)).toEqual(song);
  });

  it('hands the focus to the neighbour when the active section is removed', () => {
    const song = songOf(['Verse', [0]], ['Chorus', [3]], ['Outro', [0]]);
    const removed = removeSection(activateSection(song, song.sections[1]!.id), song.sections[1]!.id);
    expect(removed.activeId).toBe(removed.sections[0]!.id);
    expect(labelsOf(removed)).toEqual(['Verse', 'Outro']);
  });
});

describe('the running order', () => {
  it('plays the sections in order, end to end', () => {
    const song = songOf(['Verse', [0, 5]], ['Chorus', [3, 4]]);
    expect(songSteps(song).map((step) => step.degree)).toEqual([0, 5, 3, 4]);
  });

  it('says which section the nth chord of the whole song came from', () => {
    const song = songOf(['Verse', [0, 5]], ['Chorus', [3]]);
    expect(locateChord(song, 0)).toEqual({ sectionId: song.sections[0]!.id, position: 0 });
    expect(locateChord(song, 2)).toEqual({ sectionId: song.sections[1]!.id, position: 0 });
    expect(locateChord(song, 3)).toBeUndefined();
  });

  it('steps over an empty section rather than counting it as a beat', () => {
    const song = songOf(['Intro', []], ['Verse', [0]]);
    expect(locateChord(song, 0)).toEqual({ sectionId: song.sections[1]!.id, position: 0 });
  });
});

describe('time', () => {
  it('turns beats and a tempo into the length of one chord', () => {
    expect(chordMs({ ...newSong(), beats: 4, bpm: 120 })).toBe(2000);
    expect(chordMs({ ...newSong(), beats: 1, bpm: 60 })).toBe(1000);
  });

  it('is the same length whether a chord repeats or a section does', () => {
    const twice = songOf(['Verse', [0, 0]]);
    const two = songOf(['Verse', [0]], ['Verse', [0]]);
    expect(songSeconds(twice)).toBe(songSeconds(two));
  });

  it('writes a length the way a track length is written', () => {
    expect(formatClock(8)).toBe('0:08');
    expect(formatClock(72)).toBe('1:12');
  });
});
