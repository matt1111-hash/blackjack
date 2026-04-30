import { describe, it, expect } from 'vitest';
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
import type { GameState } from './gameHelpers';
import { createHand } from '../logic/hand';
import { createShoe } from '../logic/deck';

function makeState(overrides: Partial<GameState> = {}): Pick<GameState, 'balance' | 'currentBet' | 'phase' | 'playerHands' | 'activeHandIndex' | 'dealerHand'> {
  return {
    balance: 5000,
    currentBet: 0,
    phase: 'betting',
    playerHands: [],
    activeHandIndex: 0,
    dealerHand: createHand(0),
    ...overrides,
  };
}

describe('validatePlaceBet', () => {
  it('returns null for valid bet', () => {
    expect(validatePlaceBet(makeState({ balance: 5000 }), 100)).toBeNull();
  });

  it('rejects zero amount', () => {
    expect(validatePlaceBet(makeState(), 0)).toContain('positive');
  });

  it('rejects negative amount', () => {
    expect(validatePlaceBet(makeState(), -100)).toContain('positive');
  });

  it('rejects insufficient balance', () => {
    expect(validatePlaceBet(makeState({ balance: 50 }), 100)).toContain('Insufficient');
  });

  it('rejects outside betting phase', () => {
    expect(validatePlaceBet(makeState({ phase: 'playing' }), 100)).toContain('betting phase');
  });
});

describe('validateDeal', () => {
  it('returns null for valid deal', () => {
    expect(validateDeal(makeState({ currentBet: 100 }))).toBeNull();
  });

  it('rejects zero bet', () => {
    expect(validateDeal(makeState({ currentBet: 0 }))).toContain('Place a bet');
  });

  it('rejects outside betting phase', () => {
    expect(validateDeal(makeState({ phase: 'playing', currentBet: 100 }))).toContain('betting phase');
  });
});

describe('validateHit', () => {
  it('returns null for valid hit', () => {
    const hand = { ...createHand(100), cards: createShoe(1).slice(0, 2) };
    expect(validateHit(makeState({ phase: 'playing', playerHands: [hand] }))).toBeNull();
  });

  it('rejects outside playing phase', () => {
    expect(validateHit(makeState({ phase: 'betting' }))).toContain('playing phase');
  });

  it('rejects standing hand', () => {
    const hand = { ...createHand(100), cards: createShoe(1).slice(0, 2), isStanding: true };
    expect(validateHit(makeState({ phase: 'playing', playerHands: [hand] }))).toContain('standing');
  });
});

describe('validateStand', () => {
  it('returns null for valid stand', () => {
    const hand = { ...createHand(100), cards: createShoe(1).slice(0, 2) };
    expect(validateStand(makeState({ phase: 'playing', playerHands: [hand] }))).toBeNull();
  });

  it('rejects outside playing phase', () => {
    expect(validateStand(makeState({ phase: 'betting' }))).toContain('playing phase');
  });
});

describe('validateDouble', () => {
  it('returns null for valid double', () => {
    const hand = { ...createHand(100), cards: createShoe(1).slice(0, 2) };
    expect(validateDouble(makeState({ phase: 'playing', playerHands: [hand], balance: 500 }))).toBeNull();
  });

  it('rejects insufficient balance', () => {
    const hand = { ...createHand(100), cards: createShoe(1).slice(0, 2) };
    expect(validateDouble(makeState({ phase: 'playing', playerHands: [hand], balance: 50 }))).toContain('Insufficient');
  });

  it('rejects non-two-card hand', () => {
    const hand = { ...createHand(100), cards: createShoe(1).slice(0, 3) };
    expect(validateDouble(makeState({ phase: 'playing', playerHands: [hand], balance: 500 }))).toContain('two cards');
  });
});

describe('validateSplit', () => {
  it('returns null for valid split', () => {
    const shoe = createShoe(1);
    const hand = { ...createHand(100), cards: [shoe[0], { ...shoe[0] }] };
    expect(validateSplit(makeState({ phase: 'playing', playerHands: [hand], balance: 500 }))).toBeNull();
  });

  it('rejects mismatched ranks', () => {
    const shoe = createShoe(1);
    const hand = { ...createHand(100), cards: [shoe[0], shoe[1]] };
    expect(validateSplit(makeState({ phase: 'playing', playerHands: [hand], balance: 500 }))).toContain('matching ranks');
  });

  it('rejects insufficient balance', () => {
    const shoe = createShoe(1);
    const hand = { ...createHand(100), cards: [shoe[0], { ...shoe[0] }] };
    expect(validateSplit(makeState({ phase: 'playing', playerHands: [hand], balance: 50 }))).toContain('Insufficient');
  });
});

describe('validateBuyInsurance', () => {
  it('returns null for valid insurance', () => {
    expect(validateBuyInsurance(makeState({ phase: 'insurance', currentBet: 100, balance: 500 }))).toBeNull();
  });

  it('rejects outside insurance phase', () => {
    expect(validateBuyInsurance(makeState({ phase: 'playing' }))).toContain('insurance phase');
  });

  it('rejects insufficient balance', () => {
    expect(validateBuyInsurance(makeState({ phase: 'insurance', currentBet: 200, balance: 50 }))).toContain('Insufficient');
  });
});

describe('validateDeclineInsurance', () => {
  it('returns null for valid decline', () => {
    expect(validateDeclineInsurance(makeState({ phase: 'insurance' }))).toBeNull();
  });

  it('rejects outside insurance phase', () => {
    expect(validateDeclineInsurance(makeState({ phase: 'playing' }))).toContain('insurance phase');
  });
});

describe('validateNewRound', () => {
  it('returns null for valid new round', () => {
    expect(validateNewRound(makeState({ phase: 'finished' }))).toBeNull();
  });

  it('rejects outside finished phase', () => {
    expect(validateNewRound(makeState({ phase: 'playing' }))).toContain('finished');
  });
});
