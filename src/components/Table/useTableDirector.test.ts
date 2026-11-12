import { renderHook } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { Card, Hand, Rank } from '../../types';
import { isTenseReveal, useTableDirector } from './useTableDirector';

const c = (rank: Rank): Card => ({ suit: 'clubs', rank, faceUp: true });

function hand(cards: Card[], extra: Partial<Hand> = {}): Hand {
  return { cards, bet: 100, isDoubled: false, isStanding: false, isBusted: false, isBlackjack: false, ...extra };
}

describe('isTenseReveal', () => {
  it('is tense when a live hand waits on the hole card', () => {
    expect(isTenseReveal('finished', [hand([c('K'), c('8')])])).toBe(true);
  });

  it('is routine when every hand is busted or blackjack', () => {
    expect(isTenseReveal('finished', [hand([c('K'), c('8'), c('9')], { isBusted: true })])).toBe(false);
    expect(isTenseReveal('finished', [hand([c('A'), c('K')], { isBlackjack: true })])).toBe(false);
  });

  it('is never tense before the round is finished', () => {
    expect(isTenseReveal('playing', [hand([c('K'), c('8')])])).toBe(false);
  });
});

describe('useTableDirector (immediate mode)', () => {
  it('converges at once and exposes the full dealer hand after the round', () => {
    const { result } = renderHook(() =>
      useTableDirector({
        phase: 'finished',
        playerHands: [hand([c('K'), c('8')])],
        dealerHand: hand([c('6'), c('10'), c('K')]),
        sounds: { playCardSlide: vi.fn(), playCardPlace: vi.fn() },
        speed: 0,
      }),
    );

    expect(result.current.choreographyDone).toBe(true);
    expect(result.current.dealerVisible).toBe(3);
    expect(result.current.holeRevealed).toBe(true);
    expect(result.current.liftHole).toBe(false);
    expect(result.current.visiblePlayerCards).toBeUndefined();
  });

  it('keeps the hole card down while playing', () => {
    const { result } = renderHook(() =>
      useTableDirector({
        phase: 'playing',
        playerHands: [hand([c('K'), c('8')])],
        dealerHand: hand([c('6'), c('10')]),
        sounds: {},
        speed: 0,
      }),
    );

    expect(result.current.holeRevealed).toBe(false);
    expect(result.current.tense).toBe(false);
    expect(result.current.dealing).toBe(false);
  });
});
