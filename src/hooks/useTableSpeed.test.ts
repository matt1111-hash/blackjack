import { act, renderHook } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { SPEED_FACTOR, useTableSpeed } from './useTableSpeed';

describe('useTableSpeed', () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it('starts at live pace', () => {
    const { result } = renderHook(() => useTableSpeed());
    expect(result.current.speed).toBe('live');
    expect(result.current.factor).toBe(SPEED_FACTOR.live);
  });

  it('toggles to fast and persists it', () => {
    const { result } = renderHook(() => useTableSpeed());

    act(() => result.current.toggle());

    expect(result.current.speed).toBe('fast');
    expect(result.current.factor).toBeLessThan(1);
    expect(window.localStorage.getItem('blackjack:speed')).toBe('fast');
  });

  it('restores the stored pace', () => {
    window.localStorage.setItem('blackjack:speed', 'fast');
    const { result } = renderHook(() => useTableSpeed());
    expect(result.current.speed).toBe('fast');
  });
});
