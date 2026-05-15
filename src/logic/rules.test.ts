import { describe, it, expect } from 'vitest';
import {
  dealerPlay,
  calculateResults,
} from './rules';
import type { Card } from '../types';
import { mockCard, mockHand } from '../test-utils';

function createTestShoe(count: number, rank: Card['rank'] = '5', suit: Card['suit'] = 'diamonds'): Card[] {
  return Array(count).fill(mockCard(rank, suit));
}

describe('dealerPlay', () => {
  it('should stand on hard 17', () => {
    const hand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('7', 'spades'),
    ]);
    const shoe = createTestShoe(50);

    const { hand: result } = dealerPlay(hand, shoe);

    expect(result.isStanding).toBe(true);
    expect(result.isBusted).toBe(false);
  });

  it('should stand on soft 17 (dealer stands on soft 17)', () => {
    const hand = mockHand([
      mockCard('A', 'hearts'),
      mockCard('6', 'spades'),
    ]);
    const shoe = createTestShoe(50);

    const { hand: result } = dealerPlay(hand, shoe);

    expect(result.isStanding).toBe(true);
  });

  it('should hit on hard 16', () => {
    const hand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('6', 'spades'),
    ]);
    const shoe = [mockCard('5', 'diamonds'), ...createTestShoe(50, '2', 'clubs')];

    const { hand: result } = dealerPlay(hand, shoe);

    expect(result.cards).toHaveLength(3);
    expect(result.isStanding).toBe(true);
  });

  it('should reveal hole card after playing', () => {
    const hand = mockHand([
      mockCard('K', 'hearts', true),
      mockCard('7', 'spades', false),
    ]);
    const shoe = createTestShoe(50);

    const { hand: result } = dealerPlay(hand, shoe);

    expect(result.cards[1].faceUp).toBe(true);
  });

  it('should handle bust', () => {
    const hand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('6', 'spades'),
    ]);
    const shoe = [mockCard('K', 'diamonds'), ...createTestShoe(50, '2', 'clubs')];

    const { hand: result } = dealerPlay(hand, shoe);

    expect(result.isBusted).toBe(true);
    expect(result.isStanding).toBe(true);
  });
});

describe('calculateResults', () => {
  it('should return win when player has higher value', () => {
    const playerHand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('9', 'spades'),
    ]);
    const dealerHand = mockHand([
      mockCard('Q', 'clubs'),
      mockCard('7', 'diamonds'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('win');
    expect(results[0].payout).toBe(1);
  });

  it('should return lose when dealer has higher value', () => {
    const playerHand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('8', 'spades'),
    ]);
    const dealerHand = mockHand([
      mockCard('Q', 'clubs'),
      mockCard('9', 'diamonds'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('lose');
    expect(results[0].payout).toBe(0);
  });

  it('should return push on tie', () => {
    const playerHand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('9', 'spades'),
    ]);
    const dealerHand = mockHand([
      mockCard('K', 'clubs'),
      mockCard('9', 'diamonds'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('push');
    expect(results[0].payout).toBe(0);
  });

  it('should return blackjack for natural', () => {
    const playerHand = mockHand(
      [mockCard('A', 'hearts'), mockCard('K', 'spades')],
      100,
      { isBlackjack: true },
    );
    const dealerHand = mockHand([
      mockCard('Q', 'clubs'),
      mockCard('8', 'diamonds'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('blackjack');
    expect(results[0].payout).toBe(1.5);
  });

  it('should handle dealer blackjack vs player non-blackjack', () => {
    const playerHand = mockHand([
      mockCard('K', 'hearts'),
      mockCard('9', 'spades'),
    ]);
    const dealerHand = mockHand([
      mockCard('A', 'clubs'),
      mockCard('K', 'diamonds'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('lose');
    expect(results[0].payout).toBe(0);
  });

  it('should handle double down payout', () => {
    const playerHand = mockHand(
      [mockCard('K', 'hearts'), mockCard('9', 'spades')],
      100,
      { isDoubled: true },
    );
    const dealerHand = mockHand([
      mockCard('Q', 'clubs'),
      mockCard('7', 'diamonds'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('win');
    expect(results[0].payout).toBe(1);
  });

  it('should handle busted player hand', () => {
    const playerHand = mockHand(
      [mockCard('K', 'hearts'), mockCard('K', 'spades'), mockCard('5', 'diamonds')],
      100,
      { isBusted: true },
    );
    const dealerHand = mockHand([
      mockCard('Q', 'clubs'),
      mockCard('7', 'diamonds'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('lose');
    expect(results[0].payout).toBe(0);
  });

  it('should handle multiple hands', () => {
    const hand1 = mockHand([mockCard('K', 'hearts'), mockCard('9', 'spades')], 100);
    const hand2 = mockHand([mockCard('Q', 'clubs'), mockCard('8', 'diamonds')], 50);
    const dealerHand = mockHand([mockCard('K', 'hearts'), mockCard('9', 'diamonds')]);

    const results = calculateResults([hand1, hand2], dealerHand);

    expect(results).toHaveLength(2);
    expect(results[0].result).toBe('push');
    expect(results[1].result).toBe('lose');
  });
});
