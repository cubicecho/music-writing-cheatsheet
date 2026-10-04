import type { ProgressionStep, ScaleFamily, Tonic } from '@/lib/music';
import { harmonicHome, PROGRESSIONS } from '@/lib/music';
import { HomeKeyNote } from './HomeKeyNote';
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
  progressionId: string | null;
  onSelectProgression: (id: string) => void;
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
  progressionId,
  onSelectProgression,
  custom,
  onAppendStep,
  onRemoveStep,
  onClearCustom,
}: ProgressionsTabProps) {
  // A pentatonic or blues scale is read as the key it is played in; the picker keeps showing it.
  const home = harmonicHome(family);
  const progression = PROGRESSIONS.find((candidate) => candidate.id === progressionId);

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

      <HomeKeyNote tonic={tonic} family={family} />

      <ProgressionPicker tonic={tonic.note} family={home} selected={progressionId} onSelect={onSelectProgression} />

      {progression ? (
        <ProgressionPanel
          // Keyed, so that changing progression starts a new panel and stops the old one playing.
          key={progression.id}
          progression={progression}
          tonic={tonic.note}
          tonicLabel={tonic.label}
          family={home}
          seventh={seventh}
          native={progression.families.includes(home.id)}
        />
      ) : (
        <p className="text-muted-foreground text-sm">Pick a progression above to see it in {tonic.label}.</p>
      )}

      <ProgressionBuilder
        tonic={tonic.note}
        tonicLabel={tonic.label}
        family={home}
        seventh={seventh}
        steps={custom}
        onAppend={onAppendStep}
        onRemove={onRemoveStep}
        onClear={onClearCustom}
      />
    </div>
  );
}
