import { describe, it, expect } from 'vitest';
import {
  getCardValue,
  calculateHandValue,
  isSoftHand,
  isBusted,
  isBlackjack,
  createHand,
} from './hand';
import type { Card } from '../types';

describe('getCardValue', () => {
  it('should return 11 for Ace', () => {
    expect(getCardValue({ suit: 'hearts', rank: 'A', faceUp: true })).toBe(11);
  });

  it('should return 10 for King', () => {
    expect(getCardValue({ suit: 'spades', rank: 'K', faceUp: true })).toBe(10);
  });

  it('should return 10 for Queen', () => {
    expect(getCardValue({ suit: 'diamonds', rank: 'Q', faceUp: true })).toBe(10);
  });

  it('should return 10 for Jack', () => {
    expect(getCardValue({ suit: 'clubs', rank: 'J', faceUp: true })).toBe(10);
  });

  it('should return numeric value for number cards', () => {
    expect(getCardValue({ suit: 'hearts', rank: '2', faceUp: true })).toBe(2);
    expect(getCardValue({ suit: 'hearts', rank: '9', faceUp: true })).toBe(9);
  });
});

describe('calculateHandValue', () => {
  it('should return 21 for blackjack (A + K)', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: 'K', faceUp: true },
    ];
    expect(calculateHandValue(cards)).toBe(21);
  });

  it('should return 21 for blackjack (A + Q)', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: 'Q', faceUp: true },
    ];
    expect(calculateHandValue(cards)).toBe(21);
  });

  it('should handle multiple Aces', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: 'A', faceUp: true },
      { suit: 'clubs', rank: '9', faceUp: true },
    ];
    expect(calculateHandValue(cards)).toBe(21); // 11 + 1 + 9
  });

  it('should count Ace as 1 when over 21', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: 'K', faceUp: true },
      { suit: 'clubs', rank: 'Q', faceUp: true },
    ];
    expect(calculateHandValue(cards)).toBe(21); // 11 + 10 + 10 = 31 -> 21
  });

  it('should return 0 for empty hand', () => {
    expect(calculateHandValue([])).toBe(0);
  });

  it('should calculate hard hand correctly', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: '7', faceUp: true },
      { suit: 'spades', rank: '8', faceUp: true },
    ];
    expect(calculateHandValue(cards)).toBe(15);
  });

  it('should handle multiple Aces converting to 1', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: 'A', faceUp: true },
      { suit: 'clubs', rank: 'A', faceUp: true },
      { suit: 'diamonds', rank: '9', faceUp: true },
    ];
    expect(calculateHandValue(cards)).toBe(12); // 11 + 1 + 1 + 9 = 22 -> 12
  });
});

describe('isSoftHand', () => {
  it('should return true for soft 17 (A + 6)', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: '6', faceUp: true },
    ];
    expect(isSoftHand(cards)).toBe(true);
  });

  it('should return true for soft 18 (A + 7)', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: '7', faceUp: true },
    ];
    expect(isSoftHand(cards)).toBe(true);
  });

  it('should return false for hard hand', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: '9', faceUp: true },
      { suit: 'spades', rank: '8', faceUp: true },
    ];
    expect(isSoftHand(cards)).toBe(false);
  });

  it('should return false for busted hand', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: 'K', faceUp: true },
      { suit: 'clubs', rank: 'Q', faceUp: true },
    ];
    expect(isSoftHand(cards)).toBe(false);
  });
});

describe('isBusted', () => {
  it('should return true for hand over 21', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'K', faceUp: true },
      { suit: 'spades', rank: 'Q', faceUp: true },
      { suit: 'clubs', rank: '2', faceUp: true },
    ];
    expect(isBusted(cards)).toBe(true);
  });

  it('should return false for hand under 21', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: '9', faceUp: true },
      { suit: 'spades', rank: '8', faceUp: true },
    ];
    expect(isBusted(cards)).toBe(false);
  });

  it('should return false for exactly 21', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'K', faceUp: true },
      { suit: 'spades', rank: 'A', faceUp: true },
    ];
    expect(isBusted(cards)).toBe(false);
  });
});

describe('isBlackjack', () => {
  it('should return true for Ace + 10-value card', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: 'K', faceUp: true },
    ];
    expect(isBlackjack(cards)).toBe(true);
  });

  it('should return false for 21 with more than 2 cards', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'A', faceUp: true },
      { suit: 'spades', rank: '2', faceUp: true },
      { suit: 'clubs', rank: '8', faceUp: true },
    ];
    expect(isBlackjack(cards)).toBe(false);
  });

  it('should return false for 21 without Ace', () => {
    const cards: Card[] = [
      { suit: 'hearts', rank: 'K', faceUp: true },
      { suit: 'spades', rank: 'Q', faceUp: true },
      { suit: 'clubs', rank: 'A', faceUp: true },
    ];
    expect(isBlackjack(cards)).toBe(false);
  });
});

describe('createHand', () => {
  it('should create hand with initial values', () => {
    const hand = createHand(100);
    expect(hand.cards).toHaveLength(0);
    expect(hand.bet).toBe(100);
    expect(hand.isDoubled).toBe(false);
    expect(hand.isStanding).toBe(false);
    expect(hand.isBusted).toBe(false);
    expect(hand.isBlackjack).toBe(false);
  });

  it('should accept different bet amounts', () => {
    expect(createHand(25).bet).toBe(25);
    expect(createHand(500).bet).toBe(500);
  });
});
