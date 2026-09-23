import { Fragment, useLayoutEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ToggleChip } from '@/components/ui/toggle-chip';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import type { FlowChord, FlowMove, MoveStrength, Note, ScaleFamily } from '@/lib/music';
import { FLOW_ROLES, realizeFlow } from '@/lib/music';

type FlowChartProps = {
  tonic: Note;
  tonicLabel: string;
  family: ScaleFamily;
  seventh: boolean;
  /** The degree you are standing on — the last chord of the route, when there is one. */
  from?: number | undefined;
  onPick: (degree: number) => void;
};

// ---------------------------------------------------------------------------
// Geometry
//
// The arrows are drawn between the chips rather than laid out with them, because the chips are
// real buttons — a chord's label decides its width, and the browser decides where flex and the
// viewport put it. So: measure where the chips landed, then draw. That is one ResizeObserver and
// a little trigonometry, and in exchange the graph reflows correctly at any width, in any key,
// with or without 7ths, without a single hard-coded coordinate.
// ---------------------------------------------------------------------------

type Point = { x: number; y: number };
/** A chip, as the arrows need it: where its middle is and how far its edges are from that. */
type Box = { cx: number; cy: number; hw: number; hh: number };
/** Where everything is, and the labels it was true for — see `useGraphGeometry`. */
type Geometry = { signature: string; width: number; height: number; boxes: Map<number, Box> };

const EMPTY_GEOMETRY: Geometry = { signature: '', width: 0, height: 0, boxes: new Map() };

function useGraphGeometry(signature: string) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chips = useRef(new Map<number, HTMLElement>());
  const [geometry, setGeometry] = useState<Geometry>(EMPTY_GEOMETRY);

  // Layout effect, not effect: this runs between the browser laying the chips out and painting
  // them, so the arrows appear with the chips rather than a frame behind them.
  useLayoutEffect(() => {
    const root = containerRef.current;
    if (!root) return;

    const measure = () => {
      const base = root.getBoundingClientRect();
      const boxes = new Map<number, Box>();
      for (const [degree, chip] of chips.current) {
        const rect = chip.getBoundingClientRect();
        boxes.set(degree, {
          cx: rect.left - base.left + rect.width / 2,
          cy: rect.top - base.top + rect.height / 2,
          hw: rect.width / 2,
          hh: rect.height / 2,
        });
      }
      // Stamped with the labels it was measured for, so a caller can tell a fresh measurement
      // from one taken of chips that have since been relabelled.
      setGeometry({ signature, width: base.width, height: base.height, boxes });
    };

    measure();
    // The chips as well as the box: a font finishing loading changes a chip's width without
    // changing the container's, and then every arrow points at where the chip used to be.
    const observer = new ResizeObserver(measure);
    observer.observe(root);
    for (const chip of chips.current.values()) observer.observe(chip);
    return () => observer.disconnect();
  }, [signature]);

  const register = (degree: number) => (element: HTMLElement | null) => {
    if (element) chips.current.set(degree, element);
    else chips.current.delete(degree);
  };

  // A measurement of the previous labels is not a measurement: it would point every arrow at
  // where a chip used to be. Hand back nothing until this signature has been measured.
  return { containerRef, register, geometry: geometry.signature === signature ? geometry : EMPTY_GEOMETRY };
}

/** How far a curve bulges off the straight line, as a share of its length, and its ceiling. */
const BOW = 0.18;
const MAX_BOW = 90;

/** Where a line from the middle of a chip towards `toward` leaves the chip, plus a little air. */
function borderPoint(box: Box, toward: Point, pad = 7): Point {
  const dx = toward.x - box.cx;
  const dy = toward.y - box.cy;
  const length = Math.hypot(dx, dy);
  if (length === 0) return { x: box.cx, y: box.cy };

  const reach = Math.min(dx === 0 ? Infinity : box.hw / Math.abs(dx), dy === 0 ? Infinity : box.hh / Math.abs(dy));
  const scale = reach + pad / length;
  return { x: box.cx + dx * scale, y: box.cy + dy * scale };
}

