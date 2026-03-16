import type { Card, Hand, GamePhase } from '../types';
import { createShoe, shuffle, dealCard } from '../logic/deck';
import { isBlackjack } from '../logic/hand';
import { dealerPlay, calculateResults, applyPayouts } from '../logic/rules';

export const INITIAL_BALANCE = 5000;
export const SHOE_DECKS = 6;
export const E2E_SHOE_STORAGE_KEY = 'blackjack:e2e-shoe';

const VALID_SUITS = new Set(['hearts', 'diamonds', 'clubs', 'spades']);
const VALID_RANKS = new Set(['A', '2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K']);

export interface RoundResult {
  playerHandIndex: number;
  result: 'win' | 'lose' | 'push' | 'blackjack';
  payout: number;
}

export interface GameState {
  // Balance
  balance: number;

  // Shoe
  shoe: Card[];
  shoePenetration: number;

  // Hands
  playerHands: Hand[];
  dealerHand: Hand;
  activeHandIndex: number;

  // Game phase
  phase: GamePhase;

  // Current bet
  currentBet: number;

  // Round results (for display)
  roundResults: RoundResult[] | null;

  // Actions
  placeBet: (amount: number) => void;
  deal: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  buyInsurance: () => void;
  declineInsurance: () => void;
  newRound: () => void;
  resetBalance: () => void;
}

function isValidCard(candidate: unknown): candidate is Card {
  if (typeof candidate !== 'object' || candidate === null) {
    return false;
  }

  const card = candidate as Partial<Card>;
  return (
    typeof card.rank === 'string' &&
    typeof card.suit === 'string' &&
    typeof card.faceUp === 'boolean' &&
    VALID_RANKS.has(card.rank) &&
    VALID_SUITS.has(card.suit)
  );
}

function getConfiguredShoe(): Card[] | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const rawValue = window.localStorage.getItem(E2E_SHOE_STORAGE_KEY);
  if (!rawValue) {
    return null;
  }

  try {
    const parsedValue = JSON.parse(rawValue);
    if (!Array.isArray(parsedValue)) {
      return null;
    }

    const configuredShoe = parsedValue.filter(isValidCard);
    return configuredShoe.length > 0 ? configuredShoe : null;
  } catch {
    return null;
  }
}

export function createFreshShoe(): Card[] {
  return getConfiguredShoe() ?? shuffle(createShoe(SHOE_DECKS));
}

export function dealInitialHands(shoe: Card[], bet: number): { playerHand: Hand; dealerHand: Hand; remainingShoe: Card[] } {
  const [playerCard1, shoe1] = dealCard(shoe, true)!;
  const [dealerCard1, shoe2] = dealCard(shoe1, true)!;
  const [playerCard2, shoe3] = dealCard(shoe2, true)!;
  const [dealerCard2, remainingShoe] = dealCard(shoe3, false)!;

  const playerHand: Hand = {
    cards: [playerCard1, playerCard2],
    bet,
    isDoubled: false,
    isStanding: false,
    isBusted: false,
    isBlackjack: isBlackjack([playerCard1, playerCard2]),
  };

  const dealerHand: Hand = {
    cards: [dealerCard1, dealerCard2],
    bet: 0,
    isDoubled: false,
    isStanding: false,
    isBusted: false,
    isBlackjack: false,
  };

  return { playerHand, dealerHand, remainingShoe };
}

export function handleAllHandsDone(
  dealerHand: Hand,
  shoe: Card[],
  playerHands: Hand[],
  balance: number
) {
  const { hand: finalDealerHand, remainingShoe: finalShoe } = dealerPlay(dealerHand, shoe);
  const results = calculateResults(playerHands, finalDealerHand);
  const newBalance = applyPayouts(balance, results, playerHands);

  return {
    shoe: finalShoe,
    dealerHand: finalDealerHand,
    playerHands,
    roundResults: results,
    balance: newBalance,
    phase: 'finished' as GamePhase,
  };
}
