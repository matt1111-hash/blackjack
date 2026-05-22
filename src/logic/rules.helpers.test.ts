import { describe, it, expect } from 'vitest';
import {
  applyPayouts,
  canPlayerDouble,
  canPlayerSplit,
} from './rules';
import { mockCard, mockHand } from '../test-utils';

describe('applyPayouts', () => {
  it('should add winnings to balance', () => {
    const balance = 1000;
    const hands = [mockHand([mockCard('K', 'hearts'), mockCard('9', 'spades')], 100)];
    const results = [{ playerHandIndex: 0, result: 'win' as const, payout: 1 }];

    const newBalance = applyPayouts(balance, results, hands);

    expect(newBalance).toBe(1200);
  });

  it('should handle blackjack payout (3:2)', () => {
    const balance = 1000;
    const hands = [mockHand([mockCard('A', 'hearts'), mockCard('K', 'spades')], 100, { isBlackjack: true })];
    const results = [{ playerHandIndex: 0, result: 'blackjack' as const, payout: 1.5 }];

    const newBalance = applyPayouts(balance, results, hands);

    expect(newBalance).toBe(1250);
  });

  it('should return bet on push', () => {
    const balance = 1000;
    const hands = [mockHand([mockCard('K', 'hearts'), mockCard('9', 'spades')], 100)];
    const results = [{ playerHandIndex: 0, result: 'push' as const, payout: 0 }];

    const newBalance = applyPayouts(balance, results, hands);

    expect(newBalance).toBe(1100);
  });

  it('should handle loss (bet already deducted)', () => {
    const balance = 1000;
    const hands = [mockHand([mockCard('K', 'hearts'), mockCard('8', 'spades')], 100)];
    const results = [{ playerHandIndex: 0, result: 'lose' as const, payout: 0 }];

    const newBalance = applyPayouts(balance, results, hands);

    expect(newBalance).toBe(1000);
  });
});

describe('canPlayerDouble', () => {
  it('should return true for 2-card hand with sufficient balance', () => {
    const hand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('7', 'spades'),
    ]);

    expect(canPlayerDouble(hand, 500)).toBe(true);
  });

  it('should return false for hand with more than 2 cards', () => {
    const hand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('7', 'spades'),
      mockCard('3', 'diamonds'),
    ]);

    expect(canPlayerDouble(hand, 500)).toBe(false);
  });

  it('should return false when already doubled', () => {
    const hand = mockHand(
      [mockCard('K', 'hearts'), mockCard('7', 'spades')],
      100,
      { isDoubled: true },
    );

    expect(canPlayerDouble(hand, 500)).toBe(false);
  });

  it('should return false when insufficient balance', () => {
    const hand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('7', 'spades'),
    ]);

    expect(canPlayerDouble(hand, 50)).toBe(false);
  });
});

describe('canPlayerSplit', () => {
  it('should return true for matching rank cards', () => {
    const hand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('K', 'spades'),
    ]);

    expect(canPlayerSplit(hand, 500)).toBe(true);
  });

  it('should return false for different rank cards', () => {
    const hand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('Q', 'spades'),
    ]);

    expect(canPlayerSplit(hand, 500)).toBe(false);
  });

  it('should return false when insufficient balance', () => {
    const hand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('K', 'spades'),
    ]);

    expect(canPlayerSplit(hand, 50)).toBe(false);
  });

  it('should return false for more than 2 cards', () => {
    const hand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('K', 'spades'),
      mockCard('3', 'diamonds'),
    ]);

    expect(canPlayerSplit(hand, 500)).toBe(false);
  });
});
