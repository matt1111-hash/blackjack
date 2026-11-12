import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { getSoundManager, type SoundType } from './soundManager';
import { isMuted as readMuted, subscribeMuted } from './muteStore';

export type { SoundType } from './soundManager';
export { getSoundManager } from './soundManager';

interface LoadState {
  isLoading: boolean;
  soundsLoaded: Set<SoundType>;
}

/**
 * Hang-hook: play/preload/mute/volume a singleton manageren keresztül.
 * Az isMuted a közös muteStore-ból jön (Q-01): minden példány ugyanazt látja,
 * így a fejléc némítása az osztó hangját is elnémítja.
 */
export function useSound() {
  const [state, setState] = useState<LoadState>({
    isLoading: false,
    soundsLoaded: new Set(),
  });
  const isMuted = useSyncExternalStore(subscribeMuted, readMuted, readMuted);

  const [manager] = useState(() => () => getSoundManager());

  const play = useCallback(
    (type: SoundType) => {
      manager().play(type);
    },
    [manager],
  );

  const preload = useCallback(
    async (types?: SoundType[]) => {
      setState((prev) => ({ ...prev, isLoading: true }));
      await manager().preload(types);
      setState((prev) => ({ ...prev, isLoading: false }));
    },
    [manager],
  );

  const mute = useCallback(() => {
    manager().mute();
  }, [manager]);

  const unmute = useCallback(() => {
    manager().unmute();
  }, [manager]);

  const toggleMute = useCallback(() => {
    if (readMuted()) {
      unmute();
    } else {
      mute();
    }
  }, [mute, unmute]);

  const setVolume = useCallback(
    (volume: number) => {
      manager().setVolume(volume);
    },
    [manager],
  );

  // Preload idle-időben, első interakcióra esve
  useEffect(() => {
    const preloadSounds = () => {
      preload();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (
        window as unknown as {
          requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number;
        }
      ).requestIdleCallback(preloadSounds, { timeout: 3000 });
      return () => {
        (window as unknown as { cancelIdleCallback: (id: number) => void }).cancelIdleCallback(idleId);
      };
    }

    const handleFirstInteraction = () => {
      preloadSounds();
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [preload]);

  return {
    ...state,
    isMuted,
    play,
    preload,
    mute,
    unmute,
    toggleMute,
    setVolume,
  };
}
