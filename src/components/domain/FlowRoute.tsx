import { ActionButton } from '@/components/action-button';
import { OptionSelect } from '@/components/option-select';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronDown, ChevronUp, Copy, Trash2, Undo2, X } from '@/components/ui/icons';
import type { Note, ProgressionStep, ScaleFamily } from '@/lib/music';
import { flowMove, realizeSteps } from '@/lib/music';
import { formatClock, SECTION_LABELS, type SectionLabel } from '@/lib/song';
import { ChordBlock } from './ChordBlock';
import { PlayButton } from './PlayButton';
import { useSequence } from './useSequence';

/** The seven kinds of section, as the menu offers them. Fixed, so it is built once. */
const LABEL_OPTIONS = SECTION_LABELS.map((label) => ({ value: label, label }));

type FlowRouteProps = {
  tonic: Note;
  family: ScaleFamily;
  seventh: boolean;
  /** What to call it in prose — the label, numbered if the song has more than one of them. */
  name: string;
  label: SectionLabel;
  /** Which one of its kind this is, when the song has more than one; drawn beside the picker. */
  ordinal: number | undefined;
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
  ordinal,
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
        {/* You pick what kind of section it is; the song decides whether it is the first verse or
            the second, so the number sits beside the menu rather than in it — a menu offering
            "Verse 2" would be offering something reordering the song takes straight back. */}
        <div className="flex items-center gap-1.5">
          <OptionSelect
            className="w-36"
            value={label}
            onValueChange={(next) => onLabelChange(next as SectionLabel)}
            options={LABEL_OPTIONS}
          />
          {ordinal === undefined ? null : <Badge variant="outline">{ordinal}</Badge>}
        </div>

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
                title={`${playing ? 'Stop' : 'Play'} ${name}`}
                {...(songPlaying ? { hint: 'The whole song is playing — stop it to play one section.' } : {})}
              />
              <IconButton
                icon={Undo2}
                label={`Remove the last chord of ${name}`}
                onClick={() => onRemove(chords.length - 1)}
              />
              {/* Not destructive-styled: red is for the button that takes the slot away, and a
                  section you emptied is still right there to fill again. */}
              <IconButton icon={X} label={`Take every chord out of ${name}`} onClick={onClear} />
            </>
          ) : null}
          <IconButton icon={Copy} label={`Copy ${name}`} onClick={onDuplicate} />
          <IconButton
            icon={ChevronUp}
            label={`Move ${name} earlier`}
            onClick={() => onMove(-1)}
            disabled={!canMoveUp}
            hint={canMoveUp ? undefined : `${name} is already first.`}
          />
          <IconButton
            icon={ChevronDown}
            label={`Move ${name} later`}
            onClick={() => onMove(1)}
            disabled={!canMoveDown}
            hint={canMoveDown ? undefined : `${name} is already last.`}
          />
          <IconButton
            icon={Trash2}
            label={`Delete ${name}`}
            onClick={onDelete}
            disabled={!canDelete}
            hint={canDelete ? undefined : 'A song keeps at least one section.'}
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
 * One of the row of small square buttons a section carries: this app's size for @cubeui's
 * `ActionButton`, said once instead of at seven call sites.
 *
 * Icon-only because there are seven of them and a section header is not where a song should
 * spend its width; the label names the section too, since "Move later" on its own means nothing
 * when there are four of them on the page. `ActionButton` is what makes the disabled ones worth
 * having: it marks them `aria-disabled` rather than `disabled`, so the button that refuses to
 * move a section still takes a hover and can say it is already first.
 */
function IconButton({
  icon: Icon,
  label,
  onClick,
  disabled = false,
  hint,
  destructive = false,
}: {
  icon: typeof Copy;
  label: string;
  onClick: () => void;
  disabled?: boolean;
  hint?: string | undefined;
  destructive?: boolean;
}) {
  return (
    <ActionButton
      size="xs"
      variant={destructive ? 'destructive-outline' : 'outline'}
      onClick={onClick}
      disabled={disabled}
      label={label}
      {...(hint === undefined ? {} : { hint })}
      className="w-7 shrink-0 px-0"
    >
      <Icon className="h-3 w-3" />
    </ActionButton>
  );
}
