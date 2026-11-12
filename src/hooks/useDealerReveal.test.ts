import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useDealerReveal } from './useDealerReveal';
import type { GamePhase } from '../types';

interface Props {
  phase: GamePhase;
  dealerCount: number;
  armed: boolean;
  speed: number;
}

describe('useDealerReveal', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  function renderReveal(props: Props) {
    return renderHook(
      ({ phase, dealerCount, armed, speed }: Props) => useDealerReveal(phase, dealerCount, armed, speed),
      { initialProps: props },
    );
  }

  it('reveals everything immediately when speed is 0', () => {
    const { result } = renderReveal({ phase: 'finished', dealerCount: 3, armed: true, speed: 0 });
    expect(result.current).toEqual({ visible: 3, holeRevealed: true, done: true });
  });

  it('keeps the hole card hidden while playing', () => {
    const { result } = renderReveal({ phase: 'playing', dealerCount: 2, armed: true, speed: 1 });
    expect(result.current.holeRevealed).toBe(false);
  });

  it('flips the hole card first, then reveals drawn cards one by one', () => {
    const { result, rerender } = renderReveal({
      phase: 'playing',
      dealerCount: 3,
      armed: true,
      speed: 1,
    });

    rerender({ phase: 'finished', dealerCount: 3, armed: true, speed: 1 });

    act(() => {
      vi.advanceTimersByTime(1);
    });
    expect(result.current).toEqual({ visible: 2, holeRevealed: false, done: false });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toEqual({ visible: 2, holeRevealed: true, done: false });

    act(() => {
      vi.advanceTimersByTime(400);
    });
    expect(result.current).toEqual({ visible: 3, holeRevealed: true, done: true });
  });

  it('finishes with the flip alone for a two-card hand', () => {
    const { result, rerender } = renderReveal({
      phase: 'playing',
      dealerCount: 2,
      armed: true,
      speed: 1,
    });

    rerender({ phase: 'finished', dealerCount: 2, armed: true, speed: 1 });

    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current).toEqual({ visible: 2, holeRevealed: true, done: true });
  });

  it('waits for the arming signal before starting', () => {
    const { result, rerender } = renderReveal({
      phase: 'finished',
      dealerCount: 2,
      armed: false,
      speed: 1,
    });

    act(() => {
      vi.advanceTimersByTime(2000);
    });
    expect(result.current.holeRevealed).toBe(false);

    rerender({ phase: 'finished', dealerCount: 2, armed: true, speed: 1 });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.holeRevealed).toBe(true);
  });
});
