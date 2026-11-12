/** Asztali kézjelek: koppintás = lapkérés (dupla koppintás), söprés = megállás. */
export type TableGesture = 'hit' | 'stand' | null;

export interface PointerSample {
  x: number;
  y: number;
  time: number;
}

/** Vízszintes söprés minimális hossza (px) — a valódi „waving off” mozdulat. */
export const SWIPE_MIN_DX = 70;
/** Söprésnél megengedett függőleges eltérés (px). */
export const SWIPE_MAX_DY = 45;
/** Koppintás: legfeljebb ennyi elmozdulás (px) és idő (ms). */
export const TAP_MAX_MOVE = 12;
export const TAP_MAX_MS = 260;
/** Dupla koppintás ablaka (ms) — a valódi „tap the felt” jel. */
export const DOUBLE_TAP_MS = 320;

export interface GestureResult {
  gesture: TableGesture;
  /** Az utolsó egyszeres koppintás ideje (a következő hívás bemenete). */
  lastTapTime: number | null;
}

/**
 * Egy pointer-lenyomás → felengedés pár osztályozása. Tiszta függvény:
 * a dupla koppintáshoz az előző koppintás idejét kapja és adja vissza.
 */
export function classifyGesture(
  start: PointerSample,
  end: PointerSample,
  lastTapTime: number | null,
): GestureResult {
  const dx = end.x - start.x;
  const dy = end.y - start.y;
  const duration = end.time - start.time;

  if (Math.abs(dx) >= SWIPE_MIN_DX && Math.abs(dy) <= SWIPE_MAX_DY) {
    return { gesture: 'stand', lastTapTime: null };
  }

  const isTap = Math.hypot(dx, dy) <= TAP_MAX_MOVE && duration <= TAP_MAX_MS;
  if (!isTap) return { gesture: null, lastTapTime: null };

  if (lastTapTime !== null && end.time - lastTapTime <= DOUBLE_TAP_MS) {
    return { gesture: 'hit', lastTapTime: null };
  }
  return { gesture: null, lastTapTime: end.time };
}
