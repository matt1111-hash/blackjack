import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { EMPTY_SESSION } from '../../hooks/useSessionStats';
import type { GamePhase } from '../../types';
import { TableConsole, type ConsoleHandlers } from './TableConsole';

vi.mock('../UI/SoundSettings', () => ({ SoundSettings: () => <div data-testid="sound-settings" /> }));

function handlers(): ConsoleHandlers {
  return {
    onPlaceBet: vi.fn(),
    onClearBet: vi.fn(),
    onDoubleBet: vi.fn(),
    onRebet: vi.fn(),
    onDeal: vi.fn(),
    onHit: vi.fn(),
    onStand: vi.fn(),
    onDouble: vi.fn(),
    onSplit: vi.fn(),
    onNewRound: vi.fn(),
    onRebetAndDeal: vi.fn(),
  };
}

function renderConsole(phase: GamePhase, extra: Partial<Parameters<typeof TableConsole>[0]> = {}) {
  const h = handlers();
  const settings = {
    session: EMPTY_SESSION,
    coachEnabled: true,
    coachAccuracy: 80,
    coachDecisions: 5,
    onToggleCoach: vi.fn(),
    speed: 'live' as const,
    onToggleSpeed: vi.fn(),
    voiceEnabled: true,
    onToggleVoice: vi.fn(),
  };
  render(
    <TableConsole
      phase={phase}
      balance={5000}
      betOnTable={100}
      currentBet={100}
      lastBet={100}
      ready
      canDouble={false}
      canSplit={false}
      handStanding={false}
      handlers={h}
      settings={settings}
      {...extra}
    />,
  );
  return { h, settings };
}

describe('TableConsole', () => {
  afterEach(cleanup);

  it('offers chips and DEAL while betting', () => {
    const { h } = renderConsole('betting');

    fireEvent.click(screen.getByTestId('bet-chip-25'));
    fireEvent.click(screen.getByTestId('deal-button'));

    expect(h.onPlaceBet).toHaveBeenCalledWith(25);
    expect(h.onDeal).toHaveBeenCalled();
  });

  it('hides DEAL until a bet is placed', () => {
    renderConsole('betting', { currentBet: 0 });
    expect(screen.queryByTestId('deal-button')).not.toBeInTheDocument();
  });

  it('shows only legal decisions while playing', () => {
    const { h } = renderConsole('playing');

    fireEvent.click(screen.getByTestId('action-hit'));

    expect(h.onHit).toHaveBeenCalled();
    expect(screen.queryByTestId('action-double')).not.toBeInTheDocument();
    expect(screen.queryByTestId('action-split')).not.toBeInTheDocument();
  });

  it('offers double and split when they are legal', () => {
    const { h } = renderConsole('playing', { canDouble: true, canSplit: true });

    fireEvent.click(screen.getByTestId('action-double'));
    fireEvent.click(screen.getByTestId('action-split'));

    expect(h.onDouble).toHaveBeenCalled();
    expect(h.onSplit).toHaveBeenCalled();
  });

  it('shows a status line while the dealer is still dealing', () => {
    renderConsole('playing', { ready: false });
    expect(screen.getByText('DEALING…')).toBeInTheDocument();
    expect(screen.queryByTestId('action-hit')).not.toBeInTheDocument();
  });

  it('shows the insurance status during insurance', () => {
    renderConsole('insurance');
    expect(screen.getByText('INSURANCE OPEN')).toBeInTheDocument();
  });

  it('offers NEW BET and REBET & DEAL after the round', () => {
    const { h } = renderConsole('finished');

    fireEvent.click(screen.getByTestId('new-round-button'));
    fireEvent.click(screen.getByTestId('rebet-deal-button'));

    expect(h.onNewRound).toHaveBeenCalled();
    expect(h.onRebetAndDeal).toHaveBeenCalled();
  });

  it('drops REBET & DEAL when the bankroll cannot cover it', () => {
    renderConsole('finished', { balance: 50 });
    expect(screen.queryByTestId('rebet-deal-button')).not.toBeInTheDocument();
  });

  it('shows the bet on the table and the coach score, and wires the toggles', () => {
    const { settings } = renderConsole('playing');

    expect(screen.getByTestId('bet-on-table')).toHaveTextContent('$100');
    expect(screen.getByTestId('coach-toggle')).toHaveTextContent('COACH 80%');

    fireEvent.click(screen.getByTestId('coach-toggle'));
    fireEvent.click(screen.getByTestId('speed-toggle'));

    expect(settings.onToggleCoach).toHaveBeenCalled();
    expect(settings.onToggleSpeed).toHaveBeenCalled();
    expect(screen.getByTestId('speed-toggle')).toHaveTextContent('LIVE PACE');
  });
});