/**
 * One arrow, as a curve that starts and ends on the two chips' edges.
 *
 * The curve always bows to the same side of the direction it travels, which does two things at
 * once: a move and its answer (ii→V and V→ii, say) are two separate arcs instead of one line
 * drawn twice, and since the columns run left to right, everything heading away from home arcs
 * over the top while every cadence comes back underneath. That is the shape of the chart in the
 * books, and it falls out of the sign rather than being drawn in by hand.
 */
function edgeShape(from: Box, to: Box) {
  const dx = to.cx - from.cx;
  const dy = to.cy - from.cy;
  const length = Math.hypot(dx, dy) || 1;
  const bow = Math.min(length * BOW, MAX_BOW);
  const control = {
    x: (from.cx + to.cx) / 2 + (dy / length) * bow,
    y: (from.cy + to.cy) / 2 - (dx / length) * bow,
  };

  const start = borderPoint(from, control);
  const tip = borderPoint(to, control);
  return { d: `M ${start.x} ${start.y} Q ${control.x} ${control.y} ${tip.x} ${tip.y}`, tip, control };
}

/** The head, as a triangle pointing the way the curve was going when it arrived. */
function arrowHead(tip: Point, from: Point, size = 7): string {
  const dx = tip.x - from.x;
  const dy = tip.y - from.y;
  const length = Math.hypot(dx, dy) || 1;
  const ux = dx / length;
  const uy = dy / length;
  const base = { x: tip.x - ux * size, y: tip.y - uy * size };
  const half = size * 0.55;
  return [
    `${tip.x},${tip.y}`,
    `${base.x - uy * half},${base.y + ux * half}`,
    `${base.x + uy * half},${base.y - ux * half}`,
  ].join(' ');
}

// ---------------------------------------------------------------------------
// Drawing
// ---------------------------------------------------------------------------

const STROKE_WIDTH: Record<MoveStrength, number> = { strong: 2, common: 1.25, colour: 1.25 };
const DASH: Partial<Record<MoveStrength, string>> = { colour: '4 4' };

/** How plainly a chip is drawn, by how well-trodden the move onto it is. */
const STRENGTH_CLASS = {
  strong: 'border-primary text-foreground',
  common: 'border-primary/50',
  colour: 'border-primary/30 border-dashed',
} as const;

/**
 * Three columns, and the grid column each one sits in — written out, so Tailwind can see them.
 *
 * Three at every width, including a phone's. Stacking them would put a whole column between two
 * chords the chart draws an arrow between, and the arrow would then cross the heading of the
 * column it was passing through: left to right *is* the chart, so it survives the narrow layout
 * and the explanatory line under each heading is what gets dropped instead.
 */
const COLUMN_CLASS = ['col-start-1', 'col-start-2', 'col-start-3'] as const;

/**
 * A different top offset per column, which is the whole reason the graph is readable.
 *
 * Without it the first chord of each column sits at the same height as the first chord of the
 * next, and I→ii→V is three boxes and two perfectly horizontal lines that every other arrow then
 * runs along. Nudging the columns out of line turns those into arcs that can be told apart.
 */
const COLUMN_OFFSET = ['pt-1 md:pt-2', 'pt-7 md:pt-12', 'pt-3 md:pt-5'] as const;

const LEGEND: { strength: MoveStrength; label: string }[] = [
  { strength: 'strong', label: 'the move the chart is built on' },
  { strength: 'common', label: 'ordinary' },
  { strength: 'colour', label: 'rarer, and usually on purpose' },
];

