import { useState } from 'react';
import { FlowTab } from '@/components/domain/FlowTab';
import type { ModeView } from '@/components/domain/KeyPicker';
import { ProgressionsTab } from '@/components/domain/ProgressionsTab';
import { ScalesTab } from '@/components/domain/ScalesTab';
import { Page, PageHeader } from '@/components/page';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ProgressionStep } from '@/lib/music';
import { findFamily, groupProgressions, SCALE_FAMILIES, TONICS } from '@/lib/music';

/** Whichever progression the family leads with, so a tab is never empty on arrival. */
const firstProgressionOf = (familyId: string) =>
  groupProgressions(familyId)
    .native.slice(0, 1)
    .map((progression) => progression.id);

const DEFAULT_FAMILY = 'major';

/**
 * All of the state, so that both tabs read the same key, scale and 7th-chord switch.
 *
 * The tabs themselves are uncontrolled — nothing needs to know which one is showing, because what
 * a tab shows is derived entirely from state that lives up here.
 */
export default function App() {
  const [tonicId, setTonicId] = useState('C');
  const [familyId, setFamilyId] = useState(DEFAULT_FAMILY);
  const [modeView, setModeView] = useState<ModeView>('relative');
  const [openModes, setOpenModes] = useState<string[]>([]);
  const [openProgressions, setOpenProgressions] = useState<string[]>(() => firstProgressionOf(DEFAULT_FAMILY));
  const [seventh, setSeventh] = useState(false);
  // Degrees, not chords — so the sketch survives a change of key or of scale and gets reread in
  // the new one, which is the whole argument for writing progressions as degrees.
  const [custom, setCustom] = useState<ProgressionStep[]>([]);
  // The chord map's own route, kept apart from the sketchpad's: they are two different exercises,
  // and walking the chart should not overwrite something you built by hand next door.
  const [route, setRoute] = useState<ProgressionStep[]>([]);

  const tonic = TONICS.find((candidate) => candidate.id === tonicId) ?? TONICS[0]!;
  const family = findFamily(familyId);

  const toggle = (setter: React.Dispatch<React.SetStateAction<string[]>>) => (id: string) =>
    setter((current) => (current.includes(id) ? current.filter((other) => other !== id) : [...current, id]));

  const changeFamily = (id: string) => {
    setFamilyId(id);
    // Modes belong to the family that was showing; progressions move to whatever the new family
    // leads with, so the tab still has something open when you come back to it.
    setOpenModes([]);
    setOpenProgressions(firstProgressionOf(id));
  };

  /** Both halves of a key at once, for the relative- and parallel-key links. */
  const goToKey = (nextTonicId: string, nextFamilyId: string) => {
    setTonicId(nextTonicId);
    if (nextFamilyId !== familyId) changeFamily(nextFamilyId);
  };

  const shared = {
    tonic,
    onTonicChange: setTonicId,
    family,
    onFamilyChange: changeFamily,
    seventh,
    onSeventhChange: setSeventh,
  };

  return (
    <TooltipProvider>
      <Page className="max-w-5xl gap-6">
        <PageHeader
          title="Music writing cheatsheet"
          subtitle="Pick a key. The scale, its intervals, its modes, its chords and the progressions people build out of them all follow from it."
          actions={<ThemeToggle />}
        />

        <Tabs defaultValue="scales">
          <TabsList>
            <TabsTrigger value="scales">Scale &amp; chords</TabsTrigger>
            <TabsTrigger value="progressions">Progressions</TabsTrigger>
            <TabsTrigger value="map">Chord map</TabsTrigger>
          </TabsList>

          <TabsContent value="scales" className="mt-6">
            <ScalesTab
              {...shared}
              onSelectKey={goToKey}
              modeView={modeView}
              onModeViewChange={setModeView}
              openModes={openModes}
              onToggleMode={toggle(setOpenModes)}
            />
          </TabsContent>

          <TabsContent value="progressions" className="mt-6">
            <ProgressionsTab
              {...shared}
              openProgressions={openProgressions}
              onToggleProgression={toggle(setOpenProgressions)}
              custom={custom}
              onAppendStep={(step) => setCustom((current) => [...current, step])}
              onRemoveStep={(position) => setCustom((current) => current.filter((_, index) => index !== position))}
              onClearCustom={() => setCustom([])}
            />
          </TabsContent>
          <TabsContent value="map" className="mt-6">
            <FlowTab
              {...shared}
              route={route}
              onAppendStep={(step) => setRoute((current) => [...current, step])}
              onRemoveStep={(position) => setRoute((current) => current.filter((_, index) => index !== position))}
              onClearRoute={() => setRoute([])}
            />
          </TabsContent>
        </Tabs>

        <footer className="pt-2 pb-6 text-muted-foreground text-xs">
          Built on {SCALE_FAMILIES.length} scale families × 7 modes. Every chord is thirds stacked out of the scale's
          own notes — nothing is a lookup table.
        </footer>
      </Page>
    </TooltipProvider>
  );
}
