import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { playPitches } from '@/lib/audio';
import type { Chord, TriadQuality } from '@/lib/music';
import { formatNote, midiNumber, voiceChord } from '@/lib/music';
import { PlayButton } from './PlayButton';

const QUALITY_BADGE: Record<TriadQuality, { variant: 'default' | 'secondary' | 'outline' | 'warning'; label: string }> =
  {
    major: { variant: 'default', label: 'major' },
    minor: { variant: 'secondary', label: 'minor' },
    diminished: { variant: 'outline', label: 'dim' },
    augmented: { variant: 'warning', label: 'aug' },
    sus2: { variant: 'outline', label: 'sus2' },
    sus4: { variant: 'outline', label: 'sus4' },
    other: { variant: 'outline', label: 'other' },
  };

function ChordRow({ chord }: { chord: Chord }) {
  const badge = QUALITY_BADGE[chord.quality];

  return (
    <div className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2 sm:gap-3">
      <span className="w-10 shrink-0 font-mono text-muted-foreground text-sm sm:w-14">{chord.numeral}</span>
      <span className="min-w-16 shrink-0 font-semibold text-base text-foreground sm:w-28">{chord.symbol}</span>
      <div className="flex min-w-0 flex-1 flex-wrap gap-1.5">
        {chord.tones.map((tone) => (
          <Tooltip key={tone.interval.short}>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => playPitches([midiNumber(tone.note, 4)], { strum: false })}
                className="cursor-pointer rounded border border-border/60 bg-muted/50 px-1.5 py-0.5 font-mono text-foreground text-xs hover:border-primary/40"
              >
                {formatNote(tone.note)}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="block font-medium">{tone.interval.name} — click to hear it</span>
              <span className="block text-popover-foreground/70 text-xs">
                the {tone.interval.degree} of {chord.symbol} · {tone.interval.semitones} semitones above{' '}
                {formatNote(chord.root)}
              </span>
            </TooltipContent>
          </Tooltip>
        ))}
      </div>
      {/* The symbol already says the quality, so at phone width the badge gives up its room to the notes. */}
      <Badge variant={badge.variant} className="hidden sm:inline-flex">
        {badge.label}
      </Badge>
      <PlayButton onClick={() => playPitches(voiceChord(chord.notes))} title={`Play ${chord.symbol}`} />
    </div>
  );
}

/**
 * A list of chords, one row each: numeral, symbol, the notes, the quality.
 *
 * The caller decides which chords. For a seven-note scale that is thirds stacked out of its own
 * notes and nothing else — so the table is a fact about the scale rather than a list of chords
 * that tend to go together, and the odd ones the exotic modes throw up (a `C+`, a `m(maj7)`) are
 * there because the scale really does contain them. A pentatonic or blues scale has no chords of
 * its own and passes the ones it is played over.
 */
export function ChordTable({ chords }: { chords: Chord[] }) {
  return (
    <div className="flex flex-col gap-1.5">
      {chords.map((chord) => (
        <ChordRow chord={chord} key={chord.degreeIndex} />
      ))}
    </div>
  );
}