function ChartChip({
  entry,
  current,
  move,
  standing,
  onPick,
}: {
  entry: FlowChord;
  /** True for the chord the route is sitting on. */
  current: boolean;
  /** The move that gets here from where you are standing, when the chart draws one. */
  move: FlowMove | undefined;
  /** False before the first chord, when every chord is a legal opening. */
  standing: boolean;
  onPick: (degree: number) => void;
}) {
  const { node, chord } = entry;
  // Off the chart is dimmed rather than disabled: the chart is what people usually do, and a tool
  // that refuses the rest is teaching that the rest is wrong.
  const offChart = standing && !current && move === undefined;
  const className = current ? undefined : move ? STRENGTH_CLASS[move.strength] : standing ? 'opacity-45' : undefined;

  return (
    <Tooltip>
      {/* The chip is the trigger. It takes the rest of a button's props and forwards a ref, so
          what Radix clones onto it lands on the button a person actually hovers. */}
      <TooltipTrigger asChild>
        <ToggleChip selected={current} onClick={() => onPick(node.degree)} className={className}>
          {`${chord.numeral} · ${chord.symbol}`}
        </ToggleChip>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        <span className="block font-medium">
          {chord.symbol} — {node.name.toLowerCase()}
        </span>
        <span className="block max-w-72 text-popover-foreground/70 text-xs">{node.blurb}</span>
        {move ? <span className="mt-1 block max-w-72 text-popover-foreground/70 text-xs">{move.note}</span> : null}
        {offChart ? (
          <span className="mt-1 block max-w-72 text-popover-foreground/70 text-xs">
            The chart draws no arrow here from where you are. Play it anyway if it sounds right.
          </span>
        ) : null}
      </TooltipContent>
    </Tooltip>
  );
}

/**
 * The common-progressions flowchart, drawn.
 *
 * Three columns, left to right, and every arrow eventually lands back on the first: that is the
 * chart every theory book draws, and the reason to make it clickable rather than a picture is that
 * a picture cannot tell you what its arrows sound like in the key you are writing in. Standing on
 * a chord lights that chord's own arrows and fades the rest of the graph to a ghost — fades, not
 * removes, because what is worth seeing there is that the chart goes on without you.
 *
 * Arrows that are nobody's move right now are drawn faintly and the rare ones are left out
 * entirely until you are standing somewhere they leave from: seven chords have about twenty-five
 * moves between them, and all twenty-five at once is a picture of a graph rather than a picture of
 * how a key works.
 */
