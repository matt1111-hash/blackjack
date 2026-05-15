import { describe, it, expect, beforeEach } from 'vitest';
import { useGameStore } from './gameStore';
import { INITIAL_BALANCE } from './gameHelpers';
import { mockCard } from '../test-utils';

describe('useGameStore', () => {
  beforeEach(() => {
    // Reset Zustand store data fields (keep actions intact)
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

  it('initializes with correct default state', () => {
    const state = useGameStore.getState();
    expect(state.balance).toBe(INITIAL_BALANCE);
    expect(state.phase).toBe('betting');
    expect(state.currentBet).toBe(0);
  });

  it('placeBet updates balance and currentBet', () => {
    useGameStore.getState().placeBet(100);
    const state = useGameStore.getState();
    expect(state.balance).toBe(INITIAL_BALANCE - 100);
    expect(state.currentBet).toBe(100);
  });

  it('placeBet ignores if balance is insufficient', () => {
    useGameStore.getState().placeBet(INITIAL_BALANCE + 100);
    const state = useGameStore.getState();
    expect(state.balance).toBe(INITIAL_BALANCE);
    expect(state.currentBet).toBe(0);
  });

  it('resetBalance restores INITIAL_BALANCE', () => {
    useGameStore.getState().placeBet(100);
    useGameStore.getState().resetBalance();
    expect(useGameStore.getState().balance).toBe(INITIAL_BALANCE);
  });

  describe('deal', () => {
    it('does not deal if currentBet is 0', () => {
      useGameStore.getState().deal();
      expect(useGameStore.getState().phase).toBe('betting');
    });

    it('deals initial hands and transitions to playing phase', () => {
      useGameStore.getState().placeBet(100);
      // Ensure we don't accidentally get a blackjack
      useGameStore.setState({
        shoe: [
          mockCard('2'), // player
          mockCard('3'), // dealer
          mockCard('4'), // player
          mockCard('5'), // dealer
        ]
      });
      useGameStore.getState().deal();
      const state = useGameStore.getState();
      expect(state.phase).toBe('playing');
      expect(state.playerHands.length).toBe(1);
      expect(state.dealerHand.cards.length).toBe(2);
    });

    it('transitions to finished phase immediately if player has Blackjack and dealer does not', () => {
      useGameStore.getState().placeBet(100);
      useGameStore.setState({
        shoe: [
          mockCard('A'), // player
          mockCard('2'), // dealer
          mockCard('K'), // player
          mockCard('3'), // dealer
        ]
      });
      useGameStore.getState().deal();
      const state = useGameStore.getState();
      expect(state.phase).toBe('finished');
    });

    it('transitions to finished phase immediately if dealer has Blackjack and player does not and dealer does not show Ace', () => {
      useGameStore.getState().placeBet(100);
      useGameStore.setState({
        shoe: [
          mockCard('2'), // player
          mockCard('10'), // dealer
          mockCard('3'), // player
          mockCard('A'), // dealer
        ]
      });
      useGameStore.getState().deal();
      const state = useGameStore.getState();
      expect(state.phase).toBe('finished');
    });
  });

  describe('playing phase actions', () => {
    beforeEach(() => {
      useGameStore.getState().placeBet(100);
      useGameStore.setState({
        playerHands: [{
          cards: [mockCard('10'), mockCard('5')],
          bet: 100,
          isDoubled: false,
          isStanding: false,
          isBusted: false,
          isBlackjack: false,
        }],
        dealerHand: {
          cards: [mockCard('10'), mockCard('7')],
          bet: 0,
          isDoubled: false,
          isStanding: false,
          isBusted: false,
          isBlackjack: false,
        },
        shoe: [mockCard('2'), mockCard('3')],
        activeHandIndex: 0,
        phase: 'playing',
      });
    });

    it('hit adds a card to the player hand', () => {
      useGameStore.getState().hit();
      const state = useGameStore.getState();
      expect(state.playerHands[0].cards.length).toBe(3);
      expect(state.playerHands[0].isBusted).toBe(false);
      expect(state.phase).toBe('playing');
    });

    it('hit and bust transitions to next hand or finished phase', () => {
      useGameStore.setState({ shoe: [mockCard('10')] });
      useGameStore.getState().hit();
      const state = useGameStore.getState();
      expect(state.playerHands[0].isBusted).toBe(true);
      expect(state.phase).toBe('finished');
    });

    it('stand moves to next hand or finishes game', () => {
      useGameStore.getState().stand();
      const state = useGameStore.getState();
      expect(state.playerHands[0].isStanding).toBe(true);
      expect(state.phase).toBe('finished');
    });

    it('double doubles the bet, hits once, and stands', () => {
      useGameStore.getState().double();
      const state = useGameStore.getState();
      expect(state.playerHands[0].bet).toBe(200);
      expect(state.playerHands[0].isDoubled).toBe(true);
      expect(state.playerHands[0].cards.length).toBe(3);
      expect(state.phase).toBe('finished');
    });

    it('split creates two hands and keeps the first split hand active', () => {
      useGameStore.setState({
        playerHands: [{
          cards: [mockCard('8'), mockCard('8', 'spades')],
          bet: 100,
          isDoubled: false,
          isStanding: false,
          isBusted: false,
          isBlackjack: false,
        }],
        shoe: [mockCard('2'), mockCard('3')],
      });

      useGameStore.getState().split();
      const state = useGameStore.getState();
      expect(state.playerHands.length).toBe(2);
      expect(state.playerHands[0].cards).toEqual([mockCard('8'), mockCard('2')]);
      expect(state.playerHands[1].cards).toEqual([mockCard('8', 'spades'), mockCard('3')]);
      expect(state.activeHandIndex).toBe(0);
    });
  });

  describe('newRound', () => {
    it('resets phase and hands', () => {
      useGameStore.setState({ phase: 'finished', currentBet: 100 });
      useGameStore.getState().newRound();
      const state = useGameStore.getState();
      expect(state.phase).toBe('betting');
      expect(state.playerHands.length).toBe(0);
      expect(state.currentBet).toBe(0);
    });
  });
});
