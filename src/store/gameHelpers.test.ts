import { describe, it, expect, vi } from 'vitest';
import { createFreshShoe, SHOE_DECKS } from './gameHelpers';
import * as deckLogic from '../logic/deck';

// Mock the deck logic to isolate gameHelpers behavior
vi.mock('../logic/deck', async () => {
  const actual = await vi.importActual<typeof import('../logic/deck')>('../logic/deck');
  return {
    ...actual,
    createShoe: vi.fn(actual.createShoe),
    shuffle: vi.fn(actual.shuffle),
  };
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
});
