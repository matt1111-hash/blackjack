import { describe, it, expect } from 'vitest';
import {
  dealerPlay,
  calculateResults,
  applyPayouts,
  canPlayerDouble,
  canPlayerSplit,
} from './rules';
import type { Card, Hand } from '../types';

function createTestCard(suit: string, rank: string, faceUp = true): Card {
  return { suit: suit as Card['suit'], rank: rank as Card['rank'], faceUp };
}

function createTestHand(cards: Card[], bet = 100): Hand {
  return {
    cards,
    bet,
    isDoubled: false,
    isStanding: false,
    isBusted: false,
    isBlackjack: false,
  };
}

describe('dealerPlay', () => {
  it('should stand on hard 17', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '7'),
    ]);
    const shoe = Array(50).fill(createTestCard('diamonds', '5'));

    const { hand: result } = dealerPlay(hand, shoe);

    expect(result.isStanding).toBe(true);
    expect(result.isBusted).toBe(false);
  });

  it('should stand on soft 17 (dealer stands on soft 17)', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'A'),
      createTestCard('spades', '6'),
    ]);
    const shoe = Array(50).fill(createTestCard('diamonds', '5'));

    const { hand: result } = dealerPlay(hand, shoe);

    expect(result.isStanding).toBe(true);
  });

  it('should hit on hard 16', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '6'),
    ]);
    const shoe = [createTestCard('diamonds', '5'), ...Array(50).fill(createTestCard('clubs', '2'))];

    const { hand: result } = dealerPlay(hand, shoe);

    expect(result.cards).toHaveLength(3);
    expect(result.isStanding).toBe(true);
  });

  it('should reveal hole card after playing', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K', true),
      createTestCard('spades', '7', false),
    ]);
    const shoe = Array(50).fill(createTestCard('diamonds', '5'));

    const { hand: result } = dealerPlay(hand, shoe);

    expect(result.cards[1].faceUp).toBe(true);
  });

  it('should handle bust', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '6'),
    ]);
    const shoe = [createTestCard('diamonds', 'K'), ...Array(50).fill(createTestCard('clubs', '2'))];

    const { hand: result } = dealerPlay(hand, shoe);

    expect(result.isBusted).toBe(true);
    expect(result.isStanding).toBe(true); // Dealer is done after busting
  });
});

describe('calculateResults', () => {
  it('should return win when player has higher value', () => {
    const playerHand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '9'),
    ]);
    const dealerHand = createTestHand([
      createTestCard('clubs', 'Q'),
      createTestCard('diamonds', '7'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('win');
    expect(results[0].payout).toBe(0.5);
  });

  it('should return lose when dealer has higher value', () => {
    const playerHand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '8'),
    ]);
    const dealerHand = createTestHand([
      createTestCard('clubs', 'Q'),
      createTestCard('diamonds', '9'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('lose');
    expect(results[0].payout).toBe(0);
  });

  it('should return push on tie', () => {
    const playerHand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '9'),
    ]);
    const dealerHand = createTestHand([
      createTestCard('clubs', 'K'),
      createTestCard('diamonds', '9'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('push');
    expect(results[0].payout).toBe(0);
  });

  it('should return blackjack for natural', () => {
    const playerHand = createTestHand([
      createTestCard('hearts', 'A'),
      createTestCard('spades', 'K'),
    ]);
    playerHand.isBlackjack = true;
    const dealerHand = createTestHand([
      createTestCard('clubs', 'Q'),
      createTestCard('diamonds', '8'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('blackjack');
    expect(results[0].payout).toBe(0.75);
  });

  it('should handle dealer blackjack vs player non-blackjack', () => {
    const playerHand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '9'),
    ]);
    const dealerHand = createTestHand([
      createTestCard('clubs', 'A'),
      createTestCard('diamonds', 'K'), // Blackjack
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('lose');
    expect(results[0].payout).toBe(0);
  });

  it('should handle double down payout', () => {
    const playerHand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '9'),
    ]);
    playerHand.isDoubled = true;
    const dealerHand = createTestHand([
      createTestCard('clubs', 'Q'),
      createTestCard('diamonds', '7'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('win');
    expect(results[0].payout).toBe(1);
  });

  it('should handle busted player hand', () => {
    const playerHand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', 'K'),
      createTestCard('diamonds', '5'),
    ]);
    playerHand.isBusted = true;
    const dealerHand = createTestHand([
      createTestCard('clubs', 'Q'),
      createTestCard('diamonds', '7'),
    ]);

    const results = calculateResults([playerHand], dealerHand);

    expect(results[0].result).toBe('lose');
    expect(results[0].payout).toBe(0);
  });

  it('should handle multiple hands', () => {
    const hand1 = createTestHand([createTestCard('hearts', 'K'), createTestCard('spades', '9')], 100); // 19
    const hand2 = createTestHand([createTestCard('clubs', 'Q'), createTestCard('diamonds', '8')], 50); // 18
    const dealerHand = createTestHand([createTestCard('hearts', 'K'), createTestCard('diamonds', '9')]); // 19

    const results = calculateResults([hand1, hand2], dealerHand);

    expect(results).toHaveLength(2);
    expect(results[0].result).toBe('push'); // 19 vs 19
    expect(results[1].result).toBe('lose'); // 18 vs 19
  });
});

