import '@testing-library/jest-dom/vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import type { Card, Hand, Rank } from '../../types';
import { DealerArea } from './DealerArea';
import { PlayerArea } from './PlayerArea';

const c = (rank: Rank): Card => ({ suit: 'hearts', rank, faceUp: true });

function hand(cards: Card[], extra: Partial<Hand> = {}): Hand {
  return { cards, bet: 100, isDoubled: false, isStanding: false, isBusted: false, isBlackjack: false, ...extra };
}

describe('DealerArea', () => {
  afterEach(cleanup);

  it('shows only the upcard value before the reveal', () => {
    render(<DealerArea hand={hand([c('6'), c('10')])} holeRevealed={false} />);
    expect(screen.getByTestId('dealer-value')).toHaveTextContent('6');
  });

  it('writes a soft ace upcard as 1 / 11', () => {
    render(<DealerArea hand={hand([c('A'), c('9')])} holeRevealed={false} />);
    expect(screen.getByTestId('dealer-value')).toHaveTextContent('1 / 11');
  });

  it('shows the full total and the bust stamp after the reveal', () => {
    render(<DealerArea hand={hand([c('6'), c('10'), c('K')], { isBusted: true })} holeRevealed />);
    expect(screen.getByTestId('dealer-value')).toHaveTextContent('26');
    expect(screen.getByText('DEALER BUST')).toBeInTheDocument();
  });

  it('shows no value before any card is face up', () => {
    render(<DealerArea hand={hand([])} />);
    expect(screen.queryByTestId('dealer-value')).not.toBeInTheDocument();
  });
});

describe('PlayerArea', () => {
  afterEach(cleanup);

  it('invites a bet on an empty seat', () => {
    render(<PlayerArea hands={[]} activeHandIndex={0} currentBet={0} gamePhase="betting" />);
    expect(screen.getByText('PLACE YOUR BET TO START')).toBeInTheDocument();
  });

  it('stacks the pending bet in the bet spot', () => {
    render(<PlayerArea hands={[]} activeHandIndex={0} currentBet={125} gamePhase="betting" />);
    expect(screen.getByTestId('bet-spot-stack')).toHaveAttribute('aria-label', 'Bet: $125');
    expect(screen.queryByText('PLACE YOUR BET TO START')).not.toBeInTheDocument();
  });

  it('pays a win next to the bet', () => {
    render(
      <PlayerArea
        hands={[hand([c('K'), c('Q')])]}
        activeHandIndex={0}
        currentBet={100}
        gamePhase="finished"
        roundResults={[{ playerHandIndex: 0, result: 'win', payout: 1 }]}
      />,
    );
    expect(screen.getByTestId('payout-stack-0')).toHaveAttribute('aria-label', 'Bet: $100');
  });

  it('pays blackjack 3 to 2', () => {
    render(
      <PlayerArea
        hands={[hand([c('A'), c('K')], { isBlackjack: true })]}
        activeHandIndex={0}
        currentBet={100}
        gamePhase="finished"
        roundResults={[{ playerHandIndex: 0, result: 'blackjack', payout: 1.5 }]}
      />,
    );
    expect(screen.getByTestId('payout-stack-0')).toHaveAttribute('aria-label', 'Bet: $150');
  });

  it('pays nothing on a loss or before results settle', () => {
    const { rerender } = render(
      <PlayerArea hands={[hand([c('K'), c('7')])]} activeHandIndex={0} currentBet={100} gamePhase="finished" />,
    );
    expect(screen.queryByTestId('payout-stack-0')).not.toBeInTheDocument();

    rerender(
      <PlayerArea
        hands={[hand([c('K'), c('7')])]}
        activeHandIndex={0}
        currentBet={100}
        gamePhase="finished"
        roundResults={[{ playerHandIndex: 0, result: 'lose', payout: 0 }]}
      />,
    );
    expect(screen.queryByTestId('payout-stack-0')).not.toBeInTheDocument();
  });

  it('labels split hands and marks the active one', () => {
    render(
      <PlayerArea
        hands={[hand([c('8'), c('3')]), hand([c('8'), c('2')])]}
        activeHandIndex={1}
        currentBet={100}
        gamePhase="playing"
      />,
    );
    expect(screen.getByText('HAND 2')).toBeInTheDocument();
    expect(screen.getByTestId('player-hand-1')).toHaveClass('player-area__seat--active');
    expect(screen.getByTestId('player-hand-0')).not.toHaveClass('player-area__seat--active');
  });

  it('shows only the dealt cards during the opening deal', () => {
    render(
      <PlayerArea
        hands={[hand([c('8'), c('3')])]}
        activeHandIndex={0}
        currentBet={100}
        gamePhase="playing"
        visiblePlayerCards={0}
      />,
    );
    expect(screen.queryByTestId('player-hand-value-0')).not.toBeInTheDocument();
  });
});