export function FlowChart({ tonic, tonicLabel, family, seventh, from, onPick }: FlowChartProps) {
  const entries = realizeFlow(tonic, family, seventh);
  const standing = entries.find(({ node }) => node.degree === from);
  const moves = new Map(standing?.node.moves.map((move) => [move.to, move]) ?? []);
  const chordFor = (degree: number) => entries.find(({ node }) => node.degree === degree);

  const columns = FLOW_ROLES.map((column) => ({
    ...column,
    entries: entries.filter(({ node }) => node.role === column.role),
  }));

  // The chord labels are the signature: they are what decides a chip's width, so a change of key,
  // scale or 7ths is a change of layout and everything has to be measured again.
  const { containerRef, register, geometry } = useGraphGeometry(entries.map((entry) => entry.chord.symbol).join(' '));

  const edges = entries
    .flatMap(({ node }) =>
      node.moves.map((move) => ({
        key: `${node.degree}-${move.to}`,
        from: node.degree,
        to: move.to,
        strength: move.strength,
        lit: node.degree === from,
      })),
    )
    // Standing nowhere, only the skeleton: seven chords have twenty-five moves between them, and
    // all twenty-five at once is a picture of a graph rather than a picture of how a key works.
    // The rest arrive the moment you are standing somewhere they leave from.
    .filter((edge) => edge.lit || edge.strength === 'strong')
    // Lit last, so a highlighted arrow is never drawn under a ghost of another one.
    .sort((left, right) => Number(left.lit) - Number(right.lit));

  return (
    <Card>
      <CardHeader className="gap-2 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">The chord map</CardTitle>
          <span className="text-muted-foreground text-sm">
            in {tonicLabel} {family.name.toLowerCase()}
          </span>
        </div>
        <span className="text-muted-foreground text-sm">
          {standing
            ? `You are on ${standing.chord.symbol}. Its arrows are lit; the dimmed chords are the ones the chart does not draw one to — still playable, just not what most songs do next.`
            : 'Click a chord to start. Most things start at home, on the left; the chart will then light up where that chord usually goes.'}
        </span>
      </CardHeader>

      <CardContent className="gap-5">
        <div
          ref={containerRef}
          className="relative grid grid-cols-3 grid-rows-[auto_1fr] gap-x-2 gap-y-4 py-2 sm:gap-x-8 md:gap-x-14 md:gap-y-10"
        >
          {geometry.width > 0 ? (
            <svg
              className="pointer-events-none absolute inset-0 overflow-visible"
              width={geometry.width}
              height={geometry.height}
              viewBox={`0 0 ${geometry.width} ${geometry.height}`}
              aria-hidden
            >
              {edges.map((edge) => {
                const tail = geometry.boxes.get(edge.from);
                const head = geometry.boxes.get(edge.to);
                if (!tail || !head) return null;

                const { d, tip, control } = edgeShape(tail, head);
                const opacity = edge.lit ? 1 : standing ? 0.1 : edge.strength === 'strong' ? 0.45 : 0.25;
                return (
                  <g key={edge.key} className={edge.lit ? 'text-primary' : 'text-muted-foreground'} opacity={opacity}>
                    <path
                      d={d}
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={STROKE_WIDTH[edge.strength]}
                      strokeDasharray={DASH[edge.strength]}
                      strokeLinecap="round"
                    />
                    <polygon points={arrowHead(tip, control)} fill="currentColor" />
                  </g>
                );
              })}
            </svg>
          ) : null}

          {columns.map((column, index) => (
            <Fragment key={column.role}>
              <div className={`relative row-start-1 flex flex-col gap-0.5 ${COLUMN_CLASS[index]}`}>
                <span className="font-semibold text-muted-foreground text-xs uppercase tracking-wide">
                  {column.label}
                </span>
                {/* The first thing to go when there is no room for it: on a phone the chart itself
                    has to fit across three columns, and a chord's tooltip says the same thing. */}
                <span className="hidden text-muted-foreground text-xs md:block">{column.hint}</span>
              </div>
              <div
                className={`relative row-start-2 flex flex-col items-center gap-6 md:gap-11 ${COLUMN_CLASS[index]} ${COLUMN_OFFSET[index]}`}
              >
                {column.entries.map((entry) => (
                  // The ref goes on a wrapper of its own rather than on the tooltip's trigger:
                  // what the arrows need to know is where the chip is, and that should not depend
                  // on whether something else is also holding a ref to it.
                  <div key={entry.node.degree} ref={register(entry.node.degree)} className="inline-flex">
                    <ChartChip
                      entry={entry}
                      current={entry.node.degree === from}
                      move={moves.get(entry.node.degree)}
                      standing={standing !== undefined}
                      onPick={onPick}
                    />
                  </div>
                ))}
              </div>
            </Fragment>
          ))}
        </div>

        <ul className="flex list-none flex-wrap items-center gap-x-5 gap-y-2 p-0 text-muted-foreground text-xs">
          {LEGEND.map(({ strength, label }) => (
            <li key={strength} className="flex items-center gap-2">
              <svg width="26" height="8" viewBox="0 0 26 8" aria-hidden className="shrink-0">
                <path
                  d="M 0 4 H 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={STROKE_WIDTH[strength]}
                  strokeDasharray={DASH[strength]}
                  strokeLinecap="round"
                />
                <polygon points="26,4 19,7 19,1" fill="currentColor" />
              </svg>
              {label}
            </li>
          ))}
          <li>A cadence is an arrow coming back to the left.</li>
        </ul>

        {standing ? (
          <div className="flex flex-col gap-2 border-border border-t pt-4">
            <span className="text-foreground text-sm">From {standing.chord.symbol}, the chart goes:</span>
            <ul className="flex list-none flex-col gap-2 p-0">
              {standing.node.moves.map((move) => {
                const target = chordFor(move.to);
                if (!target) return null;
                return (
                  <li key={move.to} className="flex flex-wrap items-baseline gap-2">
                    <Button
                      size="xs"
                      variant={move.strength === 'strong' ? 'default' : 'outline'}
                      onClick={() => onPick(move.to)}
                      title={`Add ${target.chord.symbol}`}
                    >
                      {`${target.chord.numeral} · ${target.chord.symbol}`}
                    </Button>
                    <span className="flex-1 text-muted-foreground text-sm">{move.note}</span>
                  </li>
                );
              })}
            </ul>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
