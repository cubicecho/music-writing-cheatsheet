import { X } from '@/components/ui/icons';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { playPitches } from '@/lib/audio';
import type { ProgressionChord } from '@/lib/music';
import { formatNote, voiceChord } from '@/lib/music';

type ChordBlockProps = ProgressionChord & {
  /** Set while a sequence is sounding this chord. */
  active?: boolean;
  /** Given by the builder, where a block is something you can take back out again. */
  onRemove?: () => void;
};

/**
 * One chord of a progression: what to call it, what to play, and what it is made of.
 *
 * The numeral sits above the symbol rather than beside it because the numeral is the part worth
 * learning — it is the same in every key, which is the whole reason progressions are written that
 * way. Clicking sounds the chord; that is the fastest route from "♭VI" to knowing what a ♭VI is.
 */
export function ChordBlock({ chord, borrowedFrom, active = false, onRemove }: ChordBlockProps) {
  const border = active
    ? 'border-primary bg-primary/10 ring-1 ring-primary'
    : borrowedFrom
      ? 'border-primary/50 border-dashed bg-primary/5 hover:border-primary'
      : 'border-border bg-card hover:border-primary/40';

  return (
    <div className="relative">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={() => playPitches(voiceChord(chord.notes))}
            title={`Play ${chord.symbol}`}
            className={`flex min-w-24 cursor-pointer flex-col items-center gap-0.5 rounded-md border px-3 py-2 text-center transition-colors ${border}`}
          >
            <span className="font-mono text-muted-foreground text-xs">{chord.numeral}</span>
            <span className="font-semibold text-foreground text-lg leading-tight">{chord.symbol}</span>
            <span className="font-mono text-[0.7rem] text-muted-foreground">
              {chord.notes.map((note) => formatNote(note)).join(' ')}
            </span>
          </button>
        </TooltipTrigger>
        <TooltipContent>
          <span className="block font-medium">{chord.symbol} — click to hear it</span>
          <span className="block text-popover-foreground/70 text-xs">
            {chord.tones.map((tone) => `${formatNote(tone.note)} — ${tone.interval.name}`).join(' · ')}
          </span>
          {borrowedFrom ? (
            <span className="mt-1 block text-popover-foreground/70 text-xs">
              Not in this scale. Borrowed from {borrowedFrom.name.toLowerCase()} on the same root.
            </span>
          ) : null}
        </TooltipContent>
      </Tooltip>

      {onRemove ? (
        <button
          type="button"
          onClick={onRemove}
          title={`Remove ${chord.symbol}`}
          aria-label={`Remove ${chord.symbol}`}
          className="-right-1.5 -top-1.5 absolute inline-flex h-5 w-5 cursor-pointer items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:border-destructive hover:text-destructive"
        >
          <X className="h-3 w-3" />
        </button>
      ) : null}
    </div>
  );
}
