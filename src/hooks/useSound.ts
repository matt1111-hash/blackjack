import { useCallback, useEffect, useState } from 'react';
import { Howl, Howler } from 'howler';

export type SoundType =
  | 'cardPlace'
  | 'cardSlide'
  | 'chipDrop'
  | 'chipStack'
  | 'chipWin'
  | 'win'
  | 'lose'
  | 'blackjack'
  | 'dealStart'
  | 'buttonClick';

// Sound configuration
const SOUND_CONFIG: Record<SoundType, string> = {
  cardPlace: '/sounds/card-place.ogg',
  cardSlide: '/sounds/card-slide.ogg',
  chipDrop: '/sounds/chip-drop.ogg',
  chipStack: '/sounds/chip-stack.ogg',
  chipWin: '/sounds/chip-win.ogg',
  win: '/sounds/win.ogg',
  lose: '/sounds/lose.ogg',
  blackjack: '/sounds/blackjack.ogg',
  dealStart: '/sounds/deal-start.ogg',
  buttonClick: '/sounds/button-click.ogg',
};

interface SoundState {
  isLoading: boolean;
  isMuted: boolean;
  soundsLoaded: Set<SoundType>;
}

interface SoundManager {
  play: (type: SoundType) => void;
  preload: (types?: SoundType[]) => Promise<void>;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  preloaded: boolean;
}

function createSoundManager(): SoundManager {
  const sounds = new Map<SoundType, Howl>();
  const preloadedSet = new Set<SoundType>();
  let isMuted = false;
  let masterVolume = 0.7;

  const loadSound = (type: SoundType): Howl | null => {
    if (sounds.has(type)) {
      return sounds.get(type)!;
    }

    const src = SOUND_CONFIG[type];
    const sound = new Howl({
      src: [src],
      volume: masterVolume,
      preload: true,
      html5: false,
      onloaderror: (_id, error) => {
        console.warn(`Failed to load sound: ${type}`, error);
      },
      onplayerror: () => {
        sound.once('unlock', () => {
          sound.play();
        });
      },
    });

    sounds.set(type, sound);
    return sound;
  };

  return {
    play: (type: SoundType) => {
      if (isMuted) return;

      const sound = loadSound(type);
      if (sound) {
        sound.volume(masterVolume);
        if (!sound.playing()) {
          sound.play();
        }
      }
    },
    preload: async (types?: SoundType[]) => {
      const toLoad = types || (Object.keys(SOUND_CONFIG) as SoundType[]);
      const promises = toLoad.map(async (type) => {
        const sound = loadSound(type);
        if (sound) {
          try {
            await new Promise<void>((resolve, reject) => {
              sound.once('load', resolve);
              sound.once('error', reject);
              sound.load();
            });
            preloadedSet.add(type);
          } catch {
            // Sound file not found, that's OK
          }
        }
      });
      await Promise.all(promises);
    },
    mute: () => {
      isMuted = true;
      Howler.mute(true);
    },
    unmute: () => {
      isMuted = false;
      Howler.mute(false);
    },
    toggleMute: () => {
      if (isMuted) {
        isMuted = false;
        Howler.mute(false);
      } else {
        isMuted = true;
        Howler.mute(true);
      }
    },
    setVolume: (volume: number) => {
      masterVolume = Math.max(0, Math.min(1, volume));
      Howler.volume(masterVolume);
    },
    preloaded: preloadedSet.size > 0,
  };
}

// Singleton sound manager
let soundManager: SoundManager | null = null;

function getSoundManager(): SoundManager {
  if (!soundManager) {
    soundManager = createSoundManager();
  }
  return soundManager;
}

export function useSound() {
  const [state, setState] = useState<SoundState>({
    isLoading: false,
    isMuted: false,
    soundsLoaded: new Set(),
  });

  const [manager] = useState(() => () => getSoundManager());

  const play = useCallback((type: SoundType) => {
    manager().play(type);
  }, [manager]);

  const preload = useCallback(async (types?: SoundType[]) => {
    setState((prev) => ({ ...prev, isLoading: true }));
    await manager().preload(types);
    setState((prev) => ({ ...prev, isLoading: false }));
  }, [manager]);

  const mute = useCallback(() => {
    manager().mute();
    setState((prev) => ({ ...prev, isMuted: true }));
  }, [manager]);

  const unmute = useCallback(() => {
    manager().unmute();
    setState((prev) => ({ ...prev, isMuted: false }));
  }, [manager]);

  const toggleMute = useCallback(() => {
    if (state.isMuted) {
      unmute();
    } else {
      mute();
    }
  }, [state.isMuted, mute, unmute]);

  const setVolume = useCallback((volume: number) => {
    manager().setVolume(volume);
  }, [manager]);

  // Preload sounds on first user interaction
  useEffect(() => {
    const handleFirstInteraction = () => {
      preload();
      document.removeEventListener('click', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    return () => document.removeEventListener('click', handleFirstInteraction);
  }, [preload]);

  return {
    ...state,
    play,
    preload,
    mute,
    unmute,
    toggleMute,
    setVolume,
  };
}

// Volume control hook
export function useVolume() {
  const [volume, setVolumeState] = useState(0.7);

  const setMasterVolume = useCallback((v: number) => {
    const clamped = Math.max(0, Math.min(1, v));
    setVolumeState(clamped);
    Howler.volume(clamped);
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

// Sound context for the game
export function useGameSounds() {
  const { play, isMuted, toggleMute } = useSound();

  // Play sounds for game events
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
