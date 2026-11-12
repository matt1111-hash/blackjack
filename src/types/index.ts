// Card Types
export type Suit = 'hearts' | 'diamonds' | 'clubs' | 'spades';
export type Rank = 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';

export interface Card {
  suit: Suit;
  rank: Rank;
  faceUp: boolean;
}

// Hand Types
export interface Hand {
  cards: Card[];
  bet: number;
  isDoubled: boolean;
  isStanding: boolean;
  isBusted: boolean;
  isBlackjack: boolean;
}

export type HandResult = 'win' | 'lose' | 'push' | 'blackjack';

// Game Types
export type GamePhase = 'betting' | 'insurance' | 'playing' | 'finished';

export interface GameError {
  action: string;
  message: string;
}

// Chip Types
// A zseton szín-paletta (test / karima / felirat / él-betét) a
// styles/tokens.css-ben él (.chip-palette--N osztályok) — egyetlen forrás.
export type ChipValue = 1 | 5 | 25 | 100 | 500;
