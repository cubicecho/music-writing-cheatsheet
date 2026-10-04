import { useEffect, useState } from 'react';
import { FlowTab } from '@/components/domain/FlowTab';
import type { ModeView } from '@/components/domain/KeyPicker';
import { ProgressionsTab } from '@/components/domain/ProgressionsTab';
import { RhythmsTab } from '@/components/domain/RhythmsTab';
import { ScalesTab } from '@/components/domain/ScalesTab';
import { Page, PageHeader } from '@/components/page';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ThemePicker } from '@/components/ui/theme-picker';
import { usePalettePreference, useThemePreference } from '@/components/ui/theme-preference';
import { TooltipProvider } from '@/components/ui/tooltip';
import type { ProgressionStep } from '@/lib/music';
import { findFamily, GAPPED_FAMILIES, groupProgressions, harmonicHome, SCALE_FAMILIES, TONICS } from '@/lib/music';
import { RHYTHMS } from '@/lib/rhythm';
import type { Song } from '@/lib/song';
import { newSong } from '@/lib/song';

/**
 * Whichever progression the family leads with, so a tab is never empty on arrival. A pentatonic or
 * blues scale leads with its home key's.
 */
const firstProgressionOf = (familyId: string) =>
  groupProgressions(harmonicHome(findFamily(familyId)).id).native[0]?.id ?? null;

const DEFAULT_FAMILY = 'major';

/**
 * All of the state, so that every tab reads the same key, scale and 7th-chord switch — bar the
 * Rhythms tab, which has no key to read and keeps only which rhythm is showing.
 *
 * The tabs themselves are uncontrolled — nothing needs to know which one is showing, because what
 * a tab shows is derived entirely from state that lives up here.
 */
export default function App() {
  // The picker in the header is bound to the same hook, but applying the theme is the app's job,
  // not a side effect of wherever the picker happens to be mounted.
  useThemePreference();
  // cubeui stores a palette under one key for the whole origin, and the hook above paints whatever
  // it finds there. This app offers no palette to choose, so one picked in another cubeui app on
  // the same origin (Monokai, which is also dark whatever the theme says) would arrive here with no
  // control to undo it. Put it back to the default instead.
  const [palette, setPalette] = usePalettePreference();
  useEffect(() => {
    if (palette !== 'default') setPalette('default');
  }, [palette, setPalette]);
  const [tonicId, setTonicId] = useState('C');
  const [familyId, setFamilyId] = useState(DEFAULT_FAMILY);
  const [modeView, setModeView] = useState<ModeView>('relative');
  // No mode to begin with: the scale above the picker is already the first of them.
  const [modeId, setModeId] = useState<string | null>(null);
  // One mode, one progression and one rhythm at a time: the chips are a choice, not a set of switches.
  const [progressionId, setProgressionId] = useState<string | null>(() => firstProgressionOf(DEFAULT_FAMILY));
  const [seventh, setSeventh] = useState(false);
  // Degrees, not chords — so the sketch survives a change of key or of scale and gets reread in
  // the new one, which is the whole argument for writing progressions as degrees.
  const [custom, setCustom] = useState<ProgressionStep[]>([]);
  // The chord map's own song, kept apart from the sketchpad: they are two different exercises, and
  // walking the chart should not overwrite something you built by hand next door.
  const [song, setSong] = useState<Song>(newSong);
  const [rhythmId, setRhythmId] = useState(RHYTHMS[0]!.id);

  const tonic = TONICS.find((candidate) => candidate.id === tonicId) ?? TONICS[0]!;
  const family = findFamily(familyId);

  const changeFamily = (id: string) => {
    setFamilyId(id);
    // A mode belongs to the family that was showing; the progression moves to whatever the new family
    // leads with, so the tab still has something open when you come back to it.
    setModeId(null);
    setProgressionId(firstProgressionOf(id));
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
          description="Pick a key. The scale, its intervals, its modes, its chords and the progressions people build out of them all follow from it."
          action={<ThemePicker />}
        />

        <Tabs defaultValue="scales">
          <TabsList aria-label="Cheatsheet view">
            <TabsTrigger value="scales">Scale &amp; chords</TabsTrigger>
            <TabsTrigger value="progressions">Progressions</TabsTrigger>
            <TabsTrigger value="map">Chord map</TabsTrigger>
            <TabsTrigger value="rhythms">Rhythms</TabsTrigger>
          </TabsList>

          <TabsContent value="scales" className="mt-6">
            <ScalesTab
              {...shared}
              onSelectKey={goToKey}
              modeView={modeView}
              onModeViewChange={setModeView}
              modeId={modeId}
              onSelectMode={setModeId}
            />
          </TabsContent>

          <TabsContent value="progressions" className="mt-6">
            <ProgressionsTab
              {...shared}
              progressionId={progressionId}
              onSelectProgression={setProgressionId}
              custom={custom}
              onAppendStep={(step) => setCustom((current) => [...current, step])}
              onRemoveStep={(position) => setCustom((current) => current.filter((_, index) => index !== position))}
              onClearCustom={() => setCustom([])}
            />
          </TabsContent>
          <TabsContent value="map" className="mt-6">
            <FlowTab {...shared} song={song} onSongChange={setSong} />
          </TabsContent>
          <TabsContent value="rhythms" className="mt-6">
            <RhythmsTab rhythmId={rhythmId} onSelectRhythm={setRhythmId} />
          </TabsContent>
        </Tabs>

        <footer className="pt-2 pb-6 text-muted-foreground text-xs">
          Built on {SCALE_FAMILIES.length} scale families × 7 modes, plus {GAPPED_FAMILIES.length} pentatonic and blues
          scales. Every chord is thirds stacked out of the scale's own notes — nothing is a lookup table.
        </footer>
      </Page>
    </TooltipProvider>
  );
}
