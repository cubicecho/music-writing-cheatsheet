import { SectionHeading } from '@/components/section-heading';
import { ToggleChip } from '@/components/ui/toggle-chip';
import { findRhythm, PHRASE_BARS, RHYTHMS, STYLES } from '@/lib/rhythm';
import { RhythmPanel } from './RhythmPanel';

type RhythmsTabProps = {
  rhythmId: string;
  onSelectRhythm: (id: string) => void;
};

/**
 * The one tab that does not read the key: a rhythm is the same in every one.
 *
 * It works the way the Progressions tab does: chips grouped under headings, one of them picked at
 * a time, and a panel for the one that is.
 */
export function RhythmsTab({ rhythmId, onSelectRhythm }: RhythmsTabProps) {
  const shown = findRhythm(rhythmId);

  return (
    <div className="flex flex-col gap-6">
      <p className="text-muted-foreground text-sm">
        The beats most songs are built on, each written twice: on a drum staff, and on a grid with one column per step.
        Play one to hear {PHRASE_BARS} bars of it, or download those {PHRASE_BARS} bars as MIDI to drop into a DAW.
      </p>

      <div className="flex flex-col gap-5">
        {STYLES.map((style) => (
          <div key={style.id} className="flex flex-col gap-2">
            <SectionHeading variant="overline">{style.name}</SectionHeading>
            <div className="flex flex-wrap gap-2">
              {RHYTHMS.filter((rhythm) => rhythm.style === style.id).map((rhythm) => (
                <ToggleChip
                  key={rhythm.id}
                  selected={rhythm.id === rhythmId}
                  onClick={() => onSelectRhythm(rhythm.id)}
                  size="sm"
                >
                  {`${rhythm.name} · ${rhythm.meter}`}
                </ToggleChip>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Keyed, so that changing rhythm starts a new panel and stops the old one playing. */}
      <RhythmPanel key={shown.id} rhythm={shown} />
    </div>
  );
}
