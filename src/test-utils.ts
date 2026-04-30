import type { Card, Hand } from './types';

/** Create a test card with sensible defaults */
export function mockCard(rank: Card['rank'], suit: Card['suit'] = 'hearts', faceUp = true): Card {
  return { rank, suit, faceUp };
}

/** Create a test hand with sensible defaults */
export function mockHand(cards: Card[] = [], bet = 100, overrides: Partial<Hand> = {}): Hand {
  return {
    cards,
    bet,
    isDoubled: false,
    isStanding: false,
    isBusted: false,
    isBlackjack: false,
    ...overrides,
  };
}

/** Create a test shoe from ordered card specs */
export function mockShoe(ranks: Card['rank'][], suit: Card['suit'] = 'hearts'): Card[] {
  return ranks.map((rank) => mockCard(rank, suit));
}
