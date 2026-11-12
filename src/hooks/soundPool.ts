/**
 * Hang-példány körbeforgó pool (D18) — egy Howl-példány egyszerre csak egy
 * hangot képes lejátszani; a pool teszi lehetővé az egyidejű megszólalásokat
 * (pl. 4 gyors kártyaletétel → 4 hallható card-place).
 */
export class RoundRobinPool<T> {
  private readonly items: T[];
  private cursor = 0;

  constructor(items: readonly T[]) {
    if (items.length === 0) {
      throw new Error('RoundRobinPool requires at least one item');
    }
    this.items = [...items];
  }

  get size(): number {
    return this.items.length;
  }

  /** Következő példány — körbeforgó kiosztás. */
  next(): T {
    const item = this.items[this.cursor] as T;
    this.cursor = (this.cursor + 1) % this.items.length;
    return item;
  }

  /** Az összes példány (unload/destroyhoz). */
  peekAll(): readonly T[] {
    return this.items;
  }
}

/** Hangonkénti párhuzamos példányok száma. */
export const SOUND_POOL_SIZE = 3;

/** ±spread véletlen szorzó — hangvariáció, hogy ne „géppuska” legyen (D19). */
export function variation(spread: number, random: () => number = Math.random): number {
  return 1 + (random() * 2 - 1) * spread;
}

/** Lejátszási sebesség véletlen szórása (±6%). */
export const SOUND_RATE_SPREAD = 0.06;

/** Hangerő véletlen szórása (±10%). */
export const SOUND_VOLUME_SPREAD = 0.1;

/** 0..1 közé szorítás. */
export function clampVolume(value: number): number {
  return Math.max(0, Math.min(1, value));
}

/** Ambience alapszint (0..1) — a terv szerint halk terem-háttér (~0.12). */
export const AMBIENCE_LEVEL = 0.12;

/** Fontos eseménynél az ambience ennyire halkul el (ducking). */
export const AMBIENCE_DUCK_FACTOR = 0.3;

/** A ducking hossza ezredmásodpercben. */
export const AMBIENCE_DUCK_MS = 300;

/** Az ambience aktuális, duckolt cél-szintje a felhasználói szintből. */
export function duckedLevel(userLevel: number): number {
  return clampVolume(userLevel * AMBIENCE_LEVEL * AMBIENCE_DUCK_FACTOR);
}

/** Az ambience normál cél-szintje a felhasználói szintből. */
export function ambienceLevel(userLevel: number): number {
  return clampVolume(userLevel * AMBIENCE_LEVEL);
}
