import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { Card, Hand, Rank } from '../types';
import { accuracyPct, COACH_FEEDBACK_MS, optimalFor, useStrategyCoach, type CoachSnapshot } from './useStrategyCoach';

const c = (rank: Rank): Card => ({ suit: 'clubs', rank, faceUp: true });

function hand(cards: Card[], extra: Partial<Hand> = {}): Hand {
  return { cards, bet: 100, isDoubled: false, isStanding: false, isBusted: false, isBlackjack: false, ...extra };
}

function snapshot(player: Card[], up: Rank, extra: Partial<CoachSnapshot> = {}): CoachSnapshot {
  return {
    phase: 'playing',
    playerHands: [hand(player)],
    activeHandIndex: 0,
    dealerHand: { cards: [c(up), c('9')] },
    balance: 5000,
    ...extra,
  };
}

describe('optimalFor', () => {
  it('returns the chart decision while playing', () => {
    expect(optimalFor(snapshot([c('10'), c('6')], '6'))).toBe('stand');
  });

  it('returns null outside the playing phase', () => {
    expect(optimalFor(snapshot([c('10'), c('6')], '6', { phase: 'finished' }))).toBeNull();
  });

  it('returns null for a finished hand', () => {
    const snap = snapshot([c('10'), c('6')], '6');
    snap.playerHands = [hand([c('10'), c('6')], { isStanding: true })];
    expect(optimalFor(snap)).toBeNull();
  });

  it('does not recommend a double the bankroll cannot cover', () => {
    expect(optimalFor(snapshot([c('6'), c('5')], '6', { balance: 50 }))).toBe('hit');
  });
});

describe('accuracyPct', () => {
  it('is 100 before any decision and rounds otherwise', () => {
    expect(accuracyPct({ decisions: 0, correct: 0 })).toBe(100);
    expect(accuracyPct({ decisions: 3, correct: 2 })).toBe(67);
  });
});

describe('useStrategyCoach', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('counts a correct decision silently', () => {
    const { result } = renderHook(() => useStrategyCoach(() => snapshot([c('10'), c('6')], '6')));

    act(() => result.current.record('stand'));

    expect(result.current.stats).toEqual({ decisions: 1, correct: 1 });
    expect(result.current.feedback).toBeNull();
  });

  it('flags a deviation and clears the flag after a while', () => {
    const { result } = renderHook(() => useStrategyCoach(() => snapshot([c('10'), c('6')], '6')));

    act(() => result.current.record('hit'));

    expect(result.current.accuracy).toBe(0);
    expect(result.current.feedback).toMatchObject({ played: 'hit', optimal: 'stand' });

    act(() => {
      vi.advanceTimersByTime(COACH_FEEDBACK_MS + 10);
    });
    expect(result.current.feedback).toBeNull();
  });

  it('ignores calls outside a decision point', () => {
    const { result } = renderHook(() =>
      useStrategyCoach(() => snapshot([c('10'), c('6')], '6', { phase: 'betting' })),
    );

    act(() => result.current.record('hit'));

    expect(result.current.stats.decisions).toBe(0);
  });

  it('keeps scoring but stays quiet when switched off, and persists the choice', () => {
    const { result } = renderHook(() => useStrategyCoach(() => snapshot([c('10'), c('6')], '6')));

    act(() => result.current.toggle());
    act(() => result.current.record('hit'));

    expect(result.current.enabled).toBe(false);
    expect(result.current.feedback).toBeNull();
    expect(result.current.stats.decisions).toBe(1);
    expect(window.localStorage.getItem('blackjack:coach')).toBe('off');

    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(true);
  });
});
