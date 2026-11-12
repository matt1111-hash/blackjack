import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useCountUp } from './useCountUp';

describe('useCountUp', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['requestAnimationFrame', 'cancelAnimationFrame'] });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns the target immediately when animation is disabled', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 0), {
      initialProps: { target: 0 },
    });
    rerender({ target: 5000 });
    expect(result.current).toBe(5000);
  });

  it('passes through intermediate values and converges to the target', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 1000), {
      initialProps: { target: 100 },
    });

    rerender({ target: 1000 });

    act(() => {
      vi.advanceTimersByTime(300);
    });
    const midway = result.current;
    expect(midway).toBeGreaterThan(100);
    expect(midway).toBeLessThan(1000);

    act(() => {
      vi.advanceTimersByTime(1200);
    });
    expect(result.current).toBe(1000);
  });

  it('counts down when the target decreases', () => {
    const { result, rerender } = renderHook(({ target }) => useCountUp(target, 500), {
      initialProps: { target: 1000 },
    });

    rerender({ target: 100 });

    act(() => {
      vi.advanceTimersByTime(800);
    });
    expect(result.current).toBe(100);
  });
});
