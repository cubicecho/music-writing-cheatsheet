import { Button } from '@/components/ui/button';
import { ArrowRight } from '@/components/ui/icons';
import type { RelatedKey, ScaleFamily, Tonic } from '@/lib/music';
import { familyScale, findTonic, formatNote, type Note, parallelKey, pitchClass, relativeKey } from '@/lib/music';

type RelatedKeysProps = {
  tonic: Tonic;
  family: ScaleFamily;
  onSelect: (tonicId: string, familyId: string) => void;
};

function Link({ related, onSelect }: { related: RelatedKey; onSelect: (tonicId: string, familyId: string) => void }) {
  const target = findTonic(related.tonic);
  if (!target) return null;

  return (
    <Button variant="outline" size="xs" onClick={() => onSelect(target.id, related.family.id)}>
      {/* One string, not two and a space: Button colours a bare string child by wrapping it, and
          three children would be three wrappers with the gap of the button's own row between. */}
      {`${formatNote(related.tonic)} ${related.family.name.toLowerCase()}`}
      <ArrowRight />
    </Button>
  );
}

const COUNTS = ['no', 'one', 'two', 'three', 'four', 'five', 'six', 'seven'];

/** How many notes of the other key this one does not have — three, for major against minor. */
function notesChanged(tonic: Note, family: ScaleFamily, other: RelatedKey): number {
  const own = new Set(familyScale(tonic, family).degrees.map((degree) => pitchClass(degree.note)));
  return familyScale(other.tonic, other.family).degrees.filter((degree) => !own.has(pitchClass(degree.note))).length;
}

/**
 * The two other keys worth knowing about from wherever you are standing.
 *
 * Relative and parallel are the two ways one key is "the same" as another, and they are the two
 * that get confused: the relative shares every note and moves the root, the parallel keeps the
 * root and changes three notes. Putting them side by side, as somewhere you can actually go, is
 * the shortest explanation of the difference there is.
 */
export function RelatedKeys({ tonic, family, onSelect }: RelatedKeysProps) {
  const relative = relativeKey(tonic.note, family);
  const parallel = parallelKey(tonic.note, family);
  if (!relative && !parallel) return null;

  return (
    <div className="flex flex-wrap items-center gap-x-6 gap-y-3 rounded-lg border border-border border-dashed px-4 py-3">
      {relative ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">{`Relative — same ${COUNTS[family.intervals.length]} notes, new home:`}</span>
          <Link related={relative} onSelect={onSelect} />
        </div>
      ) : null}
      {parallel ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-muted-foreground text-sm">{`Parallel — same root, ${COUNTS[notesChanged(tonic.note, family, parallel)]} notes moved:`}</span>
          <Link related={parallel} onSelect={onSelect} />
        </div>
      ) : null}
    </div>
  );
}
