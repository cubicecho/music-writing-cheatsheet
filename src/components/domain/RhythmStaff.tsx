import type { NoteHead, Rhythm, StaffBeat, StaffSymbol } from '@/lib/rhythm';
import { INSTRUMENTS, METERS, notate, patternSteps, stepsPerBar } from '@/lib/rhythm';

type RhythmStaffProps = {
  rhythm: Rhythm;
  /** The step of the pattern that is sounding, so the note being played can be lit. */
  activeStep: number | null;
};

/** Half the distance between two staff lines: one step of `position`. */
const HALF_SPACE = 5;
const TOP_LINE_Y = 58;
/** Positions run up from the bottom line, so the top line is 8. */
const lineY = (position: number) => TOP_LINE_Y + (8 - position) * HALF_SPACE;
const MIDDLE_Y = lineY(4);
/** Every stem stops at the same height, which is what lets every beam be flat. */
const STEM_TOP = lineY(9) - 26;
const MARK_Y = STEM_TOP - 9;
const HEIGHT = 116;

/** Where the first bar starts, after the clef and the time signature. */
const LEFT = 62;
const BAR_PADDING = 18;
const REPEAT_ROOM = 14;
/** Sixteenths need less room each than eighths do, and there are twice as many of them. */
const STEP_WIDTH = { 2: 34, 3: 28, 4: 22 } as const;

const HEAD_HALF_WIDTH = 5.5;
const BEAM_HEIGHT = 4;
const BEAM_GAP = 7;
const STUB = 8;

const isBeamed = (symbol: StaffSymbol) => symbol.strokes.length > 0 && symbol.value.base !== 'quarter';

function Head({ head, x, y }: { head: NoteHead; x: number; y: number }) {
  if (head === 'cross') {
    return (
      <path
        d={`M${x - 4.5},${y - 4.5} L${x + 4.5},${y + 4.5} M${x - 4.5},${y + 4.5} L${x + 4.5},${y - 4.5}`}
        stroke="currentColor"
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    );
  }
  if (head === 'diamond') {
    return <path d={`M${x - 5.5},${y} L${x},${y - 5} L${x + 5.5},${y} L${x},${y + 5} Z`} />;
  }
  return <ellipse cx={x} cy={y} rx={5.8} ry={4.1} transform={`rotate(-20 ${x} ${y})`} />;
}

/** Hand-drawn rests: three shapes, close enough to engraving to be read and small enough to own. */
function Rest({ symbol, x }: { symbol: StaffSymbol; x: number }) {
  const { base, dotted } = symbol.value;
  const stroke = { stroke: 'currentColor', fill: 'none', strokeLinecap: 'round', strokeLinejoin: 'round' } as const;
  const y = MIDDLE_Y;

  return (
    <g>
      {base === 'quarter' ? (
        <path
          d={`M${x - 3},${y - 13} L${x + 3},${y - 5} L${x - 2.5},${y + 1} L${x + 3},${y + 8} C${x - 3},${y + 5} ${x - 6},${y + 10} ${x - 1},${y + 14}`}
          {...stroke}
          strokeWidth={2.2}
        />
      ) : (
        <>
          <path d={`M${x + 5},${y - 6} L${x - 1},${y + 12}`} {...stroke} strokeWidth={1.5} />
          {/* One hook for an eighth, two for a sixteenth, each a dot with a tail up to the stroke. */}
          {(base === 'sixteenth' ? [0, 1] : [0]).map((hook) => {
            const hookY = y - 5 + hook * 7;
            const hookX = x - 3 - hook * 2.3;
            return (
              <g key={hook}>
                <circle cx={hookX} cy={hookY} r={2.3} />
                <path
                  d={`M${hookX},${hookY + 1.5} Q${hookX + 5},${hookY + 2.5} ${x + 4.6 - hook * 2.3},${hookY - 0.5}`}
                  {...stroke}
                  strokeWidth={1.3}
                />
              </g>
            );
          })}
        </>
      )}
      {dotted ? <circle cx={x + 10} cy={y - HALF_SPACE} r={1.7} /> : null}
    </g>
  );
}

