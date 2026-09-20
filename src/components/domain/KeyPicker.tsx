import { SectionHeading } from '@/components/section-heading';
import { SegmentedButton } from '@/components/ui/segmented';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import type { ScaleFamily, Tonic } from '@/lib/music';
import { SCALE_FAMILIES, TONICS } from '@/lib/music';

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

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex min-w-44 flex-col gap-1.5">
      <SectionHeading variant="overline">{label}</SectionHeading>
      {children}
    </div>
  );
}

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
      <Field label="Key">
        <Select value={tonic.id} onValueChange={onTonicChange}>
          <SelectTrigger className="w-28">
            <SelectValue>{tonic.label}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {TONICS.map((candidate) => (
              <SelectItem key={candidate.id} value={candidate.id}>
                {candidate.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      <Field label="Scale">
        <Select value={family.id} onValueChange={onFamilyChange}>
          <SelectTrigger className="w-52">
            <SelectValue>{family.name}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {SCALE_FAMILIES.map((candidate) => (
              <SelectItem key={candidate.id} value={candidate.id}>
                {candidate.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </Field>

      {modeView && onModeViewChange ? (
        <Field label="Show modes as">
          {/*
            The two ways to hear a mode, and the one control people most often wish a scale tool
            had. Relative keeps the key's notes and moves the tonic — the modes *of this key*.
            Parallel keeps the tonic and changes the notes, which is the comparison that shows what
            a mode actually does to a sound.
          */}
          <div className="flex h-10 items-center gap-1 rounded-md border border-border bg-background p-1">
            <SegmentedButton active={modeView === 'relative'} onClick={() => onModeViewChange('relative')}>
              Relative
            </SegmentedButton>
            <SegmentedButton active={modeView === 'parallel'} onClick={() => onModeViewChange('parallel')}>
              Parallel
            </SegmentedButton>
          </div>
        </Field>
      ) : null}

      <Field label="Chords">
        <div className="flex h-10 items-center gap-2">
          <Switch id="sevenths" checked={seventh} onCheckedChange={onSeventhChange} />
          <label className="cursor-pointer text-foreground text-sm" htmlFor="sevenths">
            7th chords
          </label>
        </div>
      </Field>
    </div>
  );
}
