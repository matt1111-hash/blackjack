import type { Card, Hand } from '../types';
import { calculateHandValue, isBusted, isBlackjack, calculateHandDetails } from './hand';
import { dealCard } from './deck';

export const DEALER_STAND_VALUE = 17;

export interface RoundResult {
  playerHandIndex: number;
  result: 'win' | 'lose' | 'push' | 'blackjack';
  payout: number;
}

/** Dealer draws according to rules (stand on soft 17) */
export function dealerPlay(dealerHand: Hand, shoe: Card[]): { hand: Hand; remainingShoe: Card[] } {
  const hand = { ...dealerHand };
  let remainingShoe = [...shoe];

  // Reveal hole card
  hand.cards = hand.cards.map((c, i) => (i === 1 ? { ...c, faceUp: true } : c));

  let details = calculateHandDetails(hand.cards);

  while (shouldDealerHit(details.value)) {
    const dealResult = dealCard(remainingShoe, true);
    if (!dealResult) break;

    const [newCard, remaining] = dealResult;
    hand.cards.push(newCard);
    remainingShoe = remaining;
    details = calculateHandDetails(hand.cards);
  }

  hand.isBusted = isBusted(hand.cards);
  hand.isStanding = true; // Dealer is always "done" after playing

  return { hand, remainingShoe };
}

/**
 * S17: az osztó MINDEN 17-es kéznél megáll — soft 17-et is beleértve.
 * (Korábban egy soft ág is állt itt azonos kifejezéssel és félrevezető
 * kommenttel; összevonva, viselkedésváltozás nélkül. D22)
 */
function shouldDealerHit(value: number): boolean {
  return value < DEALER_STAND_VALUE;
}

/** Calculate round results for all player hands vs dealer */
export function calculateResults(
  playerHands: Hand[],
  dealerHand: Hand
): RoundResult[] {
  const dealerValue = calculateHandValue(dealerHand.cards);
  const dealerBJ = isBlackjack(dealerHand.cards, dealerValue);
  const dealerBusted = isBusted(dealerHand.cards, dealerValue);

  return playerHands.map((hand, index) => {
    const playerBJ = hand.isBlackjack;
    const playerBusted = hand.isBusted;
    const playerValue = calculateHandValue(hand.cards);

    let result: RoundResult['result'];
    let payout: number;

    if (playerBusted) {
      result = 'lose';
      payout = 0;
    } else if (dealerBusted) {
      result = 'win';
      payout = 1; // 1:1 profit (bet is already doubled in hand.bet if doubled down)
    } else if (playerBJ && !dealerBJ) {
      result = 'blackjack';
      payout = 1.5; // 3:2 profit = 150% of bet
    } else if (dealerBJ && !playerBJ) {
      result = 'lose';
      payout = 0;
    } else if (playerValue > dealerValue) {
      result = 'win';
      payout = 1; // 1:1 profit (bet is already doubled in hand.bet if doubled down)
    } else if (playerValue < dealerValue) {
      result = 'lose';
      payout = 0;
    } else {
      result = 'push';
      payout = 0;
    }

    return { playerHandIndex: index, result, payout };
  });
}

/** Apply payouts to balance based on round results */
export function applyPayouts(
  currentBalance: number,
  results: RoundResult[],
  hands: Hand[]
): number {
  let balance = currentBalance;

  for (const roundResult of results) {
    const hand = hands[roundResult.playerHandIndex];
    const bet = hand.bet;

    // Payout calculation:
    // - Win: return bet + profit (bet * 1)
    // - Blackjack: return bet + profit (bet * 1.5)
    // - Push: return bet only (no profit)
    // - Lose: nothing (bet is lost)
    if (roundResult.result === 'win') {
      balance += bet + Math.floor(bet * roundResult.payout); // bet returned + 1:1 profit
    } else if (roundResult.result === 'blackjack') {
      balance += bet + Math.floor(bet * roundResult.payout); // bet returned + 3:2 profit
    } else if (roundResult.result === 'push') {
      balance += bet; // bet returned, no profit
    }
    // lose: nothing added
  }

  return balance;
}

/** Check if player can double down */
export function canPlayerDouble(hand: Hand, balance: number): boolean {
  return (
    hand.cards.length === 2 &&
    !hand.isDoubled &&
    !hand.isStanding &&
    !hand.isBusted &&
    balance >= hand.bet
  );
}

/** Check if player can split */
export function canPlayerSplit(hand: Hand, balance: number): boolean {
  const cards = hand.cards;
  return (
    cards.length === 2 &&
    cards[0].rank === cards[1].rank &&
    balance >= hand.bet &&
    !hand.isDoubled
  );
}
