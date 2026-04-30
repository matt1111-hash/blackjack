import type { GameState } from './gameHelpers';

type StateSlice = Pick<GameState, 'balance' | 'currentBet' | 'phase' | 'playerHands' | 'activeHandIndex' | 'dealerHand'>;

export function validatePlaceBet(state: StateSlice, amount: number): string | null {
  if (state.phase !== 'betting') return 'Cannot place bet outside betting phase';
  if (amount <= 0) return 'Bet amount must be positive';
  if (state.balance < amount) return 'Insufficient balance';
  return null;
}

export function validateDeal(state: StateSlice): string | null {
  if (state.phase !== 'betting') return 'Cannot deal outside betting phase';
  if (state.currentBet === 0) return 'Place a bet before dealing';
  return null;
}

export function validateHit(state: StateSlice): string | null {
  if (state.phase !== 'playing') return 'Cannot hit outside playing phase';
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return 'No active hand';
  if (hand.isStanding) return 'Hand is already standing';
  if (hand.isDoubled) return 'Cannot hit after double';
  return null;
}

export function validateStand(state: StateSlice): string | null {
  if (state.phase !== 'playing') return 'Cannot stand outside playing phase';
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return 'No active hand';
  return null;
}

export function validateDouble(state: StateSlice): string | null {
  if (state.phase !== 'playing') return 'Cannot double outside playing phase';
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return 'No active hand';
  if (hand.cards.length !== 2) return 'Can only double with exactly two cards';
  if (state.balance < hand.bet) return 'Insufficient balance to double';
  return null;
}

export function validateSplit(state: StateSlice): string | null {
  if (state.phase !== 'playing') return 'Cannot split outside playing phase';
  const hand = state.playerHands[state.activeHandIndex];
  if (!hand) return 'No active hand';
  if (hand.cards.length !== 2) return 'Can only split with exactly two cards';
  if (hand.cards[0].rank !== hand.cards[1].rank) return 'Cards must have matching ranks to split';
  if (state.balance < hand.bet) return 'Insufficient balance to split';
  return null;
}

export function validateBuyInsurance(state: StateSlice): string | null {
  if (state.phase !== 'insurance') return 'Cannot buy insurance outside insurance phase';
  const insuranceCost = state.currentBet / 2;
  if (state.balance < insuranceCost) return 'Insufficient balance for insurance';
  return null;
}

export function validateDeclineInsurance(state: StateSlice): string | null {
  if (state.phase !== 'insurance') return 'Cannot decline insurance outside insurance phase';
  return null;
}

export function validateNewRound(state: StateSlice): string | null {
  if (state.phase !== 'finished') return 'Cannot start new round before round is finished';
  return null;
}
