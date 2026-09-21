// Play and Square come straight from lucide-react: @cubeui/icons curates a fixed set and it has
// no transport icons in it. See AGENTS.md.
import { Play, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PlayButtonProps = {
  playing?: boolean;
  onClick: () => void;
  /** Left off for the icon-only buttons that sit inside a chord row. */
  label?: string;
  title: string;
};

/**
 * Play, and stop, for everything on the page that makes a noise.
 *
 * A `Button` with the transport's two states mapped onto two of its variants: filled while it is
 * playing, because the button is also the only readout the transport has. Without a label it is
 * squared off by hand — `size="icon"` is a 40px button, which is a control of its own rather than
 * something that sits in a table row next to a chord.
 */
export function PlayButton({ playing = false, onClick, label, title }: PlayButtonProps) {
  const Icon = playing ? Square : Play;

  return (
    <Button
      size="xs"
      variant={playing ? 'default' : 'outline'}
      onClick={onClick}
      title={title}
      aria-label={title}
      className={label ? 'shrink-0' : 'w-7 shrink-0 px-0'}
    >
      <Icon fill="currentColor" />
      {label}
    </Button>
  );
}
