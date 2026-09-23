import type { ScaleFamily, Tonic } from '@/lib/music';
import { harmonicHome } from '@/lib/music';

/**
 * Said when the scale picked is pentatonic or blues: the tab below is reading its home key.
 *
 * Progressions and the chord map walk between chords on seven degrees, which a five- or six-note
 * scale does not have. The honest answer is the key the scale is played in, and saying so beats
 * quietly swapping the scale out from under the picker.
 */
export function HomeKeyNote({ tonic, family }: { tonic: Tonic; family: ScaleFamily }) {
  const home = harmonicHome(family);
  if (home === family) return null;

  return (
    <p className="text-muted-foreground text-sm">
      {`${family.name} has no chords of its own to move between, so this is ${tonic.label} ${home.name.toLowerCase()} — the key it is played in. `}
      {family.harmony
        ? 'The changes it is usually played over are on the Scale & chords tab.'
        : `Every note of ${family.name.toLowerCase()} fits over these chords.`}
    </p>
  );
}
