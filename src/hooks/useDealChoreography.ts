import { useEffect, useRef, useState } from 'react';
import { DEAL_STAGGER_DELAY } from '../constants/animations';
import type { GamePhase } from '../types';

export type ChoreoTarget = 'player' | 'dealer';

export interface DealChoreography {
  player: number;
  dealer: number;
  done: boolean;
}

export interface DealChoreographyOptions {
  /** 0 = azonnali végállapot (reduced motion / unit teszt), derivált return-nel. */
  speed?: number;
  onCardDealt?: (target: ChoreoTarget) => void;
}

/**
 * A kezdő osztás lejátszási ütemterve: játékos → osztó → játékos → osztó(hátlap).
 * A store-tól kapott végállapotot lépteti időzítve — a domainhez nem nyúl (D9).
 *
 * Az időzítők szándékosan cleanup nélküliek, sorszám-védelemmel: StrictMode
 * dupla effektje mellett is pontosan egy ütemterv fut le, unmount után pedig
 * a setState legfeljebb no-op.
 */
export function useDealChoreography(
  phase: GamePhase,
  playerCount: number,
  dealerCount: number,
  { speed = 1, onCardDealt }: DealChoreographyOptions = {},
): DealChoreography {
  const immediate = speed <= 0;
  const [state, setState] = useState<DealChoreography>({
    player: playerCount,
    dealer: dealerCount,
    done: true,
  });

  const prevPhaseRef = useRef<GamePhase>(phase);
  const sequenceIdRef = useRef(0);
  const onCardDealtRef = useRef(onCardDealt);

  useEffect(() => {
    onCardDealtRef.current = onCardDealt;
  }, [onCardDealt]);

  useEffect(() => {
    // Azonnali mód: a hívó a végállapotot kapja — nincs mit időzíteni.
    if (immediate) return;

    const isNewDeal = prevPhaseRef.current === 'betting' && phase !== 'betting';
    prevPhaseRef.current = phase;

    if (!isNewDeal) {
      // Biztonsági konvergencia: soha ne ragadjon félkész ütemterv.
      window.setTimeout(() => {
        setState((s) => (s.done ? s : { player: s.player, dealer: s.dealer, done: true }));
      }, 0);
      return;
    }

    const sequenceId = ++sequenceIdRef.current;
    const stepMs = DEAL_STAGGER_DELAY * 1000 * speed;

    window.setTimeout(() => {
      if (sequenceIdRef.current !== sequenceId) return;
      setState({ player: 0, dealer: 0, done: false });
    }, 0);

    const rounds = Math.max(playerCount, dealerCount);
    for (let round = 0; round < rounds; round++) {
      if (round < playerCount) {
        window.setTimeout(() => {
          if (sequenceIdRef.current !== sequenceId) return;
          setState((s) => ({ ...s, player: s.player + 1 }));
          onCardDealtRef.current?.('player');
        }, (round * 2 + 1) * stepMs);
      }
      if (round < dealerCount) {
        window.setTimeout(() => {
          if (sequenceIdRef.current !== sequenceId) return;
          setState((s) => ({ ...s, dealer: s.dealer + 1 }));
          onCardDealtRef.current?.('dealer');
        }, (round * 2 + 2) * stepMs);
      }
    }

    window.setTimeout(() => {
      if (sequenceIdRef.current !== sequenceId) return;
      setState({ player: playerCount, dealer: dealerCount, done: true });
    }, (rounds * 2 + 1) * stepMs);
    // Időzítők tudatosan cleanup nélkül — lásd a hook docstringjét.
  }, [phase, playerCount, dealerCount, speed, immediate]);

  return immediate ? { player: playerCount, dealer: dealerCount, done: true } : state;
}
