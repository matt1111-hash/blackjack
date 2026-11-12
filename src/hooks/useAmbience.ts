import { useCallback, useEffect, useState } from 'react';
import { getSoundManager } from './soundManager';

/**
 * Terem-háttérhang vezérlés: szint (0..1) és be/ki.
 * Közvetlenül a soundManager-en keresztül dolgozik (nem a soundHelpers-en),
 * így a komponens-tesztek soundHelpers-mockja mellett is ártalmatlan.
 * A Howl-hívások try/catch-ben futnak — jsdom környezetben csendesen no-op.
 */
export function useAmbience() {
  const [level, setLevelState] = useState(0.5);
  const [enabled, setEnabled] = useState(true);

  useEffect(() => {
    try {
      if (enabled) getSoundManager().startAmbience();
      else getSoundManager().stopAmbience();
    } catch {
      // Hang alrendszer nem elérhető (pl. jsdom) — a játék hangok nélkül megy tovább.
    }
  }, [enabled]);

  const setLevel = useCallback((value: number) => {
    const clamped = Math.max(0, Math.min(1, value));
    setLevelState(clamped);
    try {
      getSoundManager().setAmbienceVolume(clamped);
    } catch {
      // no-op jsdom alatt
    }
  }, []);

  const toggle = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return { level, enabled, setLevel, toggle };
}
