import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Hand, GamePhase } from '../types';
import { dealCard } from '../logic/deck';
import { isBlackjack, createHand, isBusted } from '../logic/hand';
import {
  INITIAL_BALANCE,
  SHOE_DECKS,
  GameState,
  createFreshShoe,
  dealInitialHands,
  handleAllHandsDone,
} from './gameHelpers';

export const useGameStore = create<GameState>()(
  persist(
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

      // Actions
      placeBet: (amount: number) => {
        const { balance, currentBet } = get();
        if (balance >= amount) {
          set({ balance: balance - amount, currentBet: currentBet + amount });
        }
      },

      deal: () => {
        const { shoe, currentBet, balance } = get();
        if (currentBet === 0 || balance < 0) return;

        const { playerHand, dealerHand, remainingShoe } = dealInitialHands(shoe, currentBet);

        const playerBJ = playerHand.isBlackjack;
        const dealerBJ = isBlackjack(dealerHand.cards);

        let newPhase: GamePhase = 'playing';

        // Check for insurance if dealer shows Ace and player doesn't have Blackjack
        // (If player has BJ, they can't buy insurance, they just get paid 1:1 or push - for simplicity we just skip insurance phase)
        if (dealerHand.cards[0]?.rank === 'A' && balance >= currentBet / 2) {
          newPhase = 'insurance';
        } else if (playerBJ && !dealerBJ) {
          newPhase = 'finished';
        } else if (dealerBJ && !playerBJ) {
          newPhase = 'finished';
        } else if (playerBJ && dealerBJ) {
          newPhase = 'finished';
        }

        set({
          shoe: remainingShoe,
          shoePenetration: SHOE_DECKS * 52 - remainingShoe.length,
          playerHands: [playerHand],
          dealerHand,
          activeHandIndex: 0,
          phase: newPhase,
          roundResults: null,
        });
      },

      buyInsurance: () => {
        const { balance, currentBet, dealerHand, shoe, playerHands } = get();
        const insuranceCost = currentBet / 2;

        if (balance < insuranceCost) return;

        const newBalance = balance - insuranceCost;
        const dealerBJ = isBlackjack(dealerHand.cards);

        if (dealerBJ) {
          // Dealer has BJ: Insurance pays 2:1, so player gets back insuranceCost + 2 * insuranceCost
          // Meaning their balance increases by 2 * insuranceCost from current newBalance.
          // In effect, they lose their main bet but win the insurance bet.
          const finalBalance = newBalance + insuranceCost * 3;
          // Main hand loses, so we resolve round
          const finalState = handleAllHandsDone(dealerHand, shoe, playerHands, finalBalance);
          set(finalState);
        } else {
          // Dealer no BJ: Insurance bet is lost, continue to playing phase
          const playerBJ = playerHands[0]?.isBlackjack;
          if (playerBJ) {
             const finalState = handleAllHandsDone(dealerHand, shoe, playerHands, newBalance);
             set(finalState);
          } else {
             set({
               balance: newBalance,
               phase: 'playing',
             });
          }
        }
      },

      declineInsurance: () => {
        const { dealerHand, shoe, playerHands, balance } = get();
        const dealerBJ = isBlackjack(dealerHand.cards);
        const playerBJ = playerHands[0]?.isBlackjack;

        if (dealerBJ || playerBJ) {
          const finalState = handleAllHandsDone(dealerHand, shoe, playerHands, balance);
          set(finalState);
        } else {
          set({ phase: 'playing' });
        }
      },

      hit: () => {
        const { shoe, playerHands, activeHandIndex, dealerHand, balance } = get();
        const hand = playerHands[activeHandIndex];
        if (!hand || hand.isStanding || hand.isDoubled) return;

        const [newCard, remainingShoe] = dealCard(shoe, true)!;
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
            set({
              shoe: remainingShoe,
              playerHands: newHands,
              activeHandIndex: nextIndex,
            });
          } else {
            // All hands done - run dealer turn directly
            const finalState = handleAllHandsDone(dealerHand, remainingShoe, newHands, balance);
            set(finalState);
          }
        } else {
          set({
            shoe: remainingShoe,
            playerHands: newHands,
          });
        }
      },

      stand: () => {
        const { playerHands, activeHandIndex, shoe, dealerHand, balance } = get();
        const newHands = [...playerHands];
        newHands[activeHandIndex] = { ...newHands[activeHandIndex], isStanding: true };

        const nextIndex = activeHandIndex + 1;
        if (nextIndex < newHands.length) {
          set({
            playerHands: newHands,
            activeHandIndex: nextIndex,
          });
        } else {
          // All hands done - run dealer turn directly
          const finalState = handleAllHandsDone(dealerHand, shoe, newHands, balance);
          set(finalState);
        }
      },

      double: () => {
        const { balance, playerHands, activeHandIndex, shoe, dealerHand } = get();
        const hand = playerHands[activeHandIndex];
        if (!hand || hand.cards.length !== 2 || balance < hand.bet) return;

        const [newCard, remainingShoe] = dealCard(shoe, true)!;
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
          set({
            balance: balance - hand.bet,
            shoe: remainingShoe,
            playerHands: newHands,
            activeHandIndex: nextIndex,
          });
        } else {
          // All hands done - run dealer turn directly
          const finalState = handleAllHandsDone(dealerHand, remainingShoe, newHands, balance - hand.bet);
          set(finalState);
        }
      },

      split: () => {
        const { balance, playerHands, activeHandIndex, shoe } = get();
        const hand = playerHands[activeHandIndex];
        if (!hand || hand.cards.length !== 2) return;

        const [card1, card2] = hand.cards;
        if (card1.rank !== card2.rank) return;

        const [newCard1, shoe1] = dealCard(shoe, true)!;
        const [newCard2, shoe2] = dealCard(shoe1, true)!;

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
          activeHandIndex: activeHandIndex + 1,
        });
      },

      newRound: () => {
        const { shoe } = get();
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
        });
      },

      resetBalance: () => {
        set({ balance: INITIAL_BALANCE });
      },
    }),
    {
      name: 'blackjack-storage',
      partialize: (state) => ({ balance: state.balance }),
    }
  )
);
