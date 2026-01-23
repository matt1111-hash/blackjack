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
export type GamePhase = 'betting' | 'dealing' | 'playing' | 'dealerTurn' | 'finished';

// Chip Types
export type ChipValue = 1 | 5 | 25 | 100 | 500;

export const CHIP_COLORS: Record<ChipValue, string> = {
  1: '#FFFFFF',
  5: '#E53935',
  25: '#43A047',
  100: '#1E1E1E',
  500: '#7B1FA2',
};