function Note({ symbol, x, flagged }: { symbol: StaffSymbol; x: number; flagged: boolean }) {
  const heads = symbol.strokes.map((stroke) => ({ ...stroke, ...INSTRUMENTS[stroke.instrument] }));
  const lowest = lineY(Math.min(...heads.map((head) => head.position)));
  const stemX = x + HEAD_HALF_WIDTH;
  const isOpen = heads.some((head) => head.instrument === 'openHat');
  const isAccented = heads.some((head) => head.level === 'accent');
  const flags = symbol.value.base === 'sixteenth' ? [0, 1] : [0];

  return (
    <g>
      <line x1={stemX} y1={lowest - 1} x2={stemX} y2={STEM_TOP} stroke="currentColor" strokeWidth={1.3} />
      {heads.map((head) => {
        const y = lineY(head.position);
        // A dot on a line is unreadable, so it moves up into the space above.
        const dotY = head.position % 2 === 0 ? y - HALF_SPACE : y;
        return (
          <g key={head.instrument}>
            <Head head={head.head} x={x} y={y} />
            {head.level === 'ghost' ? (
              <path
                d={`M${x - 8},${y - 6} q-4,6 0,12 M${x + 9},${y - 6} q4,6 0,12`}
                stroke="currentColor"
                fill="none"
                strokeWidth={1.2}
              />
            ) : null}
            {symbol.value.dotted ? <circle cx={x + 12} cy={dotY} r={1.7} /> : null}
          </g>
        );
      })}
      {flagged
        ? flags.map((flag) => (
            <path
              key={flag}
              d={`M${stemX},${STEM_TOP + flag * BEAM_GAP} c1,7 9,8 6,18`}
              stroke="currentColor"
              fill="none"
              strokeWidth={1.8}
              strokeLinecap="round"
            />
          ))
        : null}
      {isOpen ? <circle cx={stemX} cy={MARK_Y} r={3} stroke="currentColor" fill="none" strokeWidth={1.2} /> : null}
      {isAccented ? (
        <path
          // Above the ring when an accented note is also an open hi-hat, since both sit over the stem.
          d={`M${stemX - 5},${MARK_Y - 3.5 - (isOpen ? 9 : 0)} l10,3.5 l-10,3.5`}
          stroke="currentColor"
          fill="none"
          strokeWidth={1.4}
          strokeLinejoin="round"
        />
      ) : null}
    </g>
  );
}

/**
 * The beams over one beat.
 *
 * One beam joins every note shorter than a quarter; a second joins neighbouring sixteenths, and a
 * sixteenth with no sixteenth beside it gets a stub pointing at the note it belongs with.
 */
function Beams({ notes, xOf }: { notes: StaffSymbol[]; xOf: (step: number) => number }) {
  const stemX = (symbol: StaffSymbol) => xOf(symbol.step) + HEAD_HALF_WIDTH;
  const isSixteenth = (symbol: StaffSymbol | undefined) => symbol?.value.base === 'sixteenth';
  const [first, last] = [notes[0]!, notes[notes.length - 1]!];

  return (
    <g>
      <rect x={stemX(first) - 0.65} y={STEM_TOP} width={stemX(last) - stemX(first) + 1.3} height={BEAM_HEIGHT} />
      {notes.map((note, index) => {
        if (!isSixteenth(note)) return null;
        const next = notes[index + 1];
        const y = STEM_TOP + BEAM_GAP;
        if (isSixteenth(next)) {
          return <rect key={note.step} x={stemX(note)} y={y} width={stemX(next!) - stemX(note)} height={BEAM_HEIGHT} />;
        }
        if (isSixteenth(notes[index - 1])) return null;
        const x = index === 0 ? stemX(note) : stemX(note) - STUB;
        return <rect key={note.step} x={x} y={y} width={STUB} height={BEAM_HEIGHT} />;
      })}
    </g>
  );
}