describe('applyPayouts', () => {
  it('should add winnings to balance', () => {
    const balance = 1000;
    const hands = [createTestHand([createTestCard('hearts', 'K'), createTestCard('spades', '9')], 100)];
    const results = [{ playerHandIndex: 0, result: 'win' as const, payout: 0.5 }];

    const newBalance = applyPayouts(balance, results, hands);

    expect(newBalance).toBe(1050);
  });

  it('should handle blackjack payout (3:2)', () => {
    const balance = 1000;
    const hands = [createTestHand([createTestCard('hearts', 'A'), createTestCard('spades', 'K')], 100)];
    hands[0].isBlackjack = true;
    const results = [{ playerHandIndex: 0, result: 'blackjack' as const, payout: 0.75 }];

    const newBalance = applyPayouts(balance, results, hands);

    expect(newBalance).toBe(1075);
  });

  it('should return bet on push', () => {
    const balance = 1000;
    const hands = [createTestHand([createTestCard('hearts', 'K'), createTestCard('spades', '9')], 100)];
    const results = [{ playerHandIndex: 0, result: 'push' as const, payout: 0 }];

    const newBalance = applyPayouts(balance, results, hands);

    expect(newBalance).toBe(1000);
  });

  it('should handle loss (bet already deducted)', () => {
    const balance = 1000;
    const hands = [createTestHand([createTestCard('hearts', 'K'), createTestCard('spades', '8')], 100)];
    const results = [{ playerHandIndex: 0, result: 'lose' as const, payout: 0 }];

    const newBalance = applyPayouts(balance, results, hands);

    expect(newBalance).toBe(1000);
  });
});

describe('canPlayerDouble', () => {
  it('should return true for 2-card hand with sufficient balance', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '7'),
    ]);

    expect(canPlayerDouble(hand, 500)).toBe(true);
  });

  it('should return false for hand with more than 2 cards', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '7'),
      createTestCard('diamonds', '3'),
    ]);

    expect(canPlayerDouble(hand, 500)).toBe(false);
  });

  it('should return false when already doubled', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '7'),
    ]);
    hand.isDoubled = true;

    expect(canPlayerDouble(hand, 500)).toBe(false);
  });

  it('should return false when insufficient balance', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', '7'),
    ]);

    expect(canPlayerDouble(hand, 50)).toBe(false);
  });
});

describe('canPlayerSplit', () => {
  it('should return true for matching rank cards', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', 'K'),
    ]);

    expect(canPlayerSplit(hand, 500)).toBe(true);
  });

  it('should return false for different rank cards', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', 'Q'),
    ]);

    expect(canPlayerSplit(hand, 500)).toBe(false);
  });

  it('should return false when insufficient balance', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', 'K'),
    ]);

    expect(canPlayerSplit(hand, 50)).toBe(false);
  });

  it('should return false for more than 2 cards', () => {
    const hand = createTestHand([
      createTestCard('hearts', 'K'),
      createTestCard('spades', 'K'),
      createTestCard('diamonds', '3'),
    ]);

    expect(canPlayerSplit(hand, 500)).toBe(false);
  });
});
