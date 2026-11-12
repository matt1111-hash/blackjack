import { describe, expect, it } from 'vitest';
import { RoundRobinPool, clampVolume, variation } from './soundPool';

describe('RoundRobinPool', () => {
  it('cycles through the items in order', () => {
    const pool = new RoundRobinPool(['a', 'b', '3']);
    expect([pool.next(), pool.next(), pool.next(), pool.next()]).toEqual(['a', 'b', '3', 'a']);
  });

  it('works with a single item', () => {
    const pool = new RoundRobinPool([42]);
    expect(pool.next()).toBe(42);
    expect(pool.next()).toBe(42);
    expect(pool.size).toBe(1);
  });

  it('rejects an empty pool', () => {
    expect(() => new RoundRobinPool([])).toThrow();
  });

  it('exposes all items for teardown', () => {
    const pool = new RoundRobinPool([1, 2]);
    expect(pool.peekAll()).toEqual([1, 2]);
  });
});

describe('variation', () => {
  it('returns the midpoint for a centered random', () => {
    expect(variation(0.06, () => 0.5)).toBeCloseTo(1);
  });

  it('stays within the spread bounds', () => {
    expect(variation(0.06, () => 0)).toBeCloseTo(0.94);
    expect(variation(0.06, () => 1)).toBeCloseTo(1.06);
  });
});

describe('clampVolume', () => {
  it('clamps into the 0..1 range', () => {
    expect(clampVolume(-1)).toBe(0);
    expect(clampVolume(0.5)).toBe(0.5);
    expect(clampVolume(2)).toBe(1);
  });
});
