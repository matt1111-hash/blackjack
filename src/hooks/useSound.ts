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

// Minden hanghoz két formátum: ogg (jobb tömörítés, kisebb fájl) + mp3 fallback.
// Howler az ELSŐ támogatott kódeket választja a listából. WebKit/Safari/iOS nem
// támogatja az Ogg Vorbist — ha csak ogg lenne megadva, ott minden hang csendesen
// elbukna (loaderror -> circuit breaker, vagy egyszerűen nem játszható src) és a
// játék néma maradna. Az mp3 univerzálisan támogatott, így Safari is kap hangot.
const SOUND_CONFIG: Record<SoundType, string[]> = {
  cardPlace: ['/sounds/card-place.ogg', '/sounds/card-place.mp3'],
  cardSlide: ['/sounds/card-slide.ogg', '/sounds/card-slide.mp3'],
  chipDrop: ['/sounds/chip-drop.ogg', '/sounds/chip-drop.mp3'],
  chipStack: ['/sounds/chip-stack.ogg', '/sounds/chip-stack.mp3'],
  chipWin: ['/sounds/chip-win.ogg', '/sounds/chip-win.mp3'],
  win: ['/sounds/win.ogg', '/sounds/win.mp3'],
  lose: ['/sounds/lose.ogg', '/sounds/lose.mp3'],
  blackjack: ['/sounds/blackjack.ogg', '/sounds/blackjack.mp3'],
  dealStart: ['/sounds/deal-start.ogg', '/sounds/deal-start.mp3'],
  buttonClick: ['/sounds/button-click.ogg', '/sounds/button-click.mp3'],
};

const MAX_RETRIES = 3;
const LOAD_TIMEOUT_MS = 5000;
const CIRCUIT_BREAKER_THRESHOLD = 5;

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
  destroy: () => void;
}

function createSoundManager(): SoundManager {
  const sounds = new Map<SoundType, Howl>();
  const preloadedSet = new Set<SoundType>();
  let isMuted = false;
  let masterVolume = 0.7;
  let consecutiveFailures = 0;
  let circuitOpen = false;
  // Deduplikálja a teljes (types=undefined) preloadot: a useSound hook többször
  // is meghívhatja. Ha már fut, újra nem indítjuk (Howl-példányok versenye elkerül).
  let preloadingPromise: Promise<void> | null = null;

  const createHowl = (type: SoundType): Howl =>
    new Howl({
      src: SOUND_CONFIG[type],
      volume: masterVolume,
      preload: false,
      html5: false,
      onloaderror: () => {
        consecutiveFailures++;
        if (consecutiveFailures >= CIRCUIT_BREAKER_THRESHOLD) {
          circuitOpen = true;
        }
      },
      onplayerror: () => {
        const s = sounds.get(type);
        if (s) s.once('unlock', () => s.play());
      },
    });

  /** Attempt to load a single sound with timeout. Returns true on success. */
  const tryLoadOne = (type: SoundType): Promise<boolean> =>
    new Promise((resolve) => {
      if (circuitOpen) {
        resolve(false);
        return;
      }

      // Idempotens: ha már létezik ÉS betöltött Howl, hagyjuk békén.
      // A korábbi `existing.unload()` megölte a play() által épp használt hangot,
      // amikor a preload (mely a useSound hook miatt többször is lefuthat) és a
      // play() versenyeztek — ez termelt "hol van hang, hol nincs" fluktuációt.
      const existing = sounds.get(type);
      if (existing && existing.state() === 'loaded') {
        preloadedSet.add(type);
        resolve(true);
        return;
      }
      // Ha van, de még nem töltött (beragadt/loading): dobjuk és újratöltjük.
      if (existing) {
        existing.unload();
        sounds.delete(type);
      }

      const sound = createHowl(type);
      sounds.set(type, sound);

      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, LOAD_TIMEOUT_MS);

      sound.once('load', () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          consecutiveFailures = 0;
          preloadedSet.add(type);
          resolve(true);
        }
      });

      sound.once('loaderror', () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(false);
        }
      });

      sound.load();
    });

  /** Retry wrapper: up to MAX_RETRIES attempts per sound. */
  const loadWithRetry = async (type: SoundType): Promise<boolean> => {
    for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
      if (circuitOpen) return false;
      if (await tryLoadOne(type)) return true;
    }
    return false;
  };

  /** Lazy-load for play(): fast path, no retry — game continues silently on failure. */
  const loadSound = (type: SoundType): Howl | null => {
    if (circuitOpen) return null;
    if (sounds.has(type)) return sounds.get(type)!;
    const sound = createHowl(type);
    sounds.set(type, sound);
    sound.load();
    return sound;
  };

  return {
    play: (type: SoundType) => {
      if (isMuted) return;
      const sound = loadSound(type);
      if (sound) {
        sound.volume(masterVolume);
        if (!sound.playing()) sound.play();
      }
    },
    preload: async (types?: SoundType[]) => {
      // Teljes (types=undefined) preload: deduplikálva — már futó példányt várunk.
      if (!types && preloadingPromise) {
        return preloadingPromise;
      }
      const run = async (): Promise<void> => {
        const toLoad = types || (Object.keys(SOUND_CONFIG) as SoundType[]);
        await Promise.all(toLoad.map(loadWithRetry));
      };
      if (!types) {
        preloadingPromise = run().finally(() => {
          preloadingPromise = null;
        });
        return preloadingPromise;
      }
      return run();
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
    destroy: () => {
      sounds.forEach((sound) => sound.unload());
      sounds.clear();
    },
  };
}

// Singleton sound manager
let soundManager: SoundManager | null = null;

export function getSoundManager(): SoundManager {
  if (!soundManager) {
    soundManager = createSoundManager();
    if (typeof window !== 'undefined') {
      window.addEventListener('beforeunload', () => {
        soundManager?.destroy();
        soundManager = null;
      });
    }
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

  // Preload sounds using idle time or first interaction fallback
  useEffect(() => {
    const preloadSounds = () => {
      preload();
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const idleId = (window as unknown as { requestIdleCallback: (cb: () => void, opts?: { timeout: number }) => number })
        .requestIdleCallback(preloadSounds, { timeout: 3000 });
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
    play,
    preload,
    mute,
    unmute,
    toggleMute,
    setVolume,
  };
}
