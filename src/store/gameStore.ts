import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Card, Hand, GamePhase } from '../types';
import { createShoe, shuffle, dealCard } from '../logic/deck';
import { calculateHandValue, isBlackjack, createHand, isBusted } from '../logic/hand';

const INITIAL_BALANCE = 5000;
const SHOE_DECKS = 6;

interface GameState {
  // Balance
  balance: number;

  // Shoe
  shoe: Card[];
  shoePenetration: number; // cards dealt / total cards

  // Hands
  playerHands: Hand[];
  dealerHand: Hand;
  activeHandIndex: number;

  // Game phase
  phase: GamePhase;

  // Current bet
  currentBet: number;

  // Actions
  placeBet: (amount: number) => void;
  deal: () => void;
  hit: () => void;
  stand: () => void;
  double: () => void;
  split: () => void;
  newRound: () => void;
  resetBalance: () => void;
}

function createFreshShoe(): Card[] {
  return shuffle(createShoe(SHOE_DECKS));
}

function dealInitialHands(shoe: Card[], bet: number): { playerHand: Hand; dealerHand: Hand; remainingShoe: Card[] } {
  const [playerCard1, shoe1] = dealCard(shoe, true)!;
  const [dealerCard1, shoe2] = dealCard(shoe1, true)!;
  const [playerCard2, shoe3] = dealCard(shoe2, true)!;
  const [dealerCard2, remainingShoe] = dealCard(shoe3, false)!; // face down

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

        // Check for immediate blackjack
        const playerBJ = playerHand.isBlackjack;
        const dealerBJ = isBlackjack(dealerHand.cards);
        const dealerValue = calculateHandValue([dealerHand.cards[0]]); // Only face-up card

        let newPhase: GamePhase = 'playing';

        if (playerBJ && !dealerBJ) {
          newPhase = 'finished';
        } else if (dealerBJ && !playerBJ) {
          newPhase = 'finished';
        } else if (playerBJ && dealerBJ) {
          newPhase = 'finished';
        } else if (dealerValue === 10 || dealerValue === 11) {
          // Dealer might have blackjack, check on stand
          newPhase = 'playing';
        }

        set({
          shoe: remainingShoe,
          shoePenetration: SHOE_DECKS * 52 - remainingShoe.length,
          playerHands: [playerHand],
          dealerHand,
          activeHandIndex: 0,
          phase: newPhase,
          // Note: bet remains until round ends
        });
      },

      hit: () => {
        const { shoe, playerHands, activeHandIndex } = get();
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

        // Check if busted
        if (newHand.isBusted) {
          // Move to next hand or dealer turn
          const nextIndex = activeHandIndex + 1;
          if (nextIndex < newHands.length) {
            set({
              shoe: remainingShoe,
              playerHands: newHands,
              activeHandIndex: nextIndex,
            });
          } else {
            // All hands done, dealer turn
            set({
              shoe: remainingShoe,
              playerHands: newHands,
              phase: 'dealerTurn',
            });
          }
        } else {
          set({
            shoe: remainingShoe,
            playerHands: newHands,
          });
        }
      },

      stand: () => {
        const { playerHands, activeHandIndex } = get();
        const newHands = [...playerHands];
        newHands[activeHandIndex] = { ...newHands[activeHandIndex], isStanding: true };

        const nextIndex = activeHandIndex + 1;
        if (nextIndex < newHands.length) {
          set({
            playerHands: newHands,
            activeHandIndex: nextIndex,
          });
        } else {
          // All hands done, dealer turn
          set({
            playerHands: newHands,
            phase: 'dealerTurn',
          });
        }
      },

      double: () => {
        const { balance, playerHands, activeHandIndex, shoe } = get();
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

        // Move to next hand or dealer turn
        const nextIndex = activeHandIndex + 1;
        if (nextIndex < newHands.length) {
          set({
            balance: balance - hand.bet,
            shoe: remainingShoe,
            playerHands: newHands,
            activeHandIndex: nextIndex,
          });
        } else {
          set({
            balance: balance - hand.bet,
            shoe: remainingShoe,
            playerHands: newHands,
            phase: 'dealerTurn',
          });
        }
      },

      split: () => {
        const { balance, playerHands, activeHandIndex, shoe } = get();
        const hand = playerHands[activeHandIndex];
        if (!hand || hand.cards.length !== 2) return;

        const [card1, card2] = hand.cards;
        if (card1.rank !== card2.rank) return; // Can only split same rank

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
          activeHandIndex: activeHandIndex + 1, // Stay on first split hand
        });
      },

      newRound: () => {
        const { shoe } = get();
        // Reshuffle if penetration reached (~75% = 1.5 decks left = 78 cards)
        const cardsRemaining = shoe.length;
        const reshuffleThreshold = SHOE_DECKS * 52 * 0.25; // 25% remaining = reshuffle

        const newShoe = cardsRemaining < reshuffleThreshold ? createFreshShoe() : shoe;

        set({
          shoe: newShoe,
          shoePenetration: 0,
          playerHands: [],
          dealerHand: createHand(0),
          activeHandIndex: 0,
          phase: 'betting',
          currentBet: 0,
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
