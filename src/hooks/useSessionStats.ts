import { useEffect, useRef, useState } from 'react';
import type { RoundResult } from '../logic/rules';
import type { Hand } from '../types';

export interface SessionSummary {
  rounds: number;
  wins: number;
  losses: number;
  pushes: number;
  winRate: number;
  bestWin: number;
  /** Nyerési sor: pozitív = nyerés, negatív = vesztés. */
  streak: number;
}

export const EMPTY_SESSION: SessionSummary = {
  rounds: 0,
  wins: 0,
  losses: 0,
  pushes: 0,
  winRate: 0,
  bestWin: 0,
  streak: 0,
};

/** Egy kör eredményeiből új session-összesítő — tiszta függvény. */
export function accumulateSession(
  prev: SessionSummary,
  results: RoundResult[],
  bets: number[],
): SessionSummary {
  let wins = 0;
  let losses = 0;
  let pushes = 0;
  let roundProfit = 0;

  for (const result of results) {
    if (result.result === 'win' || result.result === 'blackjack') {
      wins++;
      roundProfit += Math.floor(bets[result.playerHandIndex] * result.payout);
    } else if (result.result === 'push') {
      pushes++;
    } else {
      losses++;
    }
  }

  const rounds = prev.rounds + 1;
  const streak =
    wins > 0 && losses === 0
      ? prev.streak > 0
        ? prev.streak + 1
        : 1
      : losses > 0 && wins === 0
        ? prev.streak < 0
          ? prev.streak - 1
          : -1
        : 0;

  return {
    rounds,
    wins: prev.wins + wins,
    losses: prev.losses + losses,
    pushes: prev.pushes + pushes,
    winRate: Math.round(((prev.wins + wins) / rounds) * 100),
    bestWin: Math.max(prev.bestWin, roundProfit),
    streak,
  };
}

/** Session-statisztika a lejátszott körökből — az ülésben-lét érzete (Fázis 7). */
export function useSessionStats(roundResults: RoundResult[] | null, hands: Hand[]): SessionSummary {
  const [summary, setSummary] = useState<SessionSummary>(EMPTY_SESSION);
  const prevResultsRef = useRef<RoundResult[] | null>(null);
  const handsRef = useRef(hands);

  useEffect(() => {
    handsRef.current = hands;
  }, [hands]);

  useEffect(() => {
    if (!roundResults || roundResults === prevResultsRef.current) return;
    prevResultsRef.current = roundResults;
    setSummary((prev) => accumulateSession(prev, roundResults, handsRef.current.map((h) => h.bet)));
  }, [roundResults]);

  return summary;
}
