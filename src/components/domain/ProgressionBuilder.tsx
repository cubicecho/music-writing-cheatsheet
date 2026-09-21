import { SectionHeading } from '@/components/section-heading';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { X } from '@/components/ui/icons';
import { ToggleChip } from '@/components/ui/toggle-chip';
import type { Note, PaletteEntry, ProgressionStep, ScaleFamily } from '@/lib/music';
import { chordPalette, realizeSteps } from '@/lib/music';
import { ChordBlock } from './ChordBlock';
import { PlayButton } from './PlayButton';
import { useSequence } from './useSequence';

type ProgressionBuilderProps = {
  tonic: Note;
  tonicLabel: string;
  family: ScaleFamily;
  seventh: boolean;
  steps: ProgressionStep[];
  onAppend: (step: ProgressionStep) => void;
  onRemove: (position: number) => void;
  onClear: () => void;
};

function Palette({
  label,
  hint,
  entries,
  onAppend,
}: {
  label: string;
  hint: string;
  entries: PaletteEntry[];
  onAppend: (step: ProgressionStep) => void;
}) {
  if (entries.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <SectionHeading variant="overline">{label}</SectionHeading>
        <span className="text-muted-foreground text-sm">{hint}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {entries.map((entry) => (
          <ToggleChip
            key={`${entry.chord.symbol}-${entry.step.degree}`}
            selected={false}
            onClick={() => onAppend(entry.step)}
            size="sm"
          >
            {/* A bare string: ToggleChip only colours a string child for the selected state. */}
            {`${entry.chord.numeral} · ${entry.chord.symbol}`}
          </ToggleChip>
        ))}
      </div>
    </div>
  );
}

/**
 * A sketchpad: click chords to string them together, then listen to what you made.
 *
 * The stored sequence is degrees, exactly like the catalogued progressions, so a change of key or
 * of scale rewrites it rather than losing it — and hearing your own four chords answered by a
 * different scale is the same lesson the transplanted progressions teach, only about something
 * you chose.
 */
export function ProgressionBuilder({
  tonic,
  tonicLabel,
  family,
  seventh,
  steps,
  onAppend,
  onRemove,
  onClear,
}: ProgressionBuilderProps) {
  const { native, borrowed } = chordPalette(tonic, family, seventh);
  // Position is the only identity a step has: a progression may well use one chord twice.
  const chords = realizeSteps(tonic, family, steps, seventh).map((entry, position) => ({
    ...entry,
    id: `${entry.chord.symbol}-${position}`,
    position,
  }));
  const { playing, step: sounding, toggle } = useSequence(chords.map((entry) => entry.chord));

  return (
    <Card>
      <CardHeader className="gap-2 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">Build your own</CardTitle>
          <span className="text-muted-foreground text-sm">
            in {tonicLabel} {family.name.toLowerCase()}
          </span>
          {chords.length > 0 ? (
            <>
              <PlayButton
                playing={playing}
                onClick={toggle}
                label={playing ? 'Stop' : 'Play'}
                title={`${playing ? 'Stop' : 'Play'} your progression in ${tonicLabel}`}
              />
              <Button size="xs" variant="destructive-outline" onClick={onClear} title="Start again">
                <X className="h-3 w-3" />
                Clear
              </Button>
            </>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="gap-5">
        {chords.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing yet. Click chords below to add them — four is usually plenty.
          </p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {chords.map(({ id, position, ...entry }) => (
              <ChordBlock key={id} {...entry} active={sounding === position} onRemove={() => onRemove(position)} />
            ))}
          </div>
        )}

        <Palette
          label={`In ${family.name.toLowerCase()}`}
          hint="The seven chords the scale gives you. Any order works; some orders work better."
          entries={native}
          onAppend={onAppend}
        />
        <Palette
          label="Borrowed"
          hint="Chords on the same root from the other scale families. One of these in four is usually the moment a progression stops sounding ordinary."
          entries={borrowed}
          onAppend={onAppend}
        />
      </CardContent>
    </Card>
  );
}
