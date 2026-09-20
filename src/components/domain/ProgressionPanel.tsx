import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Note, Progression, ScaleFamily } from '@/lib/music';
import { realizeProgression } from '@/lib/music';
import { ChordBlock } from './ChordBlock';
import { PlayButton } from './PlayButton';
import { useSequence } from './useSequence';

type ProgressionPanelProps = {
  progression: Progression;
  tonic: Note;
  tonicLabel: string;
  family: ScaleFamily;
  seventh: boolean;
  /** False when the progression is native to another family and is being heard here as a transplant. */
  native: boolean;
};

export function ProgressionPanel({ progression, tonic, tonicLabel, family, seventh, native }: ProgressionPanelProps) {
  // A step's identity is its position in a named progression, and nothing else: the 12-bar blues
  // plays the same chord four times running.
  const chords = realizeProgression(tonic, family, progression, seventh).map((entry, position) => ({
    ...entry,
    id: `${progression.id}-${position}`,
    position,
  }));
  const borrowed = chords.filter((entry) => entry.borrowedFrom !== undefined);
  const { playing, step, toggle } = useSequence(chords.map((entry) => entry.chord));

  return (
    <Card>
      <CardHeader className="gap-2 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">{progression.name}</CardTitle>
          <span className="text-muted-foreground text-sm">
            in {tonicLabel} {family.name.toLowerCase()}
          </span>
          {native ? null : <Badge variant="outline">transplanted</Badge>}
          <PlayButton
            playing={playing}
            onClick={toggle}
            label={playing ? 'Stop' : 'Play'}
            title={`${playing ? 'Stop' : 'Play'} ${progression.name} in ${tonicLabel}`}
          />
        </div>
        <span className="text-muted-foreground text-sm">{progression.description}</span>
      </CardHeader>
      <CardContent className="gap-4">
        <div className="flex flex-wrap gap-2">
          {chords.map(({ id, position, ...entry }) => (
            <ChordBlock key={id} {...entry} active={step === position} />
          ))}
        </div>

        {borrowed.length > 0 ? (
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground">
              {borrowed.map((entry) => entry.chord.symbol).join(', ')} {borrowed.length === 1 ? 'is' : 'are'} not in{' '}
              {tonicLabel} {family.name.toLowerCase()}.
            </span>{' '}
            Borrowed from {borrowed[0]!.borrowedFrom!.name.toLowerCase()} on the same root — the dashed outline marks
            it. That is modal interchange, and it is most of what makes a progression sound like more than its scale.
          </p>
        ) : null}

        {native ? null : (
          <p className="text-muted-foreground text-sm">
            This shape belongs to {progression.families.map((id) => id.replace(/-/g, ' ')).join(' and ')}. The degrees
            are the same here; {family.name.toLowerCase()} just answers them with its own chords.
          </p>
        )}

        {progression.heardIn ? (
          <p className="text-muted-foreground text-sm">
            <span className="text-foreground">Heard in</span> {progression.heardIn}.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
