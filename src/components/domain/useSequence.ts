import { useEffect, useRef, useState } from 'react';
import { type Playback, playSequence } from '@/lib/audio';
import type { Chord } from '@/lib/music';
import { voiceChord } from '@/lib/music';

/**
 * Playing a list of chords in time, and knowing which one is sounding.
 *
 * Two panels can be open at once and each owns its own playback, so stopping is per-panel rather
 * than global; the effect is only there to make sure a panel that disappears takes its sound with
 * it.
 *
 * `beatMs` is how long each chord is held. Left out, it is the app's ordinary pace — the chord map
 * passes its own, because a song there has a tempo and a chord length the writer chose.
 */
export function useSequence(
  chords: Chord[],
  { beatMs }: { beatMs?: number } = {},
): { playing: boolean; step: number | null; toggle: () => void } {
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
    playback.current = playSequence(
      chords.map((chord) => voiceChord(chord.notes)),
      {
        // Spread rather than passed: under `exactOptionalPropertyTypes` an explicit `undefined` is
        // not the same as an absent key, and `playSequence` owns the default.
        ...(beatMs === undefined ? {} : { beatMs }),
        onStep: (index) => {
          setStep(index);
          if (index === null) playback.current = undefined;
        },
      },
    );
  };

  return { playing: step !== null, step, toggle };
}
