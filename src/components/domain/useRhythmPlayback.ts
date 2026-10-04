import { useEffect, useRef, useState } from 'react';
import { type Playback, playDrums } from '@/lib/audio';
import type { Rhythm } from '@/lib/rhythm';
import { barTicks, PHRASE_BARS, rhythmHits, stepsPerBar, stepTick, tickMs, VELOCITY } from '@/lib/rhythm';

/**
 * Playing a rhythm's four-bar phrase, and knowing which step of it is sounding.
 *
 * `useSequence`'s twin for drums: each panel owns its own playback, and one that disappears takes
 * its sound with it. It plays the phrase once rather than looping, so what you hear is exactly
 * what the download holds.
 *
 * `step` counts through the whole phrase; a panel showing one bar of it takes it modulo the
 * pattern's length.
 */
export function useRhythmPlayback(rhythm: Rhythm): { playing: boolean; step: number | null; toggle: () => void } {
  const [step, setStep] = useState<number | null>(null);
  const playback = useRef<Playback | undefined>(undefined);

  useEffect(() => {
    return () => playback.current?.stop();
  }, []);

  const stop = () => {
    playback.current?.stop();
    playback.current = undefined;
    setStep(null);
  };

  const toggle = () => {
    if (playback.current !== undefined) {
      stop();
      return;
    }
    const msPerTick = tickMs(rhythm);
    const steps = PHRASE_BARS * stepsPerBar(rhythm);
    playback.current = playDrums(
      rhythmHits(rhythm).map(({ instrument, tick, level }) => ({
        instrument,
        ms: tick * msPerTick,
        gain: VELOCITY[level] / VELOCITY.hit,
      })),
      {
        stepMs: Array.from({ length: steps }, (_, index) => stepTick(rhythm, index) * msPerTick),
        totalMs: PHRASE_BARS * barTicks(rhythm) * msPerTick,
        onStep: (index) => {
          setStep(index);
          if (index === null) playback.current = undefined;
        },
      },
    );
  };

  return { playing: step !== null, step, toggle };
}
