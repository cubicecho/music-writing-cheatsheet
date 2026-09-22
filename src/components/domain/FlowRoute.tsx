import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, ChevronUp, Copy, Trash2, Undo2, X } from '@/components/ui/icons';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Note, ProgressionStep, ScaleFamily } from '@/lib/music';
import { flowMove, realizeSteps } from '@/lib/music';
import { formatClock, SECTION_LABELS, type SectionLabel } from '@/lib/song';
import { ChordBlock } from './ChordBlock';
import { PlayButton } from './PlayButton';
import { useSequence } from './useSequence';

type FlowRouteProps = {
  tonic: Note;
  family: ScaleFamily;
  seventh: boolean;
  /** What to call it on screen — the label, numbered if the song has more than one of them. */
  name: string;
  label: SectionLabel;
  steps: ProgressionStep[];
  /** The one the chart is pointed at: clicking a chord up there lands here. */
  active: boolean;
  /** How long one chord is held, from the song's beats and tempo. */
  beatMs: number;
  /** Which chord of *this* section the whole song is sounding, when the whole song is playing. */
  songStep: number | null;
  songPlaying: boolean;
  canMoveUp: boolean;
  canMoveDown: boolean;
  canDelete: boolean;
  onActivate: () => void;
  onLabelChange: (label: SectionLabel) => void;
  onRemove: (position: number) => void;
  onClear: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onMove: (delta: -1 | 1) => void;
};

/**
 * One slot of the song: a path through the chart, as chords you can hear.
 *
 * The arrow between two blocks is the point of this panel: it is drawn plainly where the chart
 * has that move and faintly where it does not, so a progression that has wandered off common
 * practice says so without anything being taken away from you. Like every other progression here
 * it is stored as degrees, so changing key or scale rereads the route rather than losing it.
 *
 * It plays on its own — writing a chorus means hearing the chorus, not the song up to it — and it
 * also lights up under the song's playback, which is why the sounding chord can come from either
 * place.
 */
export function FlowRoute({
  tonic,
  family,
  seventh,
  name,
  label,
  steps,
  active,
  beatMs,
  songStep,
  songPlaying,
  canMoveUp,
  canMoveDown,
  canDelete,
  onActivate,
  onLabelChange,
  onRemove,
  onClear,
  onDuplicate,
  onDelete,
  onMove,
}: FlowRouteProps) {
  // Position is the only identity a step has — a route may well pass through one chord twice.
  const chords = realizeSteps(tonic, family, steps, seventh).map((entry, position) => ({
    ...entry,
    id: `${entry.chord.symbol}-${position}`,
    position,
    // The move that got here, and whether the chart draws it. The first chord arrives from nowhere.
    move: position === 0 ? undefined : flowMove(family, steps[position - 1]!.degree, entry.chord.degreeIndex),
    repeat: position > 0 && steps[position - 1]!.degree === entry.chord.degreeIndex,
  }));
  const { playing, step, toggle } = useSequence(
    chords.map((entry) => entry.chord),
    { beatMs },
  );
  const wandered = chords.filter((entry) => entry.position > 0 && !entry.repeat && entry.move === undefined);
  // The song's playback wins: while it is running this section's own transport is disabled, so
  // only one of the two can be lighting a chord at a time.
  const sounding = songPlaying ? songStep : step;

  return (
    <div
      className={`flex flex-col gap-3 rounded-lg border p-4 transition-colors ${
        active ? 'border-primary bg-primary/5' : 'border-border bg-background'
      }`}
    >
      <div className="flex flex-wrap items-center gap-2">
        <Select value={label} onValueChange={(next) => onLabelChange(next as SectionLabel)}>
          {/* The trigger shows the numbered name and the menu offers the seven labels: you pick what
              kind of section it is, and the song decides whether it is the first verse or the
              second. */}
          <SelectTrigger className="w-40">
            <SelectValue>{name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SECTION_LABELS.map((candidate) => (
              <SelectItem key={candidate} value={candidate}>
                {candidate}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {active ? (
          <Badge>adding here</Badge>
        ) : (
          <Button size="xs" variant="outline" onClick={onActivate} title={`Add the next chord to ${name}`}>
            Add here
          </Button>
        )}

        <span className="text-muted-foreground text-sm">
          {chords.length === 0
            ? 'empty'
            : `${chords.length} ${chords.length === 1 ? 'chord' : 'chords'} · ${formatClock((chords.length * beatMs) / 1000)}`}
        </span>

        <div className="ml-auto flex items-center gap-1">
          {chords.length > 0 ? (
            <>
              <PlayButton
                playing={playing}
                disabled={songPlaying}
                onClick={toggle}
                title={songPlaying ? 'The whole song is playing' : `${playing ? 'Stop' : 'Play'} ${name}`}
              />
              <IconButton
                icon={Undo2}
                title={`Remove the last chord of ${name}`}
                onClick={() => onRemove(chords.length - 1)}
              />
              {/* Not destructive-styled: red is for the button that takes the slot away, and a
                  section you emptied is still right there to fill again. */}
              <IconButton icon={X} title={`Take every chord out of ${name}`} onClick={onClear} />
            </>
          ) : null}
          <IconButton icon={Copy} title={`Copy ${name}`} onClick={onDuplicate} />
          <IconButton
            icon={ChevronUp}
            title={`Move ${name} earlier`}
            onClick={() => onMove(-1)}
            disabled={!canMoveUp}
          />
          <IconButton
            icon={ChevronDown}
            title={`Move ${name} later`}
            onClick={() => onMove(1)}
            disabled={!canMoveDown}
          />
          <IconButton
            icon={Trash2}
            title={canDelete ? `Delete ${name}` : 'A song keeps at least one section'}
            onClick={onDelete}
            disabled={!canDelete}
            destructive
          />
        </div>
      </div>

      {chords.length === 0 ? (
        <p className="text-muted-foreground text-sm">
          {active
            ? 'Nothing yet. Pick a chord from the map above and the chart will take it from there — four chords is usually a whole section.'
            : `Empty. Choose "Add here" and the map above fills this one.`}
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
    </div>
  );
}

/**
 * One of the row of small square buttons a section carries.
 *
 * Icon-only because there are six of them and a section header is not where a song should spend
 * its width; every one carries its title as its accessible name, with the section's own name in
 * it, since "Move later" on its own means nothing when there are four of them on the page.
 */
function IconButton({
  icon: Icon,
  title,
  onClick,
  disabled = false,
  destructive = false,
}: {
  icon: typeof Copy;
  title: string;
  onClick: () => void;
  disabled?: boolean;
  destructive?: boolean;
}) {
  return (
    <Button
      size="xs"
      variant={destructive ? 'destructive-outline' : 'outline'}
      onClick={onClick}
      disabled={disabled}
      title={title}
      aria-label={title}
      className="w-7 shrink-0 px-0"
    >
      <Icon className="h-3 w-3" />
    </Button>
  );
}
