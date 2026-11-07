import { Button } from '@/components/ui/button';
import { Play, Square } from '@/components/ui/icons';

type PlayButtonProps = {
  playing?: boolean;
  onClick: () => void;
  /** Left off for the icon-only buttons that sit inside a chord row. */
  label?: string;
  /** The accessible name: "Play the whole song in C major". */
  title: string;
  /** For a transport that is not the one in charge — a section, while the whole song is playing. */
  disabled?: boolean;
  /** Why it is unavailable, said where a disabled control can still be read. */
  hint?: string;
};

/**
 * Play, and stop, for everything on the page that makes a noise.
 *
 * A `Button` with the transport's two states mapped onto two of its variants: filled while it is
 * playing, because the button is also the only readout the transport has. Without a label it is
 * `icon-xs`, the 28px square that sits in a table row next to a chord, where `icon` would be a
 * 40px control of its own.
 *
 * `hint` is what makes a disabled one worth drawing: with one, `Button` swaps `disabled` for
 * `aria-disabled`, so a section's transport still takes the pointer and the focus while the whole
 * song is playing and can say why it is refusing. Without a hint there is no tooltip, so the
 * name is not repeated on hover.
 */
export function PlayButton({ playing = false, onClick, label, title, disabled = false, hint }: PlayButtonProps) {
  const Icon = playing ? Square : Play;
  const shared = {
    variant: playing ? ('default' as const) : ('outline' as const),
    onClick,
    disabled,
    'aria-label': title,
    iconSlot: <Icon fill="currentColor" />,
    ...(hint === undefined ? {} : { hint }),
  };

  return label ? (
    <Button {...shared} size="xs" content={label} className="shrink-0" />
  ) : (
    <Button {...shared} size="icon-xs" className="shrink-0" />
  );
}
