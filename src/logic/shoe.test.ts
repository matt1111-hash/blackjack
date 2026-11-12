import { describe, expect, it } from 'vitest';
import { didReshuffle } from './shoe';

describe('didReshuffle', () => {
  const TOTAL = 312;

  it('detects a refill from below the 25% threshold', () => {
    expect(didReshuffle(50, TOTAL, TOTAL)).toBe(true);
  });

  it('does not trigger above the threshold', () => {
    expect(didReshuffle(100, TOTAL, TOTAL)).toBe(false);
  });

  it('does not trigger for a partial refill', () => {
    expect(didReshuffle(50, 200, TOTAL)).toBe(false);
  });

  it('does not trigger on a fresh session', () => {
    expect(didReshuffle(0, TOTAL, TOTAL)).toBe(false);
  });

  it('does not trigger when nothing changed', () => {
    expect(didReshuffle(50, 50, TOTAL)).toBe(false);
  });
});
