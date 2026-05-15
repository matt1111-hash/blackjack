import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { INITIAL_BALANCE } from './gameHelpers';
import { mockCard } from '../test-utils';

describe('useGameStore — insurance', () => {
  beforeEach(() => {
    useGameStore.setState({
      balance: INITIAL_BALANCE,
      shoe: useGameStore.getState().shoe.length > 0 ? useGameStore.getState().shoe : [],
      shoePenetration: 0,
      playerHands: [],
      dealerHand: { cards: [], bet: 0, isDoubled: false, isStanding: false, isBusted: false, isBlackjack: false },
      activeHandIndex: 0,
      phase: 'betting',
      currentBet: 0,
      roundResults: null,
      error: null,
    });
  });

  it('prompts for insurance if dealer shows Ace and player can afford it', () => {
    useGameStore.getState().placeBet(100);
    useGameStore.setState({
      shoe: [
        mockCard('10'),
        mockCard('A'),
        mockCard('10'),
        mockCard('9'),
      ]
    });
    useGameStore.getState().deal();
    const state = useGameStore.getState();
    expect(state.phase).toBe('insurance');
  });

  it('buyInsurance handles dealer Blackjack correctly', () => {
    useGameStore.setState({
      balance: 1000,
      currentBet: 100,
      phase: 'insurance',
      dealerHand: {
        cards: [mockCard('A'), mockCard('10')],
        bet: 0,
        isDoubled: false,
        isStanding: false,
        isBusted: false,
        isBlackjack: true,
      },
      playerHands: [{
        cards: [mockCard('10'), mockCard('5')],
        bet: 100,
        isDoubled: false,
        isStanding: false,
        isBusted: false,
        isBlackjack: false,
      }],
      shoe: [],
    });
    useGameStore.getState().buyInsurance();
    const state = useGameStore.getState();
    expect(state.phase).toBe('finished');
    expect(state.balance).toBe(1100);
  });

  it('buyInsurance with no dealer Blackjack continues to playing', () => {
    useGameStore.setState({
      balance: 1000,
      currentBet: 100,
      phase: 'insurance',
      dealerHand: {
        cards: [mockCard('A'), mockCard('5')],
        bet: 0,
        isDoubled: false,
        isStanding: false,
        isBusted: false,
        isBlackjack: false,
      },
      playerHands: [{
        cards: [mockCard('10'), mockCard('5')],
        bet: 100,
        isDoubled: false,
        isStanding: false,
        isBusted: false,
        isBlackjack: false,
      }],
      shoe: [],
    });
    useGameStore.getState().buyInsurance();
    const state = useGameStore.getState();
    expect(state.phase).toBe('playing');
    expect(state.balance).toBe(950);
  });

  it('declineInsurance handles dealer Blackjack correctly', () => {
    useGameStore.setState({
      balance: 1000,
      currentBet: 100,
      phase: 'insurance',
      dealerHand: {
        cards: [mockCard('A'), mockCard('10')],
        bet: 0,
        isDoubled: false,
        isStanding: false,
        isBusted: false,
        isBlackjack: true,
      },
      playerHands: [{
        cards: [mockCard('10'), mockCard('5')],
        bet: 100,
        isDoubled: false,
        isStanding: false,
        isBusted: false,
        isBlackjack: false,
      }],
      shoe: [],
    });
    useGameStore.getState().declineInsurance();
    const state = useGameStore.getState();
    expect(state.phase).toBe('finished');
    expect(state.balance).toBe(1000);
  });

  it('declineInsurance with no dealer Blackjack continues to playing', () => {
    useGameStore.setState({
      balance: 1000,
      currentBet: 100,
      phase: 'insurance',
      dealerHand: {
        cards: [mockCard('A'), mockCard('5')],
        bet: 0,
        isDoubled: false,
        isStanding: false,
        isBusted: false,
        isBlackjack: false,
      },
      playerHands: [{
        cards: [mockCard('10'), mockCard('5')],
        bet: 100,
        isDoubled: false,
        isStanding: false,
        isBusted: false,
        isBlackjack: false,
      }],
      shoe: [],
    });
    useGameStore.getState().declineInsurance();
    const state = useGameStore.getState();
    expect(state.phase).toBe('playing');
    expect(state.balance).toBe(1000);
  });
});

describe('useGameStore — validation edge cases', () => {
  beforeEach(() => {
    useGameStore.setState({
      balance: INITIAL_BALANCE,
      shoe: useGameStore.getState().shoe.length > 0 ? useGameStore.getState().shoe : [],
      shoePenetration: 0,
      playerHands: [],
      dealerHand: { cards: [], bet: 0, isDoubled: false, isStanding: false, isBusted: false, isBlackjack: false },
      activeHandIndex: 0,
      phase: 'betting',
      currentBet: 0,
      roundResults: null,
      error: null,
    });
  });

  it('placeBet rejects zero amount and sets error', () => {
    useGameStore.getState().placeBet(0);
    const state = useGameStore.getState();
    expect(state.currentBet).toBe(0);
    expect(state.error).not.toBeNull();
    expect(state.error!.action).toBe('placeBet');
  });

  it('placeBet rejects negative amount and sets error', () => {
    useGameStore.getState().placeBet(-50);
    const state = useGameStore.getState();
    expect(state.currentBet).toBe(0);
    expect(state.error).not.toBeNull();
  });

  it('deal rejects when no bet placed', () => {
    useGameStore.getState().deal();
    const state = useGameStore.getState();
    expect(state.phase).toBe('betting');
    expect(state.error).not.toBeNull();
  });

  it('hit rejects outside playing phase', () => {
    useGameStore.setState({ phase: 'betting' });
    useGameStore.getState().hit();
    const state = useGameStore.getState();
    expect(state.error).not.toBeNull();
    expect(state.error!.action).toBe('hit');
  });

  it('stand rejects outside playing phase', () => {
    useGameStore.setState({ phase: 'betting' });
    useGameStore.getState().stand();
    const state = useGameStore.getState();
    expect(state.error).not.toBeNull();
  });

  it('clearError resets error state', () => {
    useGameStore.getState().placeBet(0);
    expect(useGameStore.getState().error).not.toBeNull();
    useGameStore.getState().clearError();
    expect(useGameStore.getState().error).toBeNull();
  });

  it('successful action clears previous error', () => {
    useGameStore.getState().placeBet(0);
    expect(useGameStore.getState().error).not.toBeNull();
    useGameStore.getState().placeBet(100);
    expect(useGameStore.getState().error).toBeNull();
    expect(useGameStore.getState().currentBet).toBe(100);
  });

  it('buyInsurance rejects outside insurance phase', () => {
    useGameStore.setState({ phase: 'betting' });
    useGameStore.getState().buyInsurance();
    const state = useGameStore.getState();
    expect(state.error).not.toBeNull();
    expect(state.error!.action).toBe('buyInsurance');
  });

  it('declineInsurance rejects outside insurance phase', () => {
    useGameStore.setState({ phase: 'betting' });
    useGameStore.getState().declineInsurance();
    const state = useGameStore.getState();
    expect(state.error).not.toBeNull();
  });

  it('newRound rejects outside finished phase', () => {
    useGameStore.setState({ phase: 'playing' });
    useGameStore.getState().newRound();
    const state = useGameStore.getState();
    expect(state.phase).toBe('playing');
    expect(state.error).not.toBeNull();
  });
});
