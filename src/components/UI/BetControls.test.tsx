import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { BetControls } from './BetControls';
import '@testing-library/jest-dom/vitest';

function setup(overrides: Partial<Parameters<typeof BetControls>[0]> = {}) {
  const props = {
    currentBet: 100,
    balance: 5000,
    lastBet: 100,
    onDoubleBet: vi.fn(),
    onRebet: vi.fn(),
    onClearBet: vi.fn(),
    ...overrides,
  };
  render(<BetControls {...props} />);
  return props;
}

describe('BetControls', () => {
  afterEach(() => {
    cleanup();
  });

  it('offers doubling while a bet is placed', () => {
    const props = setup();
    fireEvent.click(screen.getByTestId('bet-double'));
    expect(props.onDoubleBet).toHaveBeenCalledTimes(1);
  });

  it('clears the placed bet', () => {
    const props = setup();
    fireEvent.click(screen.getByTestId('bet-clear'));
    expect(props.onClearBet).toHaveBeenCalledTimes(1);
  });

  it('shows CLEAR disabled without a bet', () => {
    setup({ currentBet: 0, lastBet: 200 });
    const clear = screen.getByTestId('bet-clear');
    expect(clear).toBeDisabled();
  });

  it('hides CLEAR without a handler', () => {
    setup({ onClearBet: undefined });
    expect(screen.queryByTestId('bet-clear')).not.toBeInTheDocument();
  });

  it('offers rebet only without a running bet', () => {
    const props = setup({ currentBet: 0, lastBet: 200 });
    fireEvent.click(screen.getByTestId('bet-rebet'));
    expect(props.onRebet).toHaveBeenCalledTimes(1);
    expect(screen.queryByTestId('bet-double')).not.toBeInTheDocument();
  });

  it('only shows the disabled CLEAR when nothing else is available', () => {
    setup({ currentBet: 0, lastBet: 0 });
    expect(screen.queryByTestId('bet-double')).not.toBeInTheDocument();
    expect(screen.queryByTestId('bet-rebet')).not.toBeInTheDocument();
    expect(screen.getByTestId('bet-clear')).toBeDisabled();
  });

  it('hides doubling when the balance cannot cover it', () => {
    setup({ balance: 50 });
    expect(screen.queryByTestId('bet-double')).not.toBeInTheDocument();
  });
});
