import '@testing-library/jest-dom/vitest';
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../../App';
import { createHand } from '../../logic/hand';
import { useGameStore } from '../../store/gameStore';
import { INITIAL_BALANCE, createFreshShoe } from '../../store/gameHelpers';

vi.mock('../../hooks/useSound', () => ({
  useSound: () => ({
    isLoading: false,
    isMuted: false,
    mute: vi.fn(),
    play: vi.fn(),
    preload: vi.fn(),
    setVolume: vi.fn(),
    soundsLoaded: new Set(),
    toggleMute: vi.fn(),
    unmute: vi.fn(),
  }),
  useVolume: () => ({
    decreaseVolume: vi.fn(),
    increaseVolume: vi.fn(),
    setVolume: vi.fn(),
    volume: 0.7,
  }),
  useGameSounds: () => ({
    playBlackjack: vi.fn(),
    playButtonClick: vi.fn(),
    playCardPlace: vi.fn(),
    playChipDrop: vi.fn(),
    playDealStart: vi.fn(),
    playLose: vi.fn(),
    playWin: vi.fn(),
  }),
}));

type TestCard = {
  suit: 'hearts' | 'diamonds' | 'clubs' | 'spades';
  rank: 'A' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | '10' | 'J' | 'Q' | 'K';
  faceUp: boolean;
};

const E2E_SHOE_STORAGE_KEY = 'blackjack:e2e-shoe';

function primeScenario(shoe: TestCard[]): void {
  window.localStorage.setItem(E2E_SHOE_STORAGE_KEY, JSON.stringify(shoe));
  useGameStore.setState((state) => ({
    ...state,
    activeHandIndex: 0,
    balance: INITIAL_BALANCE,
    currentBet: 0,
    dealerHand: createHand(0),
    phase: 'betting',
    playerHands: [],
    roundResults: null,
    shoe: createFreshShoe(),
    shoePenetration: 0,
  }));
}

describe('BlackjackTable gameplay flow', () => {
  beforeEach(() => {
    window.localStorage.clear();
    primeScenario([
      { suit: 'spades', rank: 'K', faceUp: true },
      { suit: 'hearts', rank: '6', faceUp: true },
      { suit: 'clubs', rank: 'Q', faceUp: true },
      { suit: 'diamonds', rank: '10', faceUp: true },
      { suit: 'hearts', rank: 'K', faceUp: true },
    ]);
  });

  afterEach(() => {
    cleanup();
    window.localStorage.clear();
  });

  it('shows a win when the player stands and the dealer busts', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('bet-chip-100'));
    fireEvent.click(screen.getByTestId('deal-button'));
    fireEvent.click(screen.getByTestId('action-stand'));

    await waitFor(() => {
      expect(screen.getByTestId('game-result-badge-0')).toHaveTextContent('WIN');
    });

    expect(screen.getByTestId('dealer-value')).toHaveTextContent('26');
  });

  it('shows a loss when the player hits into a bust', async () => {
    primeScenario([
      { suit: 'spades', rank: '9', faceUp: true },
      { suit: 'hearts', rank: '7', faceUp: true },
      { suit: 'clubs', rank: '7', faceUp: true },
      { suit: 'diamonds', rank: '8', faceUp: true },
      { suit: 'clubs', rank: '10', faceUp: true },
    ]);

    render(<App />);

    fireEvent.click(screen.getByTestId('bet-chip-100'));
    fireEvent.click(screen.getByTestId('deal-button'));
    fireEvent.click(screen.getByTestId('action-hit'));

    await waitFor(() => {
      expect(screen.getByTestId('game-result-badge-0')).toHaveTextContent('LOSE');
    });

    expect(screen.getByTestId('player-hand-value-0')).toHaveTextContent('BUST');
  });

  it('returns to betting state after starting a new round', async () => {
    render(<App />);

    fireEvent.click(screen.getByTestId('bet-chip-100'));
    fireEvent.click(screen.getByTestId('deal-button'));
    fireEvent.click(screen.getByTestId('action-stand'));

    await waitFor(() => {
      expect(screen.getByTestId('new-round-button')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByTestId('new-round-button'));

    await waitFor(() => {
      expect(screen.queryByTestId('game-result-overlay')).not.toBeInTheDocument();
    });

    expect(screen.getByText('PLACE YOUR BET TO START')).toBeInTheDocument();
  });
});
