import type { ScaleFamily, Tonic } from '@/lib/music';
import { harmonicHome, seventhKind } from '@/lib/music';
import type { Song } from '@/lib/song';
import { appendStep } from '@/lib/song';
import { FlowChart } from './FlowChart';
import { HomeKeyNote } from './HomeKeyNote';
import { KeyPicker } from './KeyPicker';
import { SongPanel } from './SongPanel';

type FlowTabProps = {
  tonic: Tonic;
  onTonicChange: (id: string) => void;
  family: ScaleFamily;
  onFamilyChange: (id: string) => void;
  seventh: boolean;
  onSeventhChange: (seventh: boolean) => void;
  song: Song;
  onSongChange: (song: Song) => void;
};

/** What the chart's shape depends on, said once, under the chart that has that shape. */
function shapeNote(family: ScaleFamily): string {
  return seventhKind(family) === 'leading-tone'
    ? `The 7th degree of ${family.name.toLowerCase()} is a half step under the tonic, so the chord on it is diminished and belongs with the dominant — it is the V with its root taken off.`
    : `The 7th degree of ${family.name.toLowerCase()} is a whole step under the tonic, so the chord on it is a major triad with no leading tone in it. That is why a minor key's flat seven goes almost anywhere while a major key's diminished chord only goes home.`;
}

/**
 * The same key as every other tab, read as a map instead of as a list.
 *
 * The progressions tab hands you paths somebody else walked; this one hands you the moves they are
 * made of and lets you walk your own. Same theory core, same key, same 7th-chord switch — the only
 * new idea is that a progression is a path through a graph, which is the idea the flowchart in
 * every theory book is drawing.
 *
 * A song is several of those paths in an order, so the panel below the chart holds slots rather
 * than one route, and the chart aims at whichever slot you are adding to.
 */
export function FlowTab({
  tonic,
  onTonicChange,
  family,
  onFamilyChange,
  seventh,
  onSeventhChange,
  song,
  onSongChange,
}: FlowTabProps) {
  // The chart stands on the last chord of the section you are adding to, since that is the chord
  // the next click follows — with several sections open, "where you are" is a property of one.
  // A pentatonic or blues scale is charted as the key it is played in; the picker keeps showing it.
  const home = harmonicHome(family);
  const active = song.sections.find((section) => section.id === song.activeId);
  const standing = active && active.steps.length > 0 ? active.steps[active.steps.length - 1]!.degree : undefined;

  return (
    <div className="flex flex-col gap-6">
      {/* No mode-view control, for the same reason the progressions tab has none: a path is
          through one scale, not a rotation of it. */}
      <KeyPicker
        tonic={tonic}
        onTonicChange={onTonicChange}
        family={family}
        onFamilyChange={onFamilyChange}
        seventh={seventh}
        onSeventhChange={onSeventhChange}
      />

      <HomeKeyNote tonic={tonic} family={family} />

      <FlowChart
        tonic={tonic.note}
        tonicLabel={tonic.label}
        family={home}
        seventh={seventh}
        from={standing}
        onPick={(degree) => onSongChange(appendStep(song, { degree }))}
      />

      <SongPanel
        tonic={tonic.note}
        tonicLabel={tonic.label}
        family={home}
        seventh={seventh}
        song={song}
        onChange={onSongChange}
      />

      <p className="text-muted-foreground text-sm">{shapeNote(home)}</p>
    </div>
  );
}
