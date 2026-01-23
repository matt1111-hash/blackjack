import type { Card, Hand } from '../types';
import { calculateHandValue, isBusted, isBlackjack } from './hand';

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

  let handValue = calculateHandValue(hand.cards);
  let soft = isSoftHand(hand.cards);

  while (shouldDealerHit(handValue, soft)) {
    const [newCard, remaining] = dealOneCard(remainingShoe);
    if (!newCard) break;

    hand.cards.push(newCard);
    remainingShoe = remaining;
    handValue = calculateHandValue(hand.cards);
    soft = isSoftHand(hand.cards);
  }

  hand.isBusted = isBusted(hand.cards);
  hand.isStanding = true; // Dealer is always "done" after playing

  return { hand, remainingShoe };
}

function shouldDealerHit(value: number, soft: boolean): boolean {
  if (soft) {
    // Soft 17: hit (since dealer stands on soft 17 is false)
    return value < DEALER_STAND_VALUE;
  }
  // Hard hand: hit if less than 17
  return value < DEALER_STAND_VALUE;
}

function isSoftHand(cards: Card[]): boolean {
  let value = 0;
  let aces = 0;

  for (const card of cards) {
    value += card.rank === 'A' ? 11 : ['K', 'Q', 'J'].includes(card.rank) ? 10 : parseInt(card.rank, 10);
    if (card.rank === 'A') aces++;
  }

  while (value > 21 && aces > 0) {
    value -= 10;
    aces--;
  }

  return aces > 0 && value <= 21;
}

function dealOneCard(shoe: Card[]): [Card, Card[]] | undefined {
  if (shoe.length === 0) return undefined;
  const [card, ...remaining] = shoe;
  return [{ ...card, faceUp: true }, remaining];
}

/** Calculate round results for all player hands vs dealer */
export function calculateResults(
  playerHands: Hand[],
  dealerHand: Hand
): RoundResult[] {
  const dealerValue = calculateHandValue(dealerHand.cards);
  const dealerBJ = isBlackjack(dealerHand.cards);
  const dealerBusted = isBusted(dealerHand.cards);

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
      payout = hand.isDoubled ? 1 : 0.5;
    } else if (playerBJ && !dealerBJ) {
      result = 'blackjack';
      payout = 0.75; // 3:2 payout on top of returned bet
    } else if (dealerBJ && !playerBJ) {
      result = 'lose';
      payout = 0;
    } else if (playerValue > dealerValue) {
      result = 'win';
      payout = hand.isDoubled ? 1 : 0.5;
    } else if (playerValue < dealerValue) {
      result = 'lose';
      payout = 0;
    } else {
      result = 'push';
      payout = 0; // Return bet, no profit
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

    // payout is the profit multiplier (0.5 = return bet + 50% profit, 0.75 = 3:2)
    if (roundResult.result === 'blackjack') {
      balance += Math.floor(bet * roundResult.payout);
    } else {
      balance += bet * roundResult.payout;
    }
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
