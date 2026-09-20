import type { ProgressionStep, ScaleFamily, Tonic } from '@/lib/music';
import { PROGRESSIONS } from '@/lib/music';
import { KeyPicker } from './KeyPicker';
import { ProgressionBuilder } from './ProgressionBuilder';
import { ProgressionPanel } from './ProgressionPanel';
import { ProgressionPicker } from './ProgressionPicker';

type ProgressionsTabProps = {
  tonic: Tonic;
  onTonicChange: (id: string) => void;
  family: ScaleFamily;
  onFamilyChange: (id: string) => void;
  seventh: boolean;
  onSeventhChange: (seventh: boolean) => void;
  openProgressions: string[];
  onToggleProgression: (id: string) => void;
  custom: ProgressionStep[];
  onAppendStep: (step: ProgressionStep) => void;
  onRemoveStep: (position: number) => void;
  onClearCustom: () => void;
};

/** The same key and scale as the other tab, read as progressions instead of as a chord table. */
export function ProgressionsTab({
  tonic,
  onTonicChange,
  family,
  onFamilyChange,
  seventh,
  onSeventhChange,
  openProgressions,
  onToggleProgression,
  custom,
  onAppendStep,
  onRemoveStep,
  onClearCustom,
}: ProgressionsTabProps) {
  const shown = PROGRESSIONS.filter((progression) => openProgressions.includes(progression.id));

  return (
    <div className="flex flex-col gap-6">
      {/* No mode-view control here: a progression is a path through one scale, not a rotation of it. */}
      <KeyPicker
        tonic={tonic}
        onTonicChange={onTonicChange}
        family={family}
        onFamilyChange={onFamilyChange}
        seventh={seventh}
        onSeventhChange={onSeventhChange}
      />

      <ProgressionPicker
        tonic={tonic.note}
        family={family}
        selected={openProgressions}
        onToggle={onToggleProgression}
      />

      {shown.length === 0 ? (
        <p className="text-muted-foreground text-sm">Pick a progression above to see it in {tonic.label}.</p>
      ) : null}

      {shown.map((progression) => (
        <ProgressionPanel
          key={progression.id}
          progression={progression}
          tonic={tonic.note}
          tonicLabel={tonic.label}
          family={family}
          seventh={seventh}
          native={progression.families.includes(family.id)}
        />
      ))}

      <ProgressionBuilder
        tonic={tonic.note}
        tonicLabel={tonic.label}
        family={family}
        seventh={seventh}
        steps={custom}
        onAppend={onAppendStep}
        onRemove={onRemoveStep}
        onClear={onClearCustom}
      />
    </div>
  );
}
