import { SectionHeading } from '@/components/section-heading';
import { ToggleChip } from '@/components/ui/toggle-chip';
import type { Note, Progression, ScaleFamily } from '@/lib/music';
import { groupProgressions, realizeProgression } from '@/lib/music';

type ProgressionPickerProps = {
  tonic: Note;
  family: ScaleFamily;
  selected: string[];
  onToggle: (id: string) => void;
};

/** The chord symbols of a progression, as a preview short enough to fit on a chip. */
function preview(tonic: Note, family: ScaleFamily, progression: Progression): string {
  const chords = realizeProgression(tonic, family, progression).map(({ chord }) => chord.symbol);
  // The 12-bar blues is twelve chords long and would swamp the row; its first few say enough.
  return chords.length > 6 ? `${chords.slice(0, 4).join(' ')} …` : chords.join(' ');
}

function Group({
  label,
  hint,
  progressions,
  tonic,
  family,
  selected,
  onToggle,
}: ProgressionPickerProps & { label: string; hint: string; progressions: Progression[] }) {
  if (progressions.length === 0) return null;

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-1">
        <SectionHeading variant="overline">{label}</SectionHeading>
        <span className="text-muted-foreground text-sm">{hint}</span>
      </div>
      <div className="flex flex-wrap gap-2">
        {progressions.map((progression) => (
          <ToggleChip
            key={progression.id}
            selected={selected.includes(progression.id)}
            onClick={() => onToggle(progression.id)}
            size="sm"
          >
            {`${progression.name} · ${preview(tonic, family, progression)}`}
          </ToggleChip>
        ))}
      </div>
    </div>
  );
}

/**
 * Every progression, split by whether it is native to the scale showing.
 *
 * The split matters more than the filtering would: a major-key shape played against a minor scale
 * is a real progression, just a different one, and seeing the same four degrees answered by
 * different chords is the fastest way to understand what a scale actually decides.
 */
export function ProgressionPicker({ tonic, family, selected, onToggle }: ProgressionPickerProps) {
  const { native, transplanted } = groupProgressions(family.id);
  const shared = { tonic, family, selected, onToggle };

  return (
    <div className="flex flex-col gap-5">
      <Group
        {...shared}
        label={`In ${family.name.toLowerCase()}`}
        hint="Written for this scale. Pick any to open them."
        progressions={native}
      />
      <Group
        {...shared}
        label="From other scales"
        hint="The same degrees, answered by the chords this scale happens to contain. Often the more interesting version."
        progressions={transplanted}
      />
    </div>
  );
}
