import { describe, it, expect, vi } from 'vitest';
import { createFreshShoe, SHOE_DECKS, handleAllHandsDone } from './gameHelpers';
import * as deckLogic from '../logic/deck';
import type { Card, Hand } from '../types';

// Mock the deck logic to isolate gameHelpers behavior
vi.mock('../logic/deck', async () => {
  const actual = await vi.importActual<typeof import('../logic/deck')>('../logic/deck');
  return {
    ...actual,
    createShoe: vi.fn(actual.createShoe),
    shuffle: vi.fn(actual.shuffle),
  };
});

const mockCard = (rank: Card['rank'], suit: Card['suit'] = 'hearts', faceUp = true): Card => ({
  rank,
  suit,
  faceUp,
});

const createMockHand = (cards: Card[], bet = 100, overrides: Partial<Hand> = {}): Hand => ({
  cards,
  bet,
  isDoubled: false,
  isStanding: false,
  isBusted: false,
  isBlackjack: false,
  ...overrides,
});

describe('gameHelpers', () => {
  describe('createFreshShoe', () => {
    it('should create a shoe with the correct number of decks', () => {
      const createShoeSpy = vi.mocked(deckLogic.createShoe);
      createShoeSpy.mockClear();

      createFreshShoe();

      expect(createShoeSpy).toHaveBeenCalledTimes(1);
      expect(createShoeSpy).toHaveBeenCalledWith(SHOE_DECKS);
    });

    it('should shuffle the created shoe', () => {
      const shuffleSpy = vi.mocked(deckLogic.shuffle);
      shuffleSpy.mockClear();

      createFreshShoe();

      expect(shuffleSpy).toHaveBeenCalledTimes(1);
    });

    it('should return the expected number of cards for the default SHOE_DECKS', () => {
      const shoe = createFreshShoe();

      // 52 cards per deck * 6 decks = 312 cards
      expect(shoe.length).toBe(52 * SHOE_DECKS);
    });
  });

  describe('handleAllHandsDone', () => {
    it('should correctly process a player win', () => {
      const dealerHand = createMockHand([mockCard('10'), mockCard('7')]); // Dealer has 17
      const playerHand = createMockHand([mockCard('10'), mockCard('9')]); // Player has 19
      const shoe: Card[] = [];
      const balance = 1000;

      const result = handleAllHandsDone(dealerHand, shoe, [playerHand], balance);

      expect(result.phase).toBe('finished');
      expect(result.roundResults[0].result).toBe('win');
      expect(result.roundResults[0].payout).toBe(0.5);
      expect(result.balance).toBe(1050);
    });

    it('should correctly process a player loss (bust)', () => {
      const dealerHand = createMockHand([mockCard('10'), mockCard('7')]); // Dealer has 17
      const playerHand = createMockHand([mockCard('10'), mockCard('10'), mockCard('5')], 100, { isBusted: true }); // Player busted 25
      const shoe: Card[] = [];
      const balance = 1000;

      const result = handleAllHandsDone(dealerHand, shoe, [playerHand], balance);

      expect(result.phase).toBe('finished');
      expect(result.roundResults[0].result).toBe('lose');
      expect(result.roundResults[0].payout).toBe(0);
      expect(result.balance).toBe(1000);
    });

    it('should correctly process a player push', () => {
      const dealerHand = createMockHand([mockCard('10'), mockCard('7')]); // Dealer has 17
      const playerHand = createMockHand([mockCard('9'), mockCard('8')]); // Player has 17
      const shoe: Card[] = [];
      const balance = 1000;

      const result = handleAllHandsDone(dealerHand, shoe, [playerHand], balance);

      expect(result.phase).toBe('finished');
      expect(result.roundResults[0].result).toBe('push');
      expect(result.roundResults[0].payout).toBe(0);
      expect(result.balance).toBe(1000);
    });

    it('should correctly process a player blackjack', () => {
      const dealerHand = createMockHand([mockCard('10'), mockCard('7')]); // Dealer has 17
      const playerHand = createMockHand([mockCard('A'), mockCard('K')], 100, { isBlackjack: true }); // Player has BJ
      const shoe: Card[] = [];
      const balance = 1000;

      const result = handleAllHandsDone(dealerHand, shoe, [playerHand], balance);

      expect(result.phase).toBe('finished');
      expect(result.roundResults[0].result).toBe('blackjack');
      expect(result.roundResults[0].payout).toBe(0.75);
      expect(result.balance).toBe(1075);
    });

    it('should handle dealer drawing cards', () => {
      const dealerHand = createMockHand([mockCard('10'), mockCard('5', 'hearts', false)]); // Dealer has 15
      const playerHand = createMockHand([mockCard('10'), mockCard('10')]); // Player has 20
      const shoe = [mockCard('8')]; // Dealer will draw 8 and bust (23)
      const balance = 1000;

      const result = handleAllHandsDone(dealerHand, shoe, [playerHand], balance);

      expect(result.dealerHand.cards.length).toBe(3);
      expect(result.dealerHand.isBusted).toBe(true);
      expect(result.shoe.length).toBe(0);
      expect(result.roundResults[0].result).toBe('win');
      expect(result.balance).toBe(1050);
    });

    it('should correctly process multiple player hands (e.g. split)', () => {
      const dealerHand = createMockHand([mockCard('10'), mockCard('7')]); // Dealer has 17
      const playerHand1 = createMockHand([mockCard('10'), mockCard('10')]); // Hand 1 wins (20)
      const playerHand2 = createMockHand([mockCard('10'), mockCard('5')], 100, { isBusted: true }); // Hand 2 busts
      const playerHand3 = createMockHand([mockCard('9'), mockCard('8')]); // Hand 3 pushes (17)

      const shoe: Card[] = [];
      const balance = 1000;

      const result = handleAllHandsDone(dealerHand, shoe, [playerHand1, playerHand2, playerHand3], balance);

      expect(result.roundResults.length).toBe(3);
      expect(result.roundResults[0].result).toBe('win');
      expect(result.roundResults[1].result).toBe('lose');
      expect(result.roundResults[2].result).toBe('push');

      expect(result.balance).toBe(1050);
    });

    it('should handle double down correctly', () => {
      const dealerHand = createMockHand([mockCard('10'), mockCard('7')]); // Dealer has 17
      const playerHand = createMockHand([mockCard('5'), mockCard('6'), mockCard('10')], 200, { isDoubled: true }); // Player has 21
      const shoe: Card[] = [];
      const balance = 1000;

      const result = handleAllHandsDone(dealerHand, shoe, [playerHand], balance);

      expect(result.roundResults[0].result).toBe('win');
      expect(result.roundResults[0].payout).toBe(1);
      expect(result.balance).toBe(1200);
    });
  });
});
