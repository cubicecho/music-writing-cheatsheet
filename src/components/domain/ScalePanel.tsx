import type { ReactNode } from 'react';
import { SectionHeading } from '@/components/section-heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Chord, Scale } from '@/lib/music';
import { ChordTable } from './ChordTable';
import { IntervalBreakdown, NoteStrip, playScale } from './NoteStrip';
import { PlayButton } from './PlayButton';

type ScalePanelProps = {
  title: string;
  subtitle?: ReactNode;
  scale: Scale;
  seventh: boolean;
  /** The chords to list. Empty, the chord section is `chordNote` alone. */
  chords: Chord[];
  /** A line above the chords saying where they come from, when it is not the scale itself. */
  chordNote?: ReactNode;
};

/** One scale, everything about it: the notes, the intervals, and the chords that go with it. */
export function ScalePanel({ title, subtitle, scale, seventh, chords, chordNote }: ScalePanelProps) {
  return (
    <Card>
      <CardHeader className="gap-2 pb-4">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle className="text-xl">{title}</CardTitle>
          <PlayButton onClick={() => playScale(scale)} label="Play scale" title={`Play ${title} from the root up`} />
        </div>
        {subtitle ? <span className="text-muted-foreground text-sm">{subtitle}</span> : null}
      </CardHeader>
      <CardContent className="gap-6">
        <NoteStrip scale={scale} />
        <IntervalBreakdown scale={scale} />
        <div className="flex flex-col gap-2">
          <SectionHeading variant="overline">{seventh ? 'Seventh chords' : 'Triads'}</SectionHeading>
          {chordNote ? <span className="text-muted-foreground text-sm">{chordNote}</span> : null}
          {chords.length > 0 ? <ChordTable chords={chords} /> : null}
        </div>
      </CardContent>
    </Card>
  );
}
