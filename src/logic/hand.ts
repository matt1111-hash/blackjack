import type { Card, Hand } from '../types';

/** Gets numeric value of a card (Ace = 11 initially) */
export function getCardValue(card: Card): number {
  if (card.rank === 'A') return 11;
  if (['K', 'Q', 'J'].includes(card.rank)) return 10;
  return parseInt(card.rank, 10);
}

/** Calculates best hand value (adjusts Aces from 11 to 1 if needed) */
export function calculateHandValue(cards: Card[]): number {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    value += getCardValue(card);
    if (card.rank === 'A') aces++;
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return value;
}

/** Checks if hand is soft (has Ace counted as 11) */
export function isSoftHand(cards: Card[]): boolean {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    value += getCardValue(card);
    if (card.rank === 'A') aces++;
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return aces > 0 && value <= 21;
}

/** Checks if hand is busted */
export function isBusted(cards: Card[]): boolean {
  return calculateHandValue(cards) > 21;
}

/** Checks if hand is blackjack (21 with 2 cards) */
export function isBlackjack(cards: Card[]): boolean {
  return cards.length === 2 && calculateHandValue(cards) === 21;
}

/** Creates empty hand with bet */
export function createHand(bet: number): Hand {
  return {
    cards: [],
    bet,
    isDoubled: false,
    isStanding: false,
    isBusted: false,
    isBlackjack: false,
  };
}
