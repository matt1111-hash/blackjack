import { describe, expect, it } from 'vitest';
import {
  formatDealerLine,
  resolveDealerLine,
  resolveDealerLineKey,
  type DealerLineContext,
} from './dealerLines';
import type { GamePhase } from '../types';

const BASE: DealerLineContext = {
  phase: 'betting',
  roundResult: null,
  dealerBusted: false,
  playerBusted: false,
  playerBlackjack: false,
  dealerValue: null,
  reshuffled: false,
};

describe('resolveDealerLineKey', () => {
  it('announces a new shoe after reshuffle during betting', () => {
    expect(resolveDealerLineKey({ ...BASE, reshuffled: true })).toBe('newShoe');
  });

  it('asks for bets during the betting phase', () => {
    expect(resolveDealerLineKey(BASE)).toBe('placeBets');
  });

  it('opens insurance during the insurance phase', () => {
    expect(resolveDealerLineKey({ ...BASE, phase: 'insurance' })).toBe('insuranceOpen');
  });

  it('closes betting during the playing phase', () => {
    expect(resolveDealerLineKey({ ...BASE, phase: 'playing' })).toBe('noMoreBets');
  });

  it('celebrates a natural blackjack first', () => {
    expect(
      resolveDealerLineKey({ ...BASE, phase: 'finished', roundResult: 'blackjack' }),
    ).toBe('blackjackPays');
  });

  it('announces a dealer bust before other results', () => {
    expect(
      resolveDealerLineKey({
        ...BASE,
        phase: 'finished',
        roundResult: 'win',
        dealerBusted: true,
      }),
    ).toBe('dealerBust');
  });

  it('calls out a player bust on loss', () => {
    expect(
      resolveDealerLineKey({
        ...BASE,
        phase: 'finished',
        roundResult: 'lose',
        playerBusted: true,
      }),
    ).toBe('playerBust');
  });

  it('maps plain win, lose and push outcomes', () => {
    expect(resolveDealerLineKey({ ...BASE, phase: 'finished', roundResult: 'win' })).toBe('playerWins');
    expect(resolveDealerLineKey({ ...BASE, phase: 'finished', roundResult: 'lose' })).toBe('houseWins');
    expect(resolveDealerLineKey({ ...BASE, phase: 'finished', roundResult: 'push' })).toBe('push');
  });

  it('falls back to the dealer total without a result', () => {
    expect(resolveDealerLineKey({ ...BASE, phase: 'finished', dealerValue: 19 })).toBe('dealerTotal');
  });
});

describe('resolveDealerLine', () => {
  const phases: GamePhase[] = ['betting', 'insurance', 'playing', 'finished'];
  const outcomes: DealerLineContext['roundResult'][] = ['win', 'lose', 'push', 'blackjack', null];

  it('every phase + outcome combination has a non-empty line (no undefined)', () => {
    for (const phase of phases) {
      for (const roundResult of outcomes) {
        const line = resolveDealerLine({
          ...BASE,
          phase,
          roundResult,
          dealerValue: phase === 'finished' ? 18 : null,
        });
        expect(line, `${phase} + ${roundResult}`).toBeTruthy();
      }
    }
  });

  it('returns null when the total is not yet known', () => {
    expect(resolveDealerLine({ ...BASE, phase: 'finished' })).toBeNull();
  });

  it('interpolates the dealer total', () => {
    expect(resolveDealerLine({ ...BASE, phase: 'finished', dealerValue: 17 })).toBe('Dealer has 17');
  });

  it('prefers the reshuffle line while betting', () => {
    expect(resolveDealerLine({ ...BASE, reshuffled: true })).toBe('Shuffling a new shoe');
  });
});

describe('formatDealerLine', () => {
  it('supports the Hungarian record', () => {
    expect(formatDealerLine('placeBets', {}, 'hu')).toBe('Tegyék meg tétjeiket');
    expect(formatDealerLine('dealerTotal', { value: 17 }, 'hu')).toBe('Az osztónak 17');
  });

  it('replaces a missing value with an empty string', () => {
    expect(formatDealerLine('dealerTotal')).toBe('Dealer has ');
  });
});
