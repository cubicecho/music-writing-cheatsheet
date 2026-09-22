import { SectionHeading } from '@/components/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus } from '@/components/ui/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Note, ScaleFamily } from '@/lib/music';
import { realizeSteps } from '@/lib/music';
import type { SectionLabel, Song } from '@/lib/song';
import {
  activateSection,
  addSection,
  BEAT_CHOICES,
  chordMs,
  clearSection,
  duplicateSection,
  formatClock,
  locateChord,
  moveSection,
  removeSection,
  removeStep,
  renameSection,
  sectionNames,
  songSeconds,
  songSteps,
  TEMPO_CHOICES,
} from '@/lib/song';
import { FlowRoute } from './FlowRoute';
import { PlayButton } from './PlayButton';
import { useSequence } from './useSequence';

type SongPanelProps = {
  tonic: Note;
  tonicLabel: string;
  family: ScaleFamily;
  seventh: boolean;
  song: Song;
  onChange: (song: Song) => void;
};

/** The same label-over-control shape the key picker uses, so the two bars read as one kind of thing. */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <SectionHeading variant="overline">{label}</SectionHeading>
      {children}
    </div>
  );
}

/**
 * A song: several routes through the chart, in the order they play.
 *
 * One path is a progression; a song is a verse, a chorus and the verse again, which is a different
 * thing to hold — hence slots rather than one list. The slots are named from a closed set because
 * the names are the parts songs are made of, and they are numbered by the song rather than by the
 * writer, so moving the second verse above the first renames both.
 *
 * Timing is one setting for everything here, and that is the whole design: a chord lasts a fixed
 * number of beats, so two bars of C is C twice. That is how a chord chart is written on paper, it
 * keeps the arithmetic out of the way while you are choosing chords, and it means the only thing
 * this panel has to schedule is a list.
 */
export function SongPanel({ tonic, tonicLabel, family, seventh, song, onChange }: SongPanelProps) {
  const names = sectionNames(song.sections);
  const steps = songSteps(song);
  const beatMs = chordMs(song);
  const { playing, step, toggle } = useSequence(
    realizeSteps(tonic, family, steps, seventh).map((entry) => entry.chord),
    { beatMs },
  );
  // One playhead for the whole song, handed to whichever section owns the chord it is on.
  const at = step === null ? undefined : locateChord(song, step);

  return (
    <Card>
      <CardHeader className="gap-4 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">Song</CardTitle>
          <span className="text-muted-foreground text-sm">
            in {tonicLabel} {family.name.toLowerCase()}
            {steps.length > 0
              ? ` · ${steps.length} ${steps.length === 1 ? 'chord' : 'chords'} · ${formatClock(songSeconds(song))}`
              : null}
          </span>
          {steps.length > 0 ? (
            <PlayButton
              playing={playing}
              onClick={toggle}
              label={playing ? 'Stop' : 'Play song'}
              title={`${playing ? 'Stop' : 'Play'} the whole song in ${tonicLabel}`}
            />
          ) : null}
        </div>

        <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
          <Field label="Chord length">
            <Select value={String(song.beats)} onValueChange={(next) => onChange({ ...song, beats: Number(next) })}>
              <SelectTrigger className="w-36">
                <SelectValue>{beatsLabel(song.beats)}</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {BEAT_CHOICES.map((beats) => (
                  <SelectItem key={beats} value={String(beats)}>
                    {beatsLabel(beats)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field label="Tempo">
            <Select value={String(song.bpm)} onValueChange={(next) => onChange({ ...song, bpm: Number(next) })}>
              <SelectTrigger className="w-32">
                <SelectValue>{song.bpm} BPM</SelectValue>
              </SelectTrigger>
              <SelectContent>
                {TEMPO_CHOICES.map((bpm) => (
                  <SelectItem key={bpm} value={String(bpm)}>
                    {bpm} BPM
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <p className="max-w-sm text-muted-foreground text-sm">
            Every chord lasts the same time, so a chord that stays for two bars is that chord twice — C, C, Am, G is two
            bars of C at four beats each.
          </p>
        </div>
      </CardHeader>

      <CardContent className="gap-4">
        {song.sections.map((section, index) => (
          <FlowRoute
            key={section.id}
            tonic={tonic}
            family={family}
            seventh={seventh}
            name={names[index]!}
            label={section.label}
            steps={section.steps}
            active={section.id === song.activeId}
            beatMs={beatMs}
            songStep={at?.sectionId === section.id ? at.position : null}
            songPlaying={playing}
            canMoveUp={index > 0}
            canMoveDown={index < song.sections.length - 1}
            canDelete={song.sections.length > 1}
            onActivate={() => onChange(activateSection(song, section.id))}
            onLabelChange={(label: SectionLabel) => onChange(renameSection(song, section.id, label))}
            onRemove={(position) => onChange(removeStep(song, section.id, position))}
            onClear={() => onChange(clearSection(song, section.id))}
            onDuplicate={() => onChange(duplicateSection(song, section.id))}
            onDelete={() => onChange(removeSection(song, section.id))}
            onMove={(delta) => onChange(moveSection(song, section.id, delta))}
          />
        ))}

        <div>
          <Button size="xs" variant="outline" onClick={() => onChange(addSection(song))} title="Add a section">
            <Plus className="h-3 w-3" />
            Add section
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

/** "4 beats (a bar)" — the bar count is the part a writer is actually counting in. */
function beatsLabel(beats: number): string {
  const unit = `${beats} ${beats === 1 ? 'beat' : 'beats'}`;
  if (beats === 4) return `${unit} (a bar)`;
  if (beats === 8) return `${unit} (two bars)`;
  return unit;
}
