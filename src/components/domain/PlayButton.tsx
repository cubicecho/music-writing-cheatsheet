// Play and Square come straight from lucide-react: @cubeui/icons curates a fixed set and it has
// no transport icons in it. See AGENTS.md.
import { Play, Square } from 'lucide-react';

type PlayButtonProps = {
  playing?: boolean;
  onClick: () => void;
  /** Left off for the icon-only buttons that sit inside a chord row. */
  label?: string;
  title: string;
};

export function PlayButton({ playing = false, onClick, label, title }: PlayButtonProps) {
  const Icon = playing ? Square : Play;

  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      aria-label={title}
      className={`inline-flex shrink-0 cursor-pointer items-center gap-1.5 rounded-md border px-2 py-1 font-medium text-xs transition-colors ${
        playing
          ? 'border-primary bg-primary text-primary-foreground'
          : 'border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground'
      }`}
    >
      <Icon className="h-3 w-3" fill="currentColor" />
      {label ? <span>{label}</span> : null}
    </button>
  );
}
