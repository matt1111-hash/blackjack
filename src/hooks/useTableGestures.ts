import { useCallback, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { classifyGesture, type PointerSample } from '../logic/gestures';

export interface TableGestureOptions {
  enabled: boolean;
  onHit: () => void;
  onStand: () => void;
}

/** Interaktív elemen (gomb, csúszka) induló mozdulat nem asztali jel. */
function startsOnControl(target: EventTarget | null): boolean {
  return target instanceof Element && target.closest('button, input, a, [role="dialog"]') !== null;
}

/**
 * Valódi asztali kézjelek érintőképernyőn: dupla koppintás a filcen = HIT,
 * vízszintes söprés = STAND (mint az élő asztalnál). Egérrel nem aktív —
 * asztali gépen a véletlen dupla kattintás nem kérhet lapot. Rövid rezgéssel nyugtáz.
 */
export function useTableGestures({ enabled, onHit, onStand }: TableGestureOptions) {
  const startRef = useRef<PointerSample | null>(null);
  const lastTapRef = useRef<number | null>(null);

  const onPointerDown = useCallback(
    (event: ReactPointerEvent) => {
      if (!enabled || event.pointerType === 'mouse' || startsOnControl(event.target)) {
        startRef.current = null;
        return;
      }
      startRef.current = { x: event.clientX, y: event.clientY, time: event.timeStamp };
    },
    [enabled],
  );

  const onPointerUp = useCallback(
    (event: ReactPointerEvent) => {
      const start = startRef.current;
      startRef.current = null;
      if (!enabled || !start) return;

      const result = classifyGesture(
        start,
        { x: event.clientX, y: event.clientY, time: event.timeStamp },
        lastTapRef.current,
      );
      lastTapRef.current = result.lastTapTime;
      if (!result.gesture) return;

      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate(12);
      }
      if (result.gesture === 'hit') onHit();
      else onStand();
    },
    [enabled, onHit, onStand],
  );

  return { onPointerDown, onPointerUp };
}
