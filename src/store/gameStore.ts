import { create } from 'zustand';
import type { Hand, GamePhase, GameError } from '../types';
import type { GameState } from './gameHelpers';
import { dealCardOrThrow } from '../logic/deck';
import { isBlackjack, createHand, isBusted } from '../logic/hand';
import { calculateResults, applyPayouts, type RoundResult } from '../logic/rules';
import {
  INITIAL_BALANCE,
  SHOE_DECKS,
  createFreshShoe,
  dealInitialHands,
  handleAllHandsDone,
} from './gameHelpers';
import {
  validatePlaceBet,
  validateDeal,
  validateHit,
  validateStand,
  validateDouble,
  validateSplit,
  validateBuyInsurance,
  validateDeclineInsurance,
  validateNewRound,
} from './validators';

function setError(action: string, message: string): { error: GameError } {
  return { error: { action, message } };
}

export const useGameStore = create<GameState>()(
  (set, get) => ({
    // Initial state
    balance: INITIAL_BALANCE,
      shoe: createFreshShoe(),
      shoePenetration: 0,
      playerHands: [],
      dealerHand: createHand(0),
      activeHandIndex: 0,
      phase: 'betting',
      currentBet: 0,
      roundResults: null,
      error: null,

      // Actions
      placeBet: (amount: number) => {
        const state = get();
        const err = validatePlaceBet(state, amount);
        if (err) { set(setError('placeBet', err)); return; }
        set({ balance: state.balance - amount, currentBet: state.currentBet + amount, error: null });
      },

      deal: () => {
        const state = get();
        const err = validateDeal(state);
        if (err) { set(setError('deal', err)); return; }

        const { playerHand, dealerHand, remainingShoe } = dealInitialHands(state.shoe, state.currentBet);

        const playerBJ = playerHand.isBlackjack;
        const dealerBJ = isBlackjack(dealerHand.cards);

        let newPhase: GamePhase = 'playing';
        let results: RoundResult[] | null = null;
        let newBalance = state.balance;

        if (dealerHand.cards[0]?.rank === 'A' && state.balance >= state.currentBet / 2) {
          newPhase = 'insurance';
        } else if (playerBJ && !dealerBJ) {
          newPhase = 'finished';
          dealerHand.cards[1].faceUp = true;
          results = calculateResults([playerHand], dealerHand);
          newBalance = applyPayouts(state.balance, results, [playerHand]);
        } else if (dealerBJ && !playerBJ) {
          newPhase = 'finished';
          dealerHand.cards[1].faceUp = true;
          results = calculateResults([playerHand], dealerHand);
          newBalance = applyPayouts(state.balance, results, [playerHand]);
        } else if (playerBJ && dealerBJ) {
          newPhase = 'finished';
          dealerHand.cards[1].faceUp = true;
          results = calculateResults([playerHand], dealerHand);
          newBalance = applyPayouts(state.balance, results, [playerHand]);
        }

        set({
          shoe: remainingShoe,
          shoePenetration: SHOE_DECKS * 52 - remainingShoe.length,
          playerHands: [playerHand],
          dealerHand,
          activeHandIndex: 0,
          phase: newPhase,
          roundResults: results,
          balance: newBalance,
          error: null,
        });
      },

      buyInsurance: () => {
        const state = get();
        const err = validateBuyInsurance(state);
        if (err) { set(setError('buyInsurance', err)); return; }

        const { balance, currentBet, dealerHand, shoe, playerHands } = state;
        const insuranceCost = currentBet / 2;
        const newBalance = balance - insuranceCost;
        const dealerBJ = isBlackjack(dealerHand.cards);

        if (dealerBJ) {
          const finalBalance = newBalance + insuranceCost * 3;
          const finalState = handleAllHandsDone(dealerHand, shoe, playerHands, finalBalance);
          set({ ...finalState, error: null });
        } else {
          const playerBJ = playerHands[0]?.isBlackjack;
          if (playerBJ) {
             const finalState = handleAllHandsDone(dealerHand, shoe, playerHands, newBalance);
             set({ ...finalState, error: null });
          } else {
             set({ balance: newBalance, phase: 'playing', error: null });
          }
        }
      },

      declineInsurance: () => {
        const state = get();
        const err = validateDeclineInsurance(state);
        if (err) { set(setError('declineInsurance', err)); return; }

        const { dealerHand, shoe, playerHands, balance } = state;
        const dealerBJ = isBlackjack(dealerHand.cards);
        const playerBJ = playerHands[0]?.isBlackjack;

        if (dealerBJ || playerBJ) {
          const finalState = handleAllHandsDone(dealerHand, shoe, playerHands, balance);
          set({ ...finalState, error: null });
        } else {
          set({ phase: 'playing', error: null });
        }
      },

      hit: () => {
        const state = get();
        const err = validateHit(state);
        if (err) { set(setError('hit', err)); return; }

        const { shoe, playerHands, activeHandIndex, dealerHand, balance } = state;
        const hand = playerHands[activeHandIndex];

        const [newCard, remainingShoe] = dealCardOrThrow(shoe, true);
        const newHand = {
          ...hand,
          cards: [...hand.cards, newCard],
          isBusted: isBusted([...hand.cards, newCard]),
          isStanding: isBusted([...hand.cards, newCard]),
        };

        const newHands = [...playerHands];
        newHands[activeHandIndex] = newHand;

        if (newHand.isBusted) {
          const nextIndex = activeHandIndex + 1;
          if (nextIndex < newHands.length) {
            set({ shoe: remainingShoe, playerHands: newHands, activeHandIndex: nextIndex, error: null });
          } else {
            const finalState = handleAllHandsDone(dealerHand, remainingShoe, newHands, balance);
            set({ ...finalState, error: null });
          }
        } else {
          set({ shoe: remainingShoe, playerHands: newHands, error: null });
        }
      },

      stand: () => {
        const state = get();
        const err = validateStand(state);
        if (err) { set(setError('stand', err)); return; }

        const { playerHands, activeHandIndex, shoe, dealerHand, balance } = state;
        const newHands = [...playerHands];
        newHands[activeHandIndex] = { ...newHands[activeHandIndex], isStanding: true };

        const nextIndex = activeHandIndex + 1;
        if (nextIndex < newHands.length) {
          set({ playerHands: newHands, activeHandIndex: nextIndex, error: null });
        } else {
          const finalState = handleAllHandsDone(dealerHand, shoe, newHands, balance);
          set({ ...finalState, error: null });
        }
      },

      double: () => {
        const state = get();
        const err = validateDouble(state);
        if (err) { set(setError('double', err)); return; }

        const { balance, playerHands, activeHandIndex, shoe, dealerHand } = state;
        const hand = playerHands[activeHandIndex];

        const [newCard, remainingShoe] = dealCardOrThrow(shoe, true);
        const newHand = {
          ...hand,
          cards: [...hand.cards, newCard],
          bet: hand.bet * 2,
          isDoubled: true,
          isStanding: true,
          isBusted: isBusted([...hand.cards, newCard]),
        };

        const newHands = [...playerHands];
        newHands[activeHandIndex] = newHand;

        const nextIndex = activeHandIndex + 1;
        if (nextIndex < newHands.length) {
          set({ balance: balance - hand.bet, shoe: remainingShoe, playerHands: newHands, activeHandIndex: nextIndex, error: null });
        } else {
          const finalState = handleAllHandsDone(dealerHand, remainingShoe, newHands, balance - hand.bet);
          set({ ...finalState, error: null });
        }
      },

      split: () => {
        const state = get();
        const err = validateSplit(state);
        if (err) { set(setError('split', err)); return; }

        const { balance, playerHands, activeHandIndex, shoe } = state;
        const hand = playerHands[activeHandIndex];
        const [card1, card2] = hand.cards;

        const [newCard1, shoe1] = dealCardOrThrow(shoe, true);
        const [newCard2, shoe2] = dealCardOrThrow(shoe1, true);

        const newHand1: Hand = {
          cards: [card1, newCard1],
          bet: hand.bet,
          isDoubled: false,
          isStanding: false,
          isBusted: false,
          isBlackjack: false,
        };

        const newHand2: Hand = {
          cards: [card2, newCard2],
          bet: hand.bet,
          isDoubled: false,
          isStanding: false,
          isBusted: false,
          isBlackjack: false,
        };

        const newHands = [
          ...playerHands.slice(0, activeHandIndex),
          newHand1,
          newHand2,
          ...playerHands.slice(activeHandIndex + 1),
        ];

        set({
          balance: balance - hand.bet,
          shoe: shoe2,
          playerHands: newHands,
          activeHandIndex: activeHandIndex,
          error: null,
        });
      },

      newRound: () => {
        const state = get();
        const err = validateNewRound(state);
        if (err) { set(setError('newRound', err)); return; }

        const { shoe } = state;
        const cardsRemaining = shoe.length;
        const reshuffleThreshold = SHOE_DECKS * 52 * 0.25;

        const newShoe = cardsRemaining < reshuffleThreshold ? createFreshShoe() : shoe;

        set({
          shoe: newShoe,
          shoePenetration: 0,
          playerHands: [],
          dealerHand: createHand(0),
          activeHandIndex: 0,
          phase: 'betting',
          currentBet: 0,
          roundResults: null,
          error: null,
        });
      },

      resetBalance: () => {
        set({ balance: INITIAL_BALANCE });
      },

      clearError: () => {
        set({ error: null });
      },
  })
);
