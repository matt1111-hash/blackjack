import { describe, expect, it } from 'vitest';
import { CHIP_DENOMINATIONS, decomposeBet } from './chips';

describe('decomposeBet', () => {
  it('returns an empty list for zero', () => {
    expect(decomposeBet(0)).toEqual([]);
  });

  it('returns an empty list for negative amounts', () => {
    expect(decomposeBet(-25)).toEqual([]);
  });

  it('decomposes the smallest chip', () => {
    expect(decomposeBet(5)).toEqual([5]);
  });

  it('prefers the largest denominations first (greedy)', () => {
    expect(decomposeBet(130)).toEqual([100, 25, 5]);
  });

  it('decomposes the maximum starting bet', () => {
    expect(decomposeBet(500)).toEqual([500]);
  });

  it('drops the non-divisible remainder', () => {
    const chips = decomposeBet(12);
    expect(chips).toEqual([5, 5]);
    expect(chips.reduce((sum, value) => sum + value, 0)).toBe(10);
  });

  it('never loses more than the smallest denomination', () => {
    const amount = 999;
    const chips = decomposeBet(amount);
    const total = chips.reduce((sum, value) => sum + value, 0);
    expect(amount - total).toBeLessThan(5);
    expect(total).toBe(995);
  });

  it('every chip is a valid denomination', () => {
    for (const chip of decomposeBet(1234)) {
      expect(CHIP_DENOMINATIONS).toContain(chip);
    }
  });
});
