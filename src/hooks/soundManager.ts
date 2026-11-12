import { Howl, Howler } from 'howler';
import {
  RoundRobinPool,
  variation,
  clampVolume,
  ambienceLevel,
  duckedLevel,
  AMBIENCE_DUCK_MS,
  SOUND_POOL_SIZE,
  SOUND_RATE_SPREAD,
  SOUND_VOLUME_SPREAD,
} from './soundPool';
import { isMuted, setMuted } from './muteStore';
import { ensureRoomReverb } from './roomReverb';

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

/** Ambience loop (folyamatos hangsáv) és a duckolást kiváltó hangok. */
const AMBIENCE_SRC = ['/sounds/ambience.ogg', '/sounds/ambience.mp3'];
const DUCKING_TYPES: ReadonlySet<SoundType> = new Set(['win', 'lose', 'blackjack', 'chipWin']);

// ogg + mp3 fallback: WebKit/Safari nem játszik Ogg Vorbist (néma lenne mp3 nélkül).
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

export interface SoundManager {
  play: (type: SoundType) => void;
  preload: (types?: SoundType[]) => Promise<void>;
  mute: () => void;
  unmute: () => void;
  toggleMute: () => void;
  setVolume: (volume: number) => void;
  preloaded: boolean;
  destroy: () => void;
  /** Terem-háttérhang (loop) — a userLevel 0..1 skála. */
  startAmbience: () => void;
  stopAmbience: () => void;
  setAmbienceVolume: (userLevel: number) => void;
}

function createSoundManager(): SoundManager {
  const pools = new Map<SoundType, RoundRobinPool<Howl>>();
  const preloadedSet = new Set<SoundType>();
  // Mute: egyetlen közös forrás (muteStore) — a perzisztált értéket átvesszük.
  if (isMuted()) Howler.mute(true);
  let masterVolume = 0.7;
  let consecutiveFailures = 0;
  let circuitOpen = false;
  let ambienceHowl: Howl | null = null;
  let ambienceUserLevel = 0.5;
  let ambienceDuckTimer: ReturnType<typeof setTimeout> | null = null;
  // Teljes preload deduplikálása: futó preload mellett nem indul új (Howl-verseny).
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
        const pool = pools.get(type);
        if (pool) {
          const howl = pool.next();
          howl.once('unlock', () => howl.play());
        }
      },
    });

  /** Teljes pool felépítése egy típushoz (POOL_SIZE példány, párhuzamosan töltve). */
  const buildPool = (type: SoundType, first: Howl): RoundRobinPool<Howl> => {
    const instances: Howl[] = [first];
    for (let i = 1; i < SOUND_POOL_SIZE; i++) {
      instances.push(createHowl(type));
    }
    for (const howl of instances) {
      if (howl.state() === 'unloaded') howl.load();
    }
    return new RoundRobinPool(instances);
  };

  /** Attempt to load a single sound with timeout. Returns true on success. */
  const tryLoadOne = (type: SoundType): Promise<boolean> =>
    new Promise((resolve) => {
      if (circuitOpen) {
        resolve(false);
        return;
      }

      // Idempotens: ha már van betöltött pool, hagyjuk békén (race-mentesség).
      const existing = pools.get(type);
      const existingHowl = existing?.peekAll()[0];
      if (existingHowl && existingHowl.state() === 'loaded') {
        preloadedSet.add(type);
        resolve(true);
        return;
      }
      // Ha van, de még nem töltött (beragadt/loading): dobjuk és újratöltjük.
      if (existing) {
        for (const howl of existing.peekAll()) howl.unload();
        pools.delete(type);
      }

      const first = createHowl(type);

      let settled = false;
      const timer = setTimeout(() => {
        if (!settled) {
          settled = true;
          resolve(false);
        }
      }, LOAD_TIMEOUT_MS);

      first.once('load', () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          consecutiveFailures = 0;
          pools.set(type, buildPool(type, first));
          preloadedSet.add(type);
          resolve(true);
        }
      });

      first.once('loaderror', () => {
        if (!settled) {
          settled = true;
          clearTimeout(timer);
          resolve(false);
        }
      });

      first.load();
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
  const loadPool = (type: SoundType): RoundRobinPool<Howl> | null => {
    if (circuitOpen) return null;
    const existing = pools.get(type);
    if (existing) return existing;
    const pool = buildPool(type, createHowl(type));
    pools.set(type, pool);
    return pool;
  };

  /** Ambience: loop-oló Howl, halk alapszinten; fontos hangoknál duckol. */
  const ensureAmbience = (): Howl => {
    if (ambienceHowl) return ambienceHowl;
    ambienceHowl = new Howl({
      src: AMBIENCE_SRC,
      loop: true,
      volume: ambienceLevel(ambienceUserLevel),
      html5: true,
    });
    return ambienceHowl;
  };

  const duckAmbience = (): void => {
    const howl = ambienceHowl;
    if (!howl || !howl.playing()) return;
    const normal = ambienceLevel(ambienceUserLevel);
    howl.fade(normal, duckedLevel(ambienceUserLevel), 100);
    if (ambienceDuckTimer) clearTimeout(ambienceDuckTimer);
    ambienceDuckTimer = setTimeout(() => {
      ambienceHowl?.fade(duckedLevel(ambienceUserLevel), ambienceLevel(ambienceUserLevel), 200);
      ambienceDuckTimer = null;
    }, AMBIENCE_DUCK_MS);
  };

  return {
    play: (type: SoundType) => {
      if (isMuted()) return;
      const pool = loadPool(type);
      if (!pool) return;
      // D18: mindig megszólal — a pool példányai párhuzamosan játszhatnak.
      // D19: ±6% rate és ±10% volume → nem géppuska.
      const howl = pool.next();
      howl.rate(variation(SOUND_RATE_SPREAD));
      howl.volume(clampVolume(masterVolume * variation(SOUND_VOLUME_SPREAD)));
      howl.play();
      ensureRoomReverb(Howler);
      if (DUCKING_TYPES.has(type)) duckAmbience();
    },
    preload: async (types?: SoundType[]) => {
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
      setMuted(true);
      Howler.mute(true);
    },
    unmute: () => {
      setMuted(false);
      Howler.mute(false);
    },
    toggleMute: () => {
      setMuted(!isMuted());
      Howler.mute(isMuted());
    },
    setVolume: (volume: number) => {
      masterVolume = clampVolume(volume);
      Howler.volume(masterVolume);
    },
    preloaded: preloadedSet.size > 0,
    startAmbience: () => {
      if (isMuted()) return;
      const howl = ensureAmbience();
      if (!howl.playing()) {
        howl.volume(ambienceLevel(ambienceUserLevel));
        howl.play();
      }
    },
    stopAmbience: () => {
      if (!ambienceHowl) return;
      const howl = ambienceHowl;
      howl.fade(howl.volume() as number, 0, 250);
      window.setTimeout(() => howl.stop(), 260);
    },
    setAmbienceVolume: (userLevel: number) => {
      ambienceUserLevel = clampVolume(userLevel);
      ambienceHowl?.volume(ambienceLevel(ambienceUserLevel));
    },
    destroy: () => {
      if (ambienceDuckTimer) clearTimeout(ambienceDuckTimer);
      ambienceHowl?.unload();
      ambienceHowl = null;
      pools.forEach((pool) => {
        for (const howl of pool.peekAll()) howl.unload();
      });
      pools.clear();
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
