import { useCallback, useEffect, useRef, useState } from 'react';
import { canPlayerDouble, canPlayerSplit } from '../logic/rules';
import { recommendDecision, type PlayerDecision } from '../logic/strategy';
import type { Card, Hand } from '../types';

const COACH_STORAGE_KEY = 'blackjack:coach';
/** Ennyi ideig látszik egy eltérés-jelzés (ms). */
export const COACH_FEEDBACK_MS = 2600;

export interface CoachSnapshot {
  phase: string;
  playerHands: Hand[];
  activeHandIndex: number;
  dealerHand: { cards: Card[] };
  balance: number;
}

export interface CoachFeedback {
  played: PlayerDecision;
  optimal: PlayerDecision;
  /** Egyedi kulcs — azonos tartalmú egymás utáni hibák is újra animálnak. */
  id: number;
}

export interface CoachStats {
  decisions: number;
  correct: number;
}

/** A pillanatnyi asztal-állapotra a basic strategy ajánlása (null, ha nincs döntési helyzet). */
export function optimalFor(snapshot: CoachSnapshot): PlayerDecision | null {
  if (snapshot.phase !== 'playing') return null;
  const hand = snapshot.playerHands[snapshot.activeHandIndex];
  const upcard = snapshot.dealerHand.cards[0];
  if (!hand || !upcard || hand.isStanding || hand.isBusted) return null;
  return recommendDecision(hand.cards, upcard, {
    canDouble: canPlayerDouble(hand, snapshot.balance),
    canSplit: snapshot.playerHands.length === 1 && canPlayerSplit(hand, snapshot.balance),
  });
}

/** Pontosság százalékban (döntés nélkül 100). */
export function accuracyPct(stats: CoachStats): number {
  if (stats.decisions === 0) return 100;
  return Math.round((stats.correct / stats.decisions) * 100);
}

function readEnabled(): boolean {
  try {
    return window.localStorage.getItem(COACH_STORAGE_KEY) !== 'off';
  } catch {
    return true;
  }
}

/**
 * Stratégia-edző: minden döntést a basic strategy-hez mér, session-pontosságot
 * vezet, és eltérésnél rövid, nem tolakodó jelzést ad („Basic strategy: STAND”).
 * A döntés előtti állapotot a hívó adja át (getSnapshot), így a store-hoz nem kötött.
 */
export function useStrategyCoach(getSnapshot: () => CoachSnapshot) {
  const [enabled, setEnabled] = useState(readEnabled);
  const [stats, setStats] = useState<CoachStats>({ decisions: 0, correct: 0 });
  const [feedback, setFeedback] = useState<CoachFeedback | null>(null);
  const counterRef = useRef(0);

  useEffect(() => {
    if (!feedback) return;
    const timer = window.setTimeout(() => setFeedback(null), COACH_FEEDBACK_MS);
    return () => window.clearTimeout(timer);
  }, [feedback]);

  const record = useCallback(
    (played: PlayerDecision) => {
      const optimal = optimalFor(getSnapshot());
      if (!optimal) return;
      const correct = optimal === played;
      setStats((prev) => ({ decisions: prev.decisions + 1, correct: prev.correct + (correct ? 1 : 0) }));
      if (!correct && enabled) {
        counterRef.current += 1;
        setFeedback({ played, optimal, id: counterRef.current });
      }
    },
    [getSnapshot, enabled],
  );

  const toggle = useCallback(() => {
    setEnabled((prev) => {
      try {
        window.localStorage.setItem(COACH_STORAGE_KEY, prev ? 'off' : 'on');
      } catch {
        // tiltott storage — a session-en belül így is működik
      }
      if (prev) setFeedback(null);
      return !prev;
    });
  }, []);

  return { enabled, stats, accuracy: accuracyPct(stats), feedback: enabled ? feedback : null, record, toggle };
}
