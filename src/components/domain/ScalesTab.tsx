import { SectionHeading } from '@/components/section-heading';
import type { ScaleFamily, Tonic } from '@/lib/music';
import {
  buildMode,
  chordsForFamily,
  chordsInScale,
  familyScale,
  findFamily,
  formatNote,
  GAPPED_FAMILIES,
  harmonicHome,
  isGapped,
  type Note,
} from '@/lib/music';
import { KeyPicker, type ModeView } from './KeyPicker';
import { ModePicker, modeRoot } from './ModePicker';
import { RelatedKeys } from './RelatedKeys';
import { ScalePanel } from './ScalePanel';

/**
 * Where a gapped family's chords come from, for the line above them. A family that names its own
 * harmony says why; the rest are played over their home key, which only needs saying.
 */
function harmonyNote(tonicLabel: string, family: ScaleFamily): string | undefined {
  if (!isGapped(family)) return undefined;
  if (family.harmonyNote) return family.harmonyNote;
  const home = harmonicHome(family);
  return `Five notes do not stack into chords of their own — every other note lands on a 4th as often as a 3rd. ${family.name} is played over the chords of ${tonicLabel} ${home.name.toLowerCase()}, and every note of it fits each of them or passes by.`;
}

/**
 * The chords a mode's panel shows. A seven-note mode stacks its own thirds. A rotation of a gapped
 * family is only given chords when it is itself a family here — minor pentatonic inside major
 * pentatonic, say — and otherwise has none to show.
 */
function modeChords(root: Note, family: ScaleFamily, modeIndex: number, modeId: string, seventh: boolean) {
  if (!isGapped(family)) return { chords: chordsInScale(buildMode(root, family, modeIndex), seventh) };
  const named = GAPPED_FAMILIES.find((candidate) => candidate.id === modeId);
  if (named)
    return { chords: chordsForFamily(root, findFamily(named.id), seventh), note: harmonyNote(formatNote(root), named) };
  return {
    chords: [],
    note: 'A rotation with no key of its own to be played over — hear it as a colour over a drone on its root, or over a sus chord.',
  };
}

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
    .map((mode) => ({ mode, index: mode.degree - 1 }))
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
        scale={familyScale(tonic.note, family)}
        seventh={seventh}
        chords={chordsForFamily(tonic.note, family, seventh)}
        chordNote={harmonyNote(tonic.label, family)}
      />

      <div className="flex flex-col gap-3">
        <div className="flex flex-col gap-1">
          <SectionHeading variant="overline">Modes</SectionHeading>
          <span className="text-muted-foreground text-sm">
            {modeView === 'relative'
              ? `The same ${family.intervals.length === 7 ? 'seven' : family.intervals.length === 6 ? 'six' : 'five'} notes as ${tonic.label} ${family.name.toLowerCase()}, started somewhere else. Pick any to open them.`
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
        const { chords, note } = modeChords(root, family, index, mode.id, seventh);
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
            chords={chords}
            chordNote={note}
          />
        );
      })}
    </div>
  );
}
