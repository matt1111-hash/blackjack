import { useCallback, useState } from 'react';
import { useSound, getSoundManager } from './useSound';

export function useVolume() {
  const [volume, setVolumeState] = useState(0.7);

  const setMasterVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    // Route through the singleton sound manager so masterVolume + Howler.volume
    // stay in sync (single write path — avoids stale-volume desync on play()).
    getSoundManager().setVolume(clamped);
  }, []);

  const increaseVolume = useCallback(() => {
    setMasterVolume(volume + 0.1);
  }, [volume, setMasterVolume]);

  const decreaseVolume = useCallback(() => {
    setMasterVolume(volume - 0.1);
  }, [volume, setMasterVolume]);

  return {
    volume,
    setVolume: setMasterVolume,
    increaseVolume,
    decreaseVolume,
  };
}

export function useGameSounds() {
  const { play, isMuted, toggleMute } = useSound();

  const sounds = {
    playCardPlace: () => play('cardPlace'),
    playCardSlide: () => play('cardSlide'),
    playChipDrop: () => play('chipDrop'),
    playChipStack: () => play('chipStack'),
    playChipWin: () => play('chipWin'),
    playWin: () => play('win'),
    playLose: () => play('lose'),
    playBlackjack: () => play('blackjack'),
    playDealStart: () => play('dealStart'),
    playButtonClick: () => play('buttonClick'),
  };

  return {
    ...sounds,
    isMuted,
    toggleMute,
  };
}
