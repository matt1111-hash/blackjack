import { useCallback, useState } from 'react';

// Placeholder for sound management
// In Phase 5, implement with Howler.js or use-sound

export type SoundType = 'cardPlace' | 'cardSlide' | 'chipDrop' | 'chipStack' | 'win' | 'lose' | 'blackjack';

interface SoundState {
  isLoading: boolean;
  isMuted: boolean;
}

export function useSound() {
  const [state, setState] = useState<SoundState>({
    isLoading: false,
    isMuted: false,
  });

  const playSound = useCallback((type: SoundType) => {
    if (state.isMuted) return;

    // Placeholder - in Phase 5, implement with actual audio
    console.log(`Playing sound: ${type}`);
  }, [state.isMuted]);

  const mute = useCallback(() => {
    setState((prev) => ({ ...prev, isMuted: true }));
  }, []);

  const unmute = useCallback(() => {
    setState((prev) => ({ ...prev, isMuted: false }));
  }, []);

  const toggleMute = useCallback(() => {
    setState((prev) => ({ ...prev, isMuted: !prev.isMuted }));
  }, []);

  const preload = useCallback(async () => {
    setState((prev) => ({ ...prev, isLoading: true }));
    // Placeholder - in Phase 5, load actual audio files
    await new Promise((resolve) => setTimeout(resolve, 100));
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  return {
    ...state,
    playSound,
    mute,
    unmute,
    toggleMute,
    preload,
  };
}

// Volume control hook
export function useVolume() {
  const [volume, setVolume] = useState(0.7);

  const setMasterVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolume(clamped);
  }, []);

  const increaseVolume = useCallback(() => {
    setVolume((v) => Math.min(1, v + 0.1));
  }, []);

  const decreaseVolume = useCallback(() => {
    setVolume((v) => Math.max(0, v - 0.1));
  }, []);

  return {
    volume,
    setVolume: setMasterVolume,
    increaseVolume,
    decreaseVolume,
  };
}
