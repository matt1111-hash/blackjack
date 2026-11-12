import { useEffect, useRef } from 'react';
import type { ChipValue, GamePhase } from '../types';

export interface KeyboardShortcutConfig {
  enabled: boolean;
  phase: GamePhase;
  canDouble: boolean;
  canSplit: boolean;
  canDeal: boolean;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onDeal: () => void;
  onNewRound: () => void;
  onChip: (value: ChipValue) => void;
  /** Tét törlése (CLEAR) a betting fázisban — C billentyű. */
  onClearBet?: () => void;
  chipValues?: readonly ChipValue[];
}

const CHIP_KEYS: Record<string, number> = { '1': 0, '2': 1, '3': 2, '4': 3 };
const BLOCKED_TAGS = new Set(['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON']);

/** Billentyű-parancsok: H/S/D/P, Space = deal/új kör, 1–4 = zseton (Fázis 7). */
export function useKeyboardShortcuts(config: KeyboardShortcutConfig): void {
  const configRef = useRef(config);

  useEffect(() => {
    configRef.current = config;
  }, [config]);

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;

      const target = event.target as HTMLElement | null;
      if (target && BLOCKED_TAGS.has(target.tagName)) return;

      const cfg = configRef.current;
      const key = event.key.toLowerCase();

      if (key === ' ') {
        if (!cfg.enabled) return;
        if (cfg.phase === 'betting' && cfg.canDeal) {
          event.preventDefault();
          cfg.onDeal();
        } else if (cfg.phase === 'finished') {
          event.preventDefault();
          cfg.onNewRound();
        }
        return;
      }

      if (key in CHIP_KEYS) {
        if (!cfg.enabled || cfg.phase !== 'betting') return;
        const values = cfg.chipValues ?? [];
        const chip = values[CHIP_KEYS[key] ?? -1];
        if (chip !== undefined) cfg.onChip(chip);
        return;
      }

      if (key === 'c') {
        if (cfg.enabled && cfg.phase === 'betting') cfg.onClearBet?.();
        return;
      }

      if (!cfg.enabled || cfg.phase !== 'playing') return;

      switch (key) {
        case 'h':
          cfg.onHit();
          break;
        case 's':
          cfg.onStand();
          break;
        case 'd':
          if (cfg.canDouble) cfg.onDouble();
          break;
        case 'p':
          if (cfg.canSplit) cfg.onSplit();
          break;
        default:
          break;
      }
    };

    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);
}
