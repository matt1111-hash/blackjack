import { describe, expect, it } from 'vitest';
import type { Card, Rank } from '../types';
import { DECISION_LABELS, recommendDecision } from './strategy';

function c(rank: Rank): Card {
  return { suit: 'spades', rank, faceUp: true };
}

const ALL = { canDouble: true, canSplit: true };
const NONE = { canDouble: false, canSplit: false };

describe('recommendDecision — hard totals', () => {
  it('hits 8 or less regardless of the upcard', () => {
    expect(recommendDecision([c('5'), c('3')], c('6'), ALL)).toBe('hit');
  });

  it('doubles 9 against 3–6 and hits against 2', () => {
    expect(recommendDecision([c('5'), c('4')], c('3'), ALL)).toBe('double');
    expect(recommendDecision([c('5'), c('4')], c('2'), ALL)).toBe('hit');
  });

  it('doubles 10 against 9 but hits against a ten', () => {
    expect(recommendDecision([c('6'), c('4')], c('9'), ALL)).toBe('double');
    expect(recommendDecision([c('6'), c('4')], c('K'), ALL)).toBe('hit');
  });

  it('doubles 11 against a ten and hits against an ace (S17)', () => {
    expect(recommendDecision([c('6'), c('5')], c('Q'), ALL)).toBe('double');
    expect(recommendDecision([c('6'), c('5')], c('A'), ALL)).toBe('hit');
  });

  it('stands 12 only against 4–6', () => {
    expect(recommendDecision([c('10'), c('2')], c('4'), ALL)).toBe('stand');
    expect(recommendDecision([c('10'), c('2')], c('3'), ALL)).toBe('hit');
  });

  it('stands 16 against 6 and hits it against 7', () => {
    expect(recommendDecision([c('10'), c('6')], c('6'), ALL)).toBe('stand');
    expect(recommendDecision([c('10'), c('6')], c('7'), ALL)).toBe('hit');
  });

  it('always stands on hard 17+', () => {
    expect(recommendDecision([c('10'), c('7')], c('A'), ALL)).toBe('stand');
  });

  it('falls back to hit when doubling is not allowed', () => {
    expect(recommendDecision([c('6'), c('5')], c('6'), NONE)).toBe('hit');
  });
});

describe('recommendDecision — soft totals', () => {
  it('doubles A2 against 5 and hits it against 4', () => {
    expect(recommendDecision([c('A'), c('2')], c('5'), ALL)).toBe('double');
    expect(recommendDecision([c('A'), c('2')], c('4'), ALL)).toBe('hit');
  });

  it('doubles A4 against 4', () => {
    expect(recommendDecision([c('A'), c('4')], c('4'), ALL)).toBe('double');
  });

  it('doubles A6 against 3 and hits it against 7', () => {
    expect(recommendDecision([c('A'), c('6')], c('3'), ALL)).toBe('double');
    expect(recommendDecision([c('A'), c('6')], c('7'), ALL)).toBe('hit');
  });

  it('plays A7 as double/stand, stand, or hit by upcard', () => {
    expect(recommendDecision([c('A'), c('7')], c('5'), ALL)).toBe('double');
    expect(recommendDecision([c('A'), c('7')], c('5'), NONE)).toBe('stand');
    expect(recommendDecision([c('A'), c('7')], c('2'), ALL)).toBe('stand');
    expect(recommendDecision([c('A'), c('7')], c('9'), ALL)).toBe('hit');
  });

  it('stands on soft 19', () => {
    expect(recommendDecision([c('A'), c('8')], c('6'), ALL)).toBe('stand');
  });

  it('treats a multi-card soft total by the soft chart', () => {
    expect(recommendDecision([c('A'), c('2'), c('3')], c('5'), NONE)).toBe('hit');
  });
});

describe('recommendDecision — pairs', () => {
  it('always splits aces and eights', () => {
    expect(recommendDecision([c('A'), c('A')], c('K'), ALL)).toBe('split');
    expect(recommendDecision([c('8'), c('8')], c('A'), ALL)).toBe('split');
  });

  it('never splits tens', () => {
    expect(recommendDecision([c('K'), c('K')], c('6'), ALL)).toBe('stand');
  });

  it('splits nines except against 7, ten and ace', () => {
    expect(recommendDecision([c('9'), c('9')], c('8'), ALL)).toBe('split');
    expect(recommendDecision([c('9'), c('9')], c('7'), ALL)).toBe('stand');
  });

  it('splits sevens against 7 and hits against 8', () => {
    expect(recommendDecision([c('7'), c('7')], c('7'), ALL)).toBe('split');
    expect(recommendDecision([c('7'), c('7')], c('8'), ALL)).toBe('hit');
  });

  it('splits sixes against 6 and hits against 7', () => {
    expect(recommendDecision([c('6'), c('6')], c('6'), ALL)).toBe('split');
    expect(recommendDecision([c('6'), c('6')], c('7'), ALL)).toBe('hit');
  });

  it('splits fours only against 5–6', () => {
    expect(recommendDecision([c('4'), c('4')], c('5'), ALL)).toBe('split');
    expect(recommendDecision([c('4'), c('4')], c('4'), ALL)).toBe('hit');
  });

  it('splits twos and threes against 2–7', () => {
    expect(recommendDecision([c('2'), c('2')], c('7'), ALL)).toBe('split');
    expect(recommendDecision([c('3'), c('3')], c('8'), ALL)).toBe('hit');
  });

  it('plays fives as a hard ten', () => {
    expect(recommendDecision([c('5'), c('5')], c('9'), ALL)).toBe('double');
  });

  it('uses the hard chart when splitting is not allowed', () => {
    expect(recommendDecision([c('8'), c('8')], c('A'), NONE)).toBe('hit');
  });
});

describe('DECISION_LABELS', () => {
  it('labels every decision', () => {
    expect(DECISION_LABELS.double).toBe('DOUBLE');
  });
});
