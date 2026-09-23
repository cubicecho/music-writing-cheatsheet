import { ToggleChip } from '@/components/ui/toggle-chip';
import type { Mode, Note, ScaleFamily } from '@/lib/music';
import { degreeNote, formatNote } from '@/lib/music';
import type { ModeView } from './KeyPicker';

type ModePickerProps = {
  family: ScaleFamily;
  tonic: Note;
  modeView: ModeView;
  selected: string[];
  onToggle: (modeId: string) => void;
};

/**
 * The root a mode would be played from, which is the whole difference between the two views.
 * `modeIndex` is the 0-based degree the mode starts on — not its place in `family.modes`, which
 * for the blues families lists only the rotations worth naming.
 */
export function modeRoot(tonic: Note, family: ScaleFamily, modeIndex: number, view: ModeView): Note {
  if (view === 'parallel') return tonic;
  return degreeNote(tonic, family, modeIndex);
}

export function ModePicker({ family, tonic, modeView, selected, onToggle }: ModePickerProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {family.modes.map((mode: Mode) => (
        <ToggleChip key={mode.id} selected={selected.includes(mode.id)} onClick={() => onToggle(mode.id)} size="sm">
          {`${mode.degree} · ${formatNote(modeRoot(tonic, family, mode.degree - 1, modeView))} ${mode.name}`}
        </ToggleChip>
      ))}
    </div>
  );
}
