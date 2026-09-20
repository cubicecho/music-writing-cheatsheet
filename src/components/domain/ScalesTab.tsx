import { SectionHeading } from '@/components/section-heading';
import type { ScaleFamily, Tonic } from '@/lib/music';
import { buildMode, buildScale, formatNote } from '@/lib/music';
import { KeyPicker, type ModeView } from './KeyPicker';
import { ModePicker, modeRoot } from './ModePicker';
import { RelatedKeys } from './RelatedKeys';
import { ScalePanel } from './ScalePanel';

type ScalesTabProps = {
  tonic: Tonic;
  onTonicChange: (id: string) => void;
  family: ScaleFamily;
  onFamilyChange: (id: string) => void;
  onSelectKey: (tonicId: string, familyId: string) => void;
  modeView: ModeView;
  onModeViewChange: (view: ModeView) => void;
  seventh: boolean;
  onSeventhChange: (seventh: boolean) => void;
  openModes: string[];
  onToggleMode: (id: string) => void;
};

/** The key's scale, its intervals, its chords, and whichever of its modes are open. */
export function ScalesTab({
  tonic,
  onTonicChange,
  family,
  onFamilyChange,
  onSelectKey,
  modeView,
  onModeViewChange,
  seventh,
  onSeventhChange,
  openModes,
  onToggleMode,
}: ScalesTabProps) {
  // Mode ids are only unique inside a family — major and natural minor share Dorian, Lydian and
  // the rest — so the open list is both cleared on a family change and filtered against the
  // family currently showing.
  const shownModes = family.modes
    .map((mode, index) => ({ mode, index }))
    .filter(({ mode }) => openModes.includes(mode.id));

  return (
    <div className="flex flex-col gap-6">
      <KeyPicker
        tonic={tonic}
        onTonicChange={onTonicChange}
        family={family}
        onFamilyChange={onFamilyChange}
        modeView={modeView}
        onModeViewChange={onModeViewChange}
        seventh={seventh}
        onSeventhChange={onSeventhChange}
      />

      <RelatedKeys tonic={tonic} family={family} onSelect={onSelectKey} />

      <ScalePanel
        title={`${tonic.label} ${family.name.toLowerCase()}`}
        subtitle={family.description}
        scale={buildScale(tonic.note, family.intervals)}
        seventh={seventh}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <SectionHeading variant="overline">Modes</SectionHeading>
          <span className="text-muted-foreground text-sm">
            {modeView === 'relative'
              ? `The same seven notes as ${tonic.label} ${family.name.toLowerCase()}, started somewhere else. Pick any to open them.`
              : `Each mode built on ${tonic.label} itself, so the notes change and the root does not. Pick any to open them.`}
          </span>
        </div>

        <ModePicker
          family={family}
          tonic={tonic.note}
          modeView={modeView}
          selected={openModes}
          onToggle={onToggleMode}
        />
      </div>

      {shownModes.map(({ mode, index }) => {
        const root = modeRoot(tonic.note, family, index, modeView);
        return (
          <ScalePanel
            key={mode.id}
            title={`${formatNote(root)} ${mode.name}`}
            subtitle={
              <>
                {mode.aka ? <span className="text-foreground">Also called {mode.aka}. </span> : null}
                {mode.character}
              </>
            }
            scale={buildMode(root, family, index)}
            seventh={seventh}
          />
        );
      })}
    </div>
  );
}
