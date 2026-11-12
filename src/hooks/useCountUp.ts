import { useEffect, useRef, useState } from 'react';

/**
 * Animált szám-átvezetés (requestAnimationFrame, ease-out) — az egyenleg
 * felszámolása ugrás helyett (D12 / Fázis 3). durationMs <= 0 esetén azonnal.
 */
export function useCountUp(target: number, durationMs = 600): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  const frameRef = useRef<number | null>(null);
  const animate = durationMs > 0;

  useEffect(() => {
    if (!animate) return;
    const from = displayRef.current;
    if (from === target) return;

    let startedAt = 0;
    let cancelled = false;

    const step = (now: number) => {
      if (cancelled) return;
      if (startedAt === 0) startedAt = now;
      const t = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - t, 3);
      const next = Math.round(from + (target - from) * eased);
      displayRef.current = next;
      setDisplay(next);
      if (t < 1) {
        frameRef.current = requestAnimationFrame(step);
      }
    };

    frameRef.current = requestAnimationFrame(step);

    return () => {
      cancelled = true;
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, [target, durationMs, animate]);

  return animate ? display : target;
}
