import type { Card, Hand, GamePhase } from '../types';
import { createShoe, shuffle, dealCard } from '../logic/deck';
import { isBlackjack } from '../logic/hand';
import { dealerPlay, calculateResults, applyPayouts } from '../logic/rules';

export const INITIAL_BALANCE = 5000;
export const SHOE_DECKS = 6;

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

export function createFreshShoe(): Card[] {
  return shuffle(createShoe(SHOE_DECKS));
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
