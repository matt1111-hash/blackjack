import { beforeEach, describe, expect, it } from 'vitest';
import { useGameStore } from './gameStore';
import { INITIAL_BALANCE } from './gameHelpers';
import { validateClearBet } from './validators';

describe('validateClearBet', () => {
  const slice = (phase: 'betting' | 'playing', currentBet: number) => ({
    phase,
    currentBet,
    balance: INITIAL_BALANCE,
    playerHands: [],
    activeHandIndex: 0,
    dealerHand: { cards: [], bet: 0, isDoubled: false, isStanding: false, isBusted: false, isBlackjack: false },
  });

  it('accepts clearing a bet during the betting phase', () => {
    expect(validateClearBet(slice('betting', 100))).toBeNull();
  });

  it('rejects clearing outside the betting phase', () => {
    expect(validateClearBet(slice('playing', 100))).toBe('Cannot clear bet outside betting phase');
  });

  it('rejects clearing when there is no bet', () => {
    expect(validateClearBet(slice('betting', 0))).toBe('No bet to clear');
  });
});

describe('useGameStore.clearBet', () => {
  beforeEach(() => {
    useGameStore.setState({
      balance: INITIAL_BALANCE,
      currentBet: 0,
      playerHands: [],
      dealerHand: { cards: [], bet: 0, isDoubled: false, isStanding: false, isBusted: false, isBlackjack: false },
      activeHandIndex: 0,
      phase: 'betting',
      roundResults: null,
      error: null,
    });
  });

  it('refunds the balance and resets the current bet', () => {
    useGameStore.getState().placeBet(300);

    useGameStore.getState().clearBet();

    const state = useGameStore.getState();
    expect(state.currentBet).toBe(0);
    expect(state.balance).toBe(INITIAL_BALANCE);
    expect(state.error).toBeNull();
  });

  it('clears an accumulated bet chip by chip', () => {
    const { placeBet } = useGameStore.getState();
    placeBet(100);
    placeBet(25);
    placeBet(5);

    useGameStore.getState().clearBet();

    expect(useGameStore.getState().balance).toBe(INITIAL_BALANCE);
    expect(useGameStore.getState().currentBet).toBe(0);
  });

  it('sets an error when there is nothing to clear', () => {
    useGameStore.getState().clearBet();

    const state = useGameStore.getState();
    expect(state.error?.action).toBe('clearBet');
    expect(state.error?.message).toBe('No bet to clear');
  });

  it('refuses to clear outside the betting phase', () => {
    useGameStore.getState().placeBet(100);
    useGameStore.setState({ phase: 'playing' });

    useGameStore.getState().clearBet();

    const state = useGameStore.getState();
    expect(state.currentBet).toBe(100);
    expect(state.error?.action).toBe('clearBet');
  });
});
