import { ToggleChip } from '@/components/ui/toggle-chip';
import type { Mode, Note, ScaleFamily } from '@/lib/music';
import { formatNote, spellDegree } from '@/lib/music';
import type { ModeView } from './KeyPicker';

type ModePickerProps = {
  family: ScaleFamily;
  tonic: Note;
  modeView: ModeView;
  selected: string[];
  onToggle: (modeId: string) => void;
};

/** The root a mode would be played from, which is the whole difference between the two views. */
export function modeRoot(tonic: Note, family: ScaleFamily, modeIndex: number, view: ModeView): Note {
  if (view === 'parallel') return tonic;
  return spellDegree(tonic, modeIndex, family.intervals[modeIndex]!);
}

export function ModePicker({ family, tonic, modeView, selected, onToggle }: ModePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {family.modes.map((mode: Mode, index: number) => (
        <ToggleChip key={mode.id} selected={selected.includes(mode.id)} onClick={() => onToggle(mode.id)} size="sm">
          {/* A bare string, not markup: ToggleChip only applies the selected-state text colour to
              a string child, and anything else it renders untouched — and unreadable on the
              selected background. */}
          {`${mode.degree} · ${formatNote(modeRoot(tonic, family, index, modeView))} ${mode.name}`}
        </ToggleChip>
      ))}
    </div>
  );
}
