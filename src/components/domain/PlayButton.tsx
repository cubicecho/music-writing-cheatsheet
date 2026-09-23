import { ActionButton } from '@/components/action-button';
import { Play, Square } from '@/components/ui/icons';

type PlayButtonProps = {
  playing?: boolean;
  onClick: () => void;
  /** Left off for the icon-only buttons that sit inside a chord row. */
  label?: string;
  /** The accessible name, and the tooltip: "Play the whole song in C major". */
  title: string;
  /** For a transport that is not the one in charge — a section, while the whole song is playing. */
  disabled?: boolean;
  /** Why it is unavailable, said where a disabled control can still be read. */
  hint?: string;
};

/**
 * Play, and stop, for everything on the page that makes a noise.
 *
 * An `ActionButton` with the transport's two states mapped onto two of `Button`'s variants:
 * filled while it is playing, because the button is also the only readout the transport has.
 * Without a label it is squared off by hand — `size="icon"` is a 40px button, which is a control
 * of its own rather than something that sits in a table row next to a chord.
 *
 * `ActionButton` rather than `Button` for what it does when this is disabled: it swaps `disabled`
 * for `aria-disabled`, so a section's transport still takes the pointer and the focus while the
 * whole song is playing and can say why it is refusing.
 */
export function PlayButton({ playing = false, onClick, label, title, disabled = false, hint }: PlayButtonProps) {
  const Icon = playing ? Square : Play;

  return (
    <ActionButton
      size="xs"
      variant={playing ? 'default' : 'outline'}
      onClick={onClick}
      disabled={disabled}
      label={title}
      {...(hint === undefined ? {} : { hint })}
      className={label ? 'shrink-0' : 'w-7 shrink-0 px-0'}
    >
      <Icon fill="currentColor" />
      {label}
    </ActionButton>
  );
}
