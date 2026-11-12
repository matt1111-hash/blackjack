import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDealChoreography } from './useDealChoreography';
import type { GamePhase } from '../types';

interface Props {
  phase: GamePhase;
  playerCount: number;
  dealerCount: number;
  speed: number;
}

describe('useDealChoreography', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderChoreo(props: Props) {
    return renderHook(
      ({ phase, playerCount, dealerCount, speed }: Props) =>
        useDealChoreography(phase, playerCount, dealerCount, { speed }),
      { initialProps: props },
    );
  }

  it('returns the final state immediately when speed is 0', () => {
    const { result } = renderChoreo({ phase: 'betting', playerCount: 0, dealerCount: 0, speed: 0 });
    expect(result.current).toEqual({ player: 0, dealer: 0, done: true });
  });

  it('plays the initial deal in player → dealer order and converges', () => {
    const { result, rerender } = renderChoreo({
      phase: 'betting',
      playerCount: 0,
      dealerCount: 0,
      speed: 1,
    });

    rerender({ phase: 'playing', playerCount: 2, dealerCount: 2, speed: 1 });

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toEqual({ player: 0, dealer: 0, done: false });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current.player).toBe(1);
    expect(result.current.dealer).toBe(0);

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toEqual({ player: 1, dealer: 1, done: false });

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toEqual({ player: 2, dealer: 2, done: false });

    act(() => {
      vi.advanceTimersByTime(200);
    });
    expect(result.current).toEqual({ player: 2, dealer: 2, done: true });
  });

  it('calls onCardDealt once per card in sequence order', () => {
    const onCardDealt = vi.fn();
    const { rerender } = renderHook(
      ({ phase, playerCount, dealerCount, speed }: Props) =>
        useDealChoreography(phase, playerCount, dealerCount, { speed, onCardDealt }),
      { initialProps: { phase: 'betting' as GamePhase, playerCount: 0, dealerCount: 0, speed: 1 } },
    );

    rerender({ phase: 'playing', playerCount: 2, dealerCount: 2, speed: 1 });

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(onCardDealt.mock.calls.map(([target]) => target)).toEqual([
      'player',
      'dealer',
      'player',
      'dealer',
    ]);
  });

  it('does not restart for a phase change that is not a new deal', () => {
    const { result, rerender } = renderChoreo({
      phase: 'betting',
      playerCount: 0,
      dealerCount: 0,
      speed: 1,
    });

    rerender({ phase: 'playing', playerCount: 2, dealerCount: 2, speed: 1 });
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(result.current.done).toBe(true);

    rerender({ phase: 'finished', playerCount: 2, dealerCount: 3, speed: 1 });
    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current.done).toBe(true);
  });
});
