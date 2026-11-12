import { useCallback, useState } from 'react';

/** Osztási tempó: élő (valós kaszinó-ütem) vagy gyors (rutin körökhöz). */
export type TableSpeed = 'live' | 'fast';

const SPEED_STORAGE_KEY = 'blackjack:speed';

/** A koreográfia-szorzó tempónként (1 = élő ütem). */
export const SPEED_FACTOR: Record<TableSpeed, number> = {
  live: 1,
  fast: 0.45,
};

function readSpeed(): TableSpeed {
  try {
    return window.localStorage.getItem(SPEED_STORAGE_KEY) === 'fast' ? 'fast' : 'live';
  } catch {
    return 'live';
  }
}

/** Perzisztens tempó-beállítás a koreográfiához. */
export function useTableSpeed() {
  const [speed, setSpeed] = useState<TableSpeed>(readSpeed);

  const toggle = useCallback(() => {
    setSpeed((prev) => {
      const next: TableSpeed = prev === 'live' ? 'fast' : 'live';
      try {
        window.localStorage.setItem(SPEED_STORAGE_KEY, next);
      } catch {
        // tiltott storage — a session-en belül így is működik
      }
      return next;
    });
  }, []);

  return { speed, factor: SPEED_FACTOR[speed], toggle };
}