function Beat({
  beat,
  xOf,
  activeStep,
}: {
  beat: StaffBeat;
  xOf: (step: number) => number;
  activeStep: number | null;
}) {
  const beamed = beat.filter(isBeamed);
  const shouldBeam = beamed.length > 1;

  return (
    <g>
      {beat.map((symbol) => (
        <g key={symbol.step} className={symbol.step === activeStep ? 'text-primary' : undefined} fill="currentColor">
          {symbol.strokes.length === 0 ? (
            <Rest symbol={symbol} x={xOf(symbol.step)} />
          ) : (
            <Note symbol={symbol} x={xOf(symbol.step)} flagged={isBeamed(symbol) && !shouldBeam} />
          )}
        </g>
      ))}
      {shouldBeam ? <Beams notes={beamed} xOf={xOf} /> : null}
    </g>
  );
}

/**
 * The pattern on a percussion staff.
 *
 * Drawn here rather than by an engraving library because a drum pattern needs so little of one:
 * three note lengths, three rests, flat beams, no pitch and no ties. `notate()` has already
 * decided every duration, so all this does is put shapes where it was told to.
 *
 * Steps are spaced evenly rather than by engraving rules, on purpose: the grid below spaces them
 * the same way, and reading one against the other is what the two views are there for.
 */
export function RhythmStaff({ rhythm, activeStep }: RhythmStaffProps) {
  const bars = notate(rhythm);
  const { numerator, denominator } = METERS[rhythm.meter];
  const stepWidth = STEP_WIDTH[rhythm.division];
  const barWidth = BAR_PADDING + stepsPerBar(rhythm) * stepWidth;
  // Room for the repeat sign, which would otherwise sit on a ghost note's bracket in the last step.
  const end = LEFT + bars.length * barWidth + REPEAT_ROOM;
  const width = end + 6;
  const xOf = (step: number) =>
    LEFT + Math.floor(step / stepsPerBar(rhythm)) * barWidth + BAR_PADDING + (step % stepsPerBar(rhythm)) * stepWidth;
  const active = activeStep === null ? null : activeStep % patternSteps(rhythm);
  const lines = [0, 2, 4, 6, 8];

  return (
    <div className="overflow-x-auto">
      <svg
        role="img"
        aria-label={`${rhythm.name} in drum notation, ${rhythm.meter}`}
        width={width}
        height={HEIGHT}
        viewBox={`0 0 ${width} ${HEIGHT}`}
        className="block text-foreground"
        fill="currentColor"
      >
        {lines.map((position) => (
          <line
            key={position}
            x1={4}
            y1={lineY(position)}
            x2={end}
            y2={lineY(position)}
            stroke="currentColor"
            strokeWidth={1}
            opacity={0.55}
          />
        ))}

        {/* The percussion clef: two bars, because there is no pitch for a clef to name. */}
        <rect x={12} y={lineY(6)} width={4} height={lineY(2) - lineY(6)} />
        <rect x={20} y={lineY(6)} width={4} height={lineY(2) - lineY(6)} />

        <g fontFamily="Georgia, 'Times New Roman', serif" fontSize={22} fontWeight={700} textAnchor="middle">
          <text x={43} y={lineY(4) - 2}>
            {numerator}
          </text>
          <text x={43} y={lineY(0) - 2}>
            {denominator}
          </text>
        </g>

        {rhythm.swing ? (
          <text x={LEFT} y={12} fontSize={12} fontStyle="italic">
            Swing
          </text>
        ) : null}

        {bars.map((bar, index) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: a bar is its position in the pattern and nothing else
          <g key={index}>
            {bar.map((beat) => (
              <Beat key={beat[0]!.step} beat={beat} xOf={xOf} activeStep={active} />
            ))}
            {index < bars.length - 1 ? (
              <line
                x1={LEFT + (index + 1) * barWidth}
                y1={lineY(8)}
                x2={LEFT + (index + 1) * barWidth}
                y2={lineY(0)}
                stroke="currentColor"
                strokeWidth={1}
              />
            ) : null}
          </g>
        ))}

        {/* A repeat sign rather than a final barline: the pattern goes round, and the download plays it out to four bars. */}
        <circle cx={end - 13} cy={lineY(5)} r={2} />
        <circle cx={end - 13} cy={lineY(3)} r={2} />
        <line x1={end - 8} y1={lineY(8)} x2={end - 8} y2={lineY(0)} stroke="currentColor" strokeWidth={1} />
        <rect x={end - 4} y={lineY(8)} width={4} height={lineY(0) - lineY(8)} />
      </svg>
    </div>
  );
}
