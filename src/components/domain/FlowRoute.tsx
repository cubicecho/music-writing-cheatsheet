import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowRight, Undo2, X } from '@/components/ui/icons';
import type { Note, ProgressionStep, ScaleFamily } from '@/lib/music';
import { flowMove, realizeSteps } from '@/lib/music';
import { ChordBlock } from './ChordBlock';
import { PlayButton } from './PlayButton';
import { useSequence } from './useSequence';

type FlowRouteProps = {
  tonic: Note;
  tonicLabel: string;
  family: ScaleFamily;
  seventh: boolean;
  steps: ProgressionStep[];
  onRemove: (position: number) => void;
  onClear: () => void;
};

/**
 * The path you have walked through the chart, as chords you can hear.
 *
 * The arrow between two blocks is the point of this panel: it is drawn plainly where the chart
 * has that move and faintly where it does not, so a progression that has wandered off common
 * practice says so without anything being taken away from you. Like every other progression here
 * it is stored as degrees, so changing key or scale rereads the route rather than losing it.
 */
export function FlowRoute({ tonic, tonicLabel, family, seventh, steps, onRemove, onClear }: FlowRouteProps) {
  // Position is the only identity a step has — a route may well pass through one chord twice.
  const chords = realizeSteps(tonic, family, steps, seventh).map((entry, position) => ({
    ...entry,
    id: `${entry.chord.symbol}-${position}`,
    position,
    // The move that got here, and whether the chart draws it. The first chord arrives from nowhere.
    move: position === 0 ? undefined : flowMove(family, steps[position - 1]!.degree, entry.chord.degreeIndex),
    repeat: position > 0 && steps[position - 1]!.degree === entry.chord.degreeIndex,
  }));
  const { playing, step: sounding, toggle } = useSequence(chords.map((entry) => entry.chord));
  const wandered = chords.filter((entry) => entry.position > 0 && !entry.repeat && entry.move === undefined);

  return (
    <Card>
      <CardHeader className="gap-2 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">Your route</CardTitle>
          <span className="text-muted-foreground text-sm">
            in {tonicLabel} {family.name.toLowerCase()}
          </span>
          {chords.length > 0 ? (
            <>
              <PlayButton
                playing={playing}
                onClick={toggle}
                label={playing ? 'Stop' : 'Play'}
                title={`${playing ? 'Stop' : 'Play'} your route in ${tonicLabel}`}
              />
              <Button
                size="xs"
                variant="outline"
                onClick={() => onRemove(chords.length - 1)}
                title="Remove the last chord"
              >
                <Undo2 className="h-3 w-3" />
                Back
              </Button>
              <Button size="xs" variant="destructive-outline" onClick={onClear} title="Start again">
                <X className="h-3 w-3" />
                Clear
              </Button>
            </>
          ) : null}
        </div>
      </CardHeader>

      <CardContent className="gap-4">
        {chords.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Nothing yet. Pick a chord from the map above and the chart will take it from there — four chords is usually
            a whole song.
          </p>
        ) : (
          <div className="flex flex-wrap items-center gap-2">
            {chords.map(({ id, position, move, repeat, ...entry }) => (
              <div key={id} className="flex items-center gap-2">
                {position > 0 ? (
                  <ArrowRight
                    className={`h-4 w-4 shrink-0 ${move || repeat ? 'text-muted-foreground' : 'text-muted-foreground/30'}`}
                    aria-hidden
                  />
                ) : null}
                <ChordBlock {...entry} active={sounding === position} onRemove={() => onRemove(position)} />
              </div>
            ))}
          </div>
        )}

        {wandered.length > 0 ? (
          <p className="flex flex-wrap items-baseline gap-2 text-muted-foreground text-sm">
            <Badge variant="outline">off the chart</Badge>
            <span className="flex-1">
              {wandered.map((entry) => entry.chord.symbol).join(', ')}{' '}
              {wandered.length === 1 ? 'is not a move' : 'are not moves'} the chart draws from the chord before it. The
              faint arrows mark where — which is worth knowing rather than worth avoiding, since the 12-bar blues goes
              backwards down one of those arrows twelve bars at a time.
            </span>
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
