import { act, renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { accumulateSession, EMPTY_SESSION, useSessionStats } from './useSessionStats';
import type { RoundResult } from '../logic/rules';
import type { Hand } from '../types';

function roundResult(index: number, outcome: RoundResult['result'], payout: number): RoundResult {
  return { playerHandIndex: index, result: outcome, payout };
}

describe('accumulateSession', () => {
  it('accumulates a single win', () => {
    const next = accumulateSession(EMPTY_SESSION, [roundResult(0, 'win', 1)], [100]);
    expect(next.rounds).toBe(1);
    expect(next.wins).toBe(1);
    expect(next.winRate).toBe(100);
    expect(next.bestWin).toBe(100);
    expect(next.streak).toBe(1);
  });

  it('tracks blackjack profit at 3:2', () => {
    const next = accumulateSession(EMPTY_SESSION, [roundResult(0, 'blackjack', 1.5)], [100]);
    expect(next.bestWin).toBe(150);
  });

  it('accumulates a loss with a negative streak', () => {
    const next = accumulateSession(EMPTY_SESSION, [roundResult(0, 'lose', 0)], [100]);
    expect(next.losses).toBe(1);
    expect(next.streak).toBe(-1);
  });

  it('resets the streak on a push', () => {
    const winning = accumulateSession(EMPTY_SESSION, [roundResult(0, 'win', 1)], [100]);
    const pushed = accumulateSession(winning, [roundResult(0, 'push', 0)], [100]);
    expect(pushed.rounds).toBe(2);
    expect(pushed.pushes).toBe(1);
    expect(pushed.streak).toBe(0);
    expect(pushed.winRate).toBe(50);
  });

  it('sums profit across split hands', () => {
    const next = accumulateSession(
      EMPTY_SESSION,
      [roundResult(0, 'win', 1), roundResult(1, 'win', 1)],
      [50, 50],
    );
    expect(next.wins).toBe(2);
    expect(next.bestWin).toBe(100);
  });
});

describe('useSessionStats', () => {
  it('stays empty without results and counts each distinct result set once', () => {
    const hands: Hand[] = [
      { cards: [], bet: 100, isDoubled: false, isStanding: true, isBusted: false, isBlackjack: false },
    ];

    const { result, rerender } = renderHook(
      ({ roundResults }: { roundResults: RoundResult[] | null }) =>
        useSessionStats(roundResults, hands),
      { initialProps: { roundResults: null as RoundResult[] | null } },
    );

    expect(result.current).toEqual(EMPTY_SESSION);

    const first = [roundResult(0, 'win', 1)];
    act(() => rerender({ roundResults: first }));
    expect(result.current.rounds).toBe(1);

    // Ugyanaz a referencia → nem számol újra.
    act(() => rerender({ roundResults: first }));
    expect(result.current.rounds).toBe(1);

    const second = [roundResult(0, 'lose', 0)];
    act(() => rerender({ roundResults: second }));
    expect(result.current.rounds).toBe(2);
    expect(result.current.streak).toBe(-1);
  });
});
