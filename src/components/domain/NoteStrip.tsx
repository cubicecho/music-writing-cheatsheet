import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { playPitches } from '@/lib/audio';
import type { Scale } from '@/lib/music';
import { formatNote, midiNumber, voiceScale } from '@/lib/music';
import { cn } from '@/lib/utils';

/** What a gap of this many semitones is called between two scale degrees. */
const STEP_NAMES: Record<number, string> = {
  1: 'half',
  2: 'whole',
  3: 'whole + half',
};

function stepName(semitones: number): string {
  return STEP_NAMES[semitones] ?? `${semitones} semitones`;
}

/** The compact label between two notes: H, W, or the augmented-2nd gap the harmonic scales leave. */
function stepLabel(semitones: number): string {
  if (semitones === 1) return 'H';
  if (semitones === 2) return 'W';
  return `${semitones}`;
}

/**
 * The scale as a row of notes, with the interval each one makes against the tonic and the step
 * from each note to the next.
 *
 * Both readings are here on purpose: the degree under each note is how a writer thinks about a
 * note ("the ♭3"), and the step between them is how a player finds it ("two frets up"). The
 * tooltip carries the formal name for anyone who wants it, and nobody has to read it to use this.
 */
export function NoteStrip({ scale }: { scale: Scale }) {
  return (
    <div className="flex flex-wrap items-stretch gap-y-3">
      {scale.degrees.map((degree, index) => (
        <div className="flex items-stretch" key={`${degree.interval.short}-${formatNote(degree.note)}`}>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                onClick={() => playPitches([midiNumber(degree.note, 4)], { strum: false })}
                title={`Play ${formatNote(degree.note)}`}
                className={cn(
                  'flex min-w-16 cursor-pointer flex-col items-center gap-0.5 rounded-md border px-3 py-2 text-center transition-colors',
                  index === 0
                    ? 'border-primary/40 bg-primary/10'
                    : 'border-border bg-card hover:border-primary/40 hover:bg-muted',
                )}
              >
                <span className="font-semibold text-foreground text-lg leading-none">{formatNote(degree.note)}</span>
                <span className="text-muted-foreground text-xs tabular-nums">{degree.interval.degree}</span>
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="block font-medium">{degree.interval.name} — click to hear it</span>
              <span className="block text-popover-foreground/70 text-xs">
                {degree.interval.short} · {degree.interval.semitones}{' '}
                {degree.interval.semitones === 1 ? 'semitone' : 'semitones'} above {formatNote(scale.tonic)}
                {degree.interval.isTritone ? ' · tritone' : ''}
              </span>
            </TooltipContent>
          </Tooltip>

          {/* The step to the next degree, including the wrap from the 7th back up to the octave. */}
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex w-7 cursor-help items-center justify-center text-muted-foreground/70 text-xs"
                aria-label={`${stepName(degree.stepToNext)} step`}
              >
                {stepLabel(degree.stepToNext)}
              </button>
            </TooltipTrigger>
            <TooltipContent>
              <span className="block">
                {stepName(degree.stepToNext)} step — {degree.stepToNext}{' '}
                {degree.stepToNext === 1 ? 'semitone' : 'semitones'}
              </span>
            </TooltipContent>
          </Tooltip>
        </div>
      ))}

      {/* The octave closes the row, so the last step has somewhere to land. */}
      <button
        type="button"
        onClick={() => playPitches([midiNumber(scale.tonic, 5)], { strum: false })}
        title={`Play ${formatNote(scale.tonic)} an octave up`}
        className="flex min-w-16 cursor-pointer flex-col items-center gap-0.5 rounded-md border border-border border-dashed px-3 py-2 text-center opacity-60 transition-opacity hover:opacity-100"
      >
        <span className="font-semibold text-foreground text-lg leading-none">{formatNote(scale.tonic)}</span>
        <span className="text-muted-foreground text-xs tabular-nums">8</span>
      </button>
    </div>
  );
}

/** The scale written as two number rows — semitones from the tonic, and the gaps between them. */
export function IntervalBreakdown({ scale }: { scale: Scale }) {
  const steps = scale.degrees.map((degree) => degree.stepToNext);

  return (
    <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-4 gap-y-1 text-sm">
      <dt className="text-muted-foreground">Semitones from the root</dt>
      <dd className="font-mono text-foreground tabular-nums">{scale.intervals.join(' · ')} · 12</dd>
      <dt className="text-muted-foreground">Step pattern</dt>
      <dd className="font-mono text-foreground">{steps.map(stepLabel).join(' · ')}</dd>
      <dt className="text-muted-foreground">Degrees</dt>
      <dd className="font-mono text-foreground">{scale.degrees.map((degree) => degree.interval.degree).join(' · ')}</dd>
    </dl>
  );
}

/** Runs the scale up, one note at a time — the way you would practise it. */
export function playScale(scale: Scale): void {
  const pitches = voiceScale(scale);
  pitches.forEach((midi, index) => {
    window.setTimeout(() => playPitches([midi], { strum: false, duration: 0.45 }), index * 260);
  });
}
