import { CardLayout } from '@/components/card-layout';
import { SectionHeading } from '@/components/section-heading';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Download } from '@/components/ui/icons';
import type { Rhythm } from '@/lib/rhythm';
import { INSTRUMENT_ORDER, INSTRUMENTS, PHRASE_BARS, rhythmToMidi, STYLES, tempoMark } from '@/lib/rhythm';
import { PanelTitle } from './PanelTitle';
import { PlayButton } from './PlayButton';
import { RhythmGrid } from './RhythmGrid';
import { RhythmStaff } from './RhythmStaff';
import { useRhythmPlayback } from './useRhythmPlayback';

/**
 * Hands the browser the four-bar phrase as a `.mid` file.
 *
 * The bytes come from `rhythmToMidi`, which is pure and tested; this is only the anchor-and-click
 * a browser needs before it will save a blob, and the object URL is let go as soon as it has.
 */
function downloadMidi(rhythm: Rhythm): void {
  const url = URL.createObjectURL(new Blob([rhythmToMidi(rhythm)], { type: 'audio/midi' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `${rhythm.id}.mid`;
  link.click();
  URL.revokeObjectURL(url);
}

/** One rhythm: what it is, how it is written, how it sits on a grid, and a way to take it with you. */
export function RhythmPanel({ rhythm }: { rhythm: Rhythm }) {
  const { playing, step, toggle } = useRhythmPlayback(rhythm);
  const style = STYLES.find((candidate) => candidate.id === rhythm.style)!;
  const played = INSTRUMENT_ORDER.filter((instrument) => rhythm.voices[instrument] !== undefined);

  return (
    <CardLayout
      title={
        <PanelTitle
          title={rhythm.name}
          meta={`${rhythm.meter} · ${tempoMark(rhythm)}${rhythm.swing ? ' · swung' : ''}`}
        />
      }
      description={rhythm.description}
      actionSlot={
        <>
          <Badge variant="outline">{style.name}</Badge>
          <PlayButton
            playing={playing}
            onClick={toggle}
            label={playing ? 'Stop' : 'Play'}
            title={`${playing ? 'Stop' : 'Play'} ${PHRASE_BARS} bars of ${rhythm.name}`}
          />
          <Button
            size="xs"
            variant="outline"
            onClick={() => downloadMidi(rhythm)}
            iconSlot={<Download />}
            content="MIDI"
            hint={`Download ${PHRASE_BARS} bars of ${rhythm.name} as a MIDI file`}
          />
        </>
      }
      contentClassName="gap-5"
      contentSlot={
        <>
          <div className="flex flex-col gap-2">
            <SectionHeading variant="overline">On the staff</SectionHeading>
            <RhythmStaff rhythm={rhythm} activeStep={step} />
            <p className="text-muted-foreground text-xs">
              {played
                .map((instrument) => `${INSTRUMENTS[instrument].name}: ${INSTRUMENTS[instrument].where}`)
                .join(' · ')}
            </p>
          </div>

          <div className="flex flex-col gap-2">
            <SectionHeading variant="overline">On a grid</SectionHeading>
            <RhythmGrid rhythm={rhythm} activeStep={step} />
          </div>

          {rhythm.heardIn ? (
            <p className="text-muted-foreground text-sm">
              <span className="text-foreground">Heard in</span> {rhythm.heardIn}.
            </p>
          ) : null}
        </>
      }
    />
  );
}
