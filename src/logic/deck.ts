import type { Card, Suit, Rank } from '../types';

const SUITS: Suit[] = ['hearts', 'diamonds', 'clubs', 'spades'];
const RANKS: Rank[] = ['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K'];

/** Creates a single 52-card deck */
export function createDeck(): Card[] {
  const deck: Card[] = [];
  for (const suit of SUITS) {
    for (const rank of RANKS) {
      deck.push({ suit, rank, faceUp: true });
    }
  }
  return deck;
}

/** Creates a shoe with multiple decks */
export function createShoe(numberOfDecks: number): Card[] {
  const shoe: Card[] = [];
  for (let i = 0; i < numberOfDecks; i++) {
    shoe.push(...createDeck());
  }
  return shoe;
}

/** Fisher-Yates shuffle - returns new array */
export function shuffle<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j]!, shuffled[i]!];
  }
  return shuffled;
}

/** Deals a card from shoe, returns [card, remainingShoe] */
export function dealCard(shoe: Card[], faceUp = true): [Card, Card[]] | undefined {
  if (shoe.length === 0) return undefined;
  const [card, ...remaining] = shoe;
  if (!card) return undefined;
  return [{ ...card, faceUp }, remaining];
}
