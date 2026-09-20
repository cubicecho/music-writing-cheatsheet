import type { ReactNode } from 'react';
import { SectionHeading } from '@/components/section-heading';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import type { Scale } from '@/lib/music';
import { ChordTable } from './ChordTable';
import { IntervalBreakdown, NoteStrip, playScale } from './NoteStrip';
import { PlayButton } from './PlayButton';

type ScalePanelProps = {
  title: string;
  subtitle?: ReactNode;
  scale: Scale;
  seventh: boolean;
};

/** One scale, everything about it: the notes, the intervals, and the chords standing on them. */
export function ScalePanel({ title, subtitle, scale, seventh }: ScalePanelProps) {
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
          <ChordTable scale={scale} seventh={seventh} />
        </div>
      </CardContent>
    </Card>
  );
}
