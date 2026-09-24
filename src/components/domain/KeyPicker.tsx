import { OptionSelect } from '@/components/option-select';
import { SegmentedButton, SegmentedGroup } from '@/components/ui/segmented';
import { SwitchField } from '@/components/ui/switch-field';
import type { ScaleFamily, Tonic } from '@/lib/music';
import { GAPPED_FAMILIES, SCALE_FAMILIES, TONICS } from '@/lib/music';
import { Field } from './Field';

export type ModeView = 'relative' | 'parallel';

type KeyPickerProps = {
  tonic: Tonic;
  onTonicChange: (id: string) => void;
  family: ScaleFamily;
  onFamilyChange: (id: string) => void;
  /** Omitted on the progressions tab, where there is no mode to view. */
  modeView?: ModeView;
  onModeViewChange?: (view: ModeView) => void;
  seventh: boolean;
  onSeventhChange: (seventh: boolean) => void;
};

export function KeyPicker({
  tonic,
  onTonicChange,
  family,
  onFamilyChange,
  modeView,
  onModeViewChange,
  seventh,
  onSeventhChange,
}: KeyPickerProps) {
  return (
    <div className="flex flex-wrap items-end gap-x-8 gap-y-5 rounded-lg border border-border bg-card p-4">
      <Field label="Key" className="min-w-44">
        <OptionSelect
          className="w-28"
          value={tonic.id}
          onValueChange={onTonicChange}
          options={TONICS.map((candidate) => ({ value: candidate.id, label: candidate.label }))}
        />
      </Field>

      <Field label="Scale" className="min-w-44">
        <OptionSelect
          className="w-52"
          value={family.id}
          onValueChange={onFamilyChange}
          options={[
            ...SCALE_FAMILIES.map((candidate) => ({
              value: candidate.id,
              label: candidate.name,
              group: 'Seven notes',
            })),
            ...GAPPED_FAMILIES.map((candidate) => ({
              value: candidate.id,
              label: candidate.name,
              group: 'Pentatonic & blues',
            })),
          ]}
        />
      </Field>

      {modeView && onModeViewChange ? (
        <Field label="Show modes as" className="min-w-44">
          {/*
            The two ways to hear a mode, and the one control people most often wish a scale tool
            had. Relative keeps the key's notes and moves the tonic — the modes *of this key*.
            Parallel keeps the tonic and changes the notes, which is the comparison that shows what
            a mode actually does to a sound.
          */}
          <SegmentedGroup
            aria-label="Show modes as"
            value={modeView}
            onValueChange={(view) => onModeViewChange(view as ModeView)}
          >
            <SegmentedButton value="relative">Relative</SegmentedButton>
            <SegmentedButton value="parallel">Parallel</SegmentedButton>
          </SegmentedGroup>
        </Field>
      ) : null}

      <Field label="Chords" className="min-w-44">
        <SwitchField
          id="sevenths"
          label="7th chords"
          checked={seventh}
          onCheckedChange={onSeventhChange}
          className="h-10"
          labelClassName="text-foreground"
        />
      </Field>
    </div>
  );
}
