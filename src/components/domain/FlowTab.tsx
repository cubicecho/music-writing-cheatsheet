import type { ProgressionStep, ScaleFamily, Tonic } from '@/lib/music';
import { seventhKind } from '@/lib/music';
import { FlowChart } from './FlowChart';
import { FlowRoute } from './FlowRoute';
import { KeyPicker } from './KeyPicker';

type FlowTabProps = {
  tonic: Tonic;
  onTonicChange: (id: string) => void;
  family: ScaleFamily;
  onFamilyChange: (id: string) => void;
  seventh: boolean;
  onSeventhChange: (seventh: boolean) => void;
  route: ProgressionStep[];
  onAppendStep: (step: ProgressionStep) => void;
  onRemoveStep: (position: number) => void;
  onClearRoute: () => void;
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
 */
export function FlowTab({
  tonic,
  onTonicChange,
  family,
  onFamilyChange,
  seventh,
  onSeventhChange,
  route,
  onAppendStep,
  onRemoveStep,
  onClearRoute,
}: FlowTabProps) {
  const standing = route.length > 0 ? route[route.length - 1]!.degree : undefined;

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

      <FlowChart
        tonic={tonic.note}
        tonicLabel={tonic.label}
        family={family}
        seventh={seventh}
        from={standing}
        onPick={(degree) => onAppendStep({ degree })}
      />

      <FlowRoute
        tonic={tonic.note}
        tonicLabel={tonic.label}
        family={family}
        seventh={seventh}
        steps={route}
        onRemove={onRemoveStep}
        onClear={onClearRoute}
      />

      <p className="text-muted-foreground text-sm">{shapeNote(family)}</p>
    </div>
  );
}
