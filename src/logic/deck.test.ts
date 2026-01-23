import { describe, it, expect } from 'vitest';
import {
  createDeck,
  createShoe,
  shuffle,
  dealCard,
} from './deck';

describe('createDeck', () => {
  it('should create a 52-card deck', () => {
    const deck = createDeck();
    expect(deck).toHaveLength(52);
  });

  it('should have all suits', () => {
    const deck = createDeck();
    const suits = new Set(deck.map((c) => c.suit));
    expect(suits).toEqual(new Set(['hearts', 'diamonds', 'clubs', 'spades']));
  });

  it('should have all ranks per suit', () => {
    const deck = createDeck();
    const ranks = new Set(deck.map((c) => c.rank));
    expect(ranks).toEqual(new Set(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']));
  });

  it('should have 13 cards per suit', () => {
    const deck = createDeck();
    for (const suit of ['hearts', 'diamonds', 'clubs', 'spades'] as const) {
      const suitCards = deck.filter((c) => c.suit === suit);
      expect(suitCards).toHaveLength(13);
    }
  });
});

describe('createShoe', () => {
  it('should create 6-deck shoe (312 cards)', () => {
    const shoe = createShoe(6);
    expect(shoe).toHaveLength(312);
  });

  it('should create single deck when called with 1', () => {
    const shoe = createShoe(1);
    expect(shoe).toHaveLength(52);
  });

  it('should create 8-deck shoe (416 cards)', () => {
    const shoe = createShoe(8);
    expect(shoe).toHaveLength(416);
  });
});

describe('shuffle', () => {
  it('should not mutate original array', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffle(original);
    expect(original).toEqual([1, 2, 3, 4, 5]);
    expect(shuffled).not.toBe(original);
  });

  it('should return same elements', () => {
    const original = [1, 2, 3, 4, 5];
    const shuffled = shuffle(original);
    expect(sorted(shuffled)).toEqual(sorted(original));
  });

  it('should handle empty array', () => {
    const result = shuffle<number>([]);
    expect(result).toHaveLength(0);
  });

  it('should handle single element', () => {
    const result = shuffle([1]);
    expect(result).toEqual([1]);
  });
});

describe('dealCard', () => {
  it('should deal a card from shoe', () => {
    const deck = createDeck();
    const [card, remaining] = dealCard(deck) as [import('../types').Card, import('../types').Card[]];
    expect(card).toBeDefined();
    expect(remaining).toHaveLength(51);
  });

  it('should set faceUp correctly', () => {
    const deck = createDeck();
    const [cardFaceUp] = dealCard(deck, true) as [import('../types').Card, import('../types').Card[]];
    expect(cardFaceUp.faceUp).toBe(true);

    const [cardFaceDown] = dealCard(deck, false) as [import('../types').Card, import('../types').Card[]];
    expect(cardFaceDown.faceUp).toBe(false);
  });

  it('should return undefined for empty shoe', () => {
    const result = dealCard([]);
    expect(result).toBeUndefined();
  });

  it('should preserve other card properties', () => {
    const deck = createDeck();
    const [card] = dealCard(deck) as [import('../types').Card, import('../types').Card[]];
    expect(card.suit).toBeDefined();
    expect(card.rank).toBeDefined();
  });
});

function sorted<T>(arr: T[]): T[] {
  return [...arr].sort((a, b) => (a as unknown as number) - (b as unknown as number));
}
