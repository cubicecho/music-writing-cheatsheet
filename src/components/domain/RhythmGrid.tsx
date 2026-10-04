import type { Level, Rhythm } from '@/lib/rhythm';
import { INSTRUMENT_ORDER, INSTRUMENTS, patternSteps, stepLabels, stepsPerBar, strokesAt } from '@/lib/rhythm';
import { cn } from '@/lib/utils';

type RhythmGridProps = {
  rhythm: Rhythm;
  /** The step of the pattern that is sounding, so its column can be lit. */
  activeStep: number | null;
};

/** The three ways to hit something, loudest darkest. Literal classes, so Tailwind can see them. */
const CELL = {
  accent: 'bg-primary',
  hit: 'bg-primary/65',
  ghost: 'bg-primary/25',
} as const satisfies Record<Level, string>;

const LEVEL_NAMES = { accent: 'Accent', hit: 'Hit', ghost: 'Ghost note' } as const satisfies Record<Level, string>;

/**
 * The pattern as a step grid: a row per instrument, a column per step, a filled cell per hit.
 *
 * This is the view a drum machine gives you and the one that needs no reading — which is the
 * reason it sits under the staff. A real table, so the counts are column
 * headers and the instruments are row headers and a screen reader can walk it either way.
 */
export function RhythmGrid({ rhythm, activeStep }: RhythmGridProps) {
  const perBar = stepsPerBar(rhythm);
  const steps = Array.from({ length: patternSteps(rhythm) }, (_, step) => step);
  const labels = stepLabels(rhythm);
  const rows = INSTRUMENT_ORDER.filter((instrument) => rhythm.voices[instrument] !== undefined);
  const levels = (['accent', 'hit', 'ghost'] as const).filter((level) =>
    steps.some((step) => strokesAt(rhythm, step).some((stroke) => stroke.level === level)),
  );
  const active = activeStep === null ? null : activeStep % steps.length;

  /** Room before each beat and more before each bar, so the eye groups the columns the way the count does. */
  const gap = (step: number) => {
    if (step === 0) return undefined;
    if (step % perBar === 0) return 'pl-4';
    return step % rhythm.division === 0 ? 'pl-2' : undefined;
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="overflow-x-auto">
        <table className="border-separate border-spacing-0.5 text-xs">
          <thead>
            <tr>
              <th className="sr-only">Instrument</th>
              {steps.map((step) => (
                <th
                  key={step}
                  scope="col"
                  className={cn(
                    'font-mono font-normal',
                    gap(step),
                    step % rhythm.division === 0 ? 'text-foreground' : 'text-muted-foreground',
                  )}
                >
                  {labels[step % perBar]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((instrument) => (
              <tr key={instrument}>
                <th scope="row" className="whitespace-nowrap pr-3 text-left font-normal text-muted-foreground">
                  {INSTRUMENTS[instrument].name}
                </th>
                {steps.map((step) => {
                  const level = strokesAt(rhythm, step).find((stroke) => stroke.instrument === instrument)?.level;
                  return (
                    <td key={step} className={cn('p-0', gap(step))}>
                      <div
                        className={cn(
                          'h-6 w-6 rounded-sm',
                          level === undefined ? 'bg-muted' : CELL[level],
                          step === active ? 'ring-2 ring-ring' : undefined,
                        )}
                      >
                        {level === undefined ? null : <span className="sr-only">{LEVEL_NAMES[level]}</span>}
                      </div>
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Only where there is something to tell apart: most rhythms here are one level throughout. */}
      {levels.length > 1 ? (
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-muted-foreground text-xs">
          {levels.map((level) => (
            <span key={level} className="inline-flex items-center gap-1.5">
              <span className={cn('h-3 w-3 rounded-sm', CELL[level])} />
              {LEVEL_NAMES[level]}
            </span>
          ))}
        </div>
      ) : null}
    </div>
  );
}
