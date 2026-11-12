import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import { HandValueBadge } from './HandValueBadge';
import '@testing-library/jest-dom/vitest';

describe('HandValueBadge', () => {
  afterEach(() => {
    cleanup();
  });

  it('shows the hand value during play (D14)', () => {
    render(<HandValueBadge value={20} isSoft={false} isBusted={false} testId="player-hand-value-0" />);
    expect(screen.getByTestId('player-hand-value-0')).toHaveTextContent('20');
  });

  it('shows both totals for a soft hand', () => {
    render(<HandValueBadge value={17} isSoft isBusted={false} testId="player-hand-value-0" />);
    expect(screen.getByTestId('player-hand-value-0')).toHaveTextContent('7 / 17');
  });

  it('keeps the e2e contract text BUST', () => {
    render(<HandValueBadge value={23} isSoft={false} isBusted testId="player-hand-value-0" />);
    expect(screen.getByTestId('player-hand-value-0')).toHaveTextContent('BUST');
  });
});
