import { useCallback, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../store/gameStore';
import { useGameSounds } from '../../hooks/soundHelpers';
import { canPlayerDouble, canPlayerSplit } from '../../logic/rules';
import { DealerArea } from './DealerArea';
import { PlayerArea } from './PlayerArea';
import { Balance } from '../UI/Balance';
import { GameResult } from '../UI/GameResult';
import { SoundSettings } from '../UI/SoundSettings';
import { InsuranceDialog } from '../UI/InsuranceDialog';
import type { ChipValue } from '../../types';
import './BlackjackTable.css';

const RESULT_SOUND_DELAY_MS = 500;

export function BlackjackTable() {
  const {
    balance,
    currentBet,
    dealerHand,
    playerHands,
    activeHandIndex,
    phase,
    roundResults,
    error,
    placeBet,
    deal,
    hit,
    stand,
    double,
    split,
    buyInsurance,
    declineInsurance,
    newRound,
    clearError,
  } = useGameStore(
    // Narrow selector: re-render only when one of these fields changes.
    // Actions are stable references, so they never trigger a re-render.
    useShallow((state) => ({
      balance: state.balance,
      currentBet: state.currentBet,
      dealerHand: state.dealerHand,
      playerHands: state.playerHands,
      activeHandIndex: state.activeHandIndex,
      phase: state.phase,
      roundResults: state.roundResults,
      error: state.error,
      placeBet: state.placeBet,
      deal: state.deal,
      hit: state.hit,
      stand: state.stand,
      double: state.double,
      split: state.split,
      buyInsurance: state.buyInsurance,
      declineInsurance: state.declineInsurance,
      newRound: state.newRound,
      clearError: state.clearError,
    }))
  );

  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (error) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        clearError();
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [error, clearError]);

  const dismissError = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearError();
  }, [clearError]);

  const {
    playDealStart,
    playButtonClick,
    playCardPlace,
    playChipDrop,
    playWin,
    playLose,
    playBlackjack,
  } = useGameSounds();

  // Play result sounds when round finishes
  useEffect(() => {
    if (phase !== 'finished' || !roundResults) return;

    let hasWin = false;
    let hasLose = true;
    let hasBlackjack = false;

    for (let i = 0; i < roundResults.length; i++) {
      const result = roundResults[i].result;
      if (result === 'win' || result === 'blackjack') hasWin = true;
      if (result !== 'lose') hasLose = false;
      if (result === 'blackjack') hasBlackjack = true;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (hasBlackjack) {
      timer = setTimeout(playBlackjack, RESULT_SOUND_DELAY_MS);
    } else if (hasWin && !hasLose) {
      timer = setTimeout(playWin, RESULT_SOUND_DELAY_MS);
    } else if (hasLose) {
      timer = setTimeout(playLose, RESULT_SOUND_DELAY_MS);
    }

    // Clear the pending sound if the phase/results change before it fires
    // (also neutralises StrictMode's double-invoke in dev).
    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase, roundResults, playWin, playLose, playBlackjack]);

  const handlePlaceBet = (amount: ChipValue) => {
    playChipDrop();
    placeBet(amount);
  };

  const handleDeal = () => {
    playDealStart();
    playButtonClick();
    deal();
  };

  const handleNewRound = () => {
    playButtonClick();
    newRound();
  };

  const handleHit = () => {
    playCardPlace();
    playButtonClick();
    hit();
  };

  const handleStand = () => {
    playButtonClick();
    stand();
  };

  const handleDouble = () => {
    playChipDrop();
    playButtonClick();
    double?.();
  };

  const handleSplit = () => {
    playChipDrop();
    playButtonClick();
    split?.();
  };

  const handleBuyInsurance = () => {
    playChipDrop();
    playButtonClick();
    buyInsurance();
  };

  const handleDeclineInsurance = () => {
    playButtonClick();
    declineInsurance();
  };

  return (
    <div className="blackjack-table">
      {/* 3D Background Layer - Visual only, no interactive elements */}
      <div className="blackjack-table__felt-3d" aria-hidden="true">
        <div className="blackjack-table__center-line-3d" />
      </div>

      {/* 2D Overlay Layer - All interactive elements */}
      <div className="blackjack-table__overlay">
        {/* Header with balance and sound settings */}
        <div className="blackjack-table__header">
          <Balance balance={balance} />
          <h1 className="blackjack-table__title">BLACKJACK</h1>
          <SoundSettings />
        </div>

        {/* Dealer area */}
        <div className="blackjack-table__dealer">
          <DealerArea
            hand={dealerHand}
            showHoleCard={phase === 'finished'}
          />
        </div>

        {/* Player area */}
        <div className="blackjack-table__player">
          <PlayerArea
            hands={playerHands}
            activeHandIndex={activeHandIndex}
            currentBet={currentBet}
            balance={balance}
            onHit={handleHit}
            onStand={handleStand}
            onDouble={handleDouble}
            onSplit={handleSplit}
            onPlaceBet={phase === 'betting' ? handlePlaceBet : undefined}
            gamePhase={phase}
            canDouble={
              playerHands[activeHandIndex]
                ? canPlayerDouble(playerHands[activeHandIndex], balance)
                : false
            }
            canSplit={playerHands.length === 1 && canPlayerSplit(playerHands[0], balance)}
            roundResults={roundResults}
          />
        </div>

        {/* Deal button when betting */}
        {phase === 'betting' && currentBet > 0 && (
          <div className="blackjack-table__deal-btn">
            <button className="deal-button" onClick={handleDeal} data-testid="deal-button" aria-label="Deal">
              DEAL
            </button>
          </div>
        )}

        {/* Insurance Dialog */}
        {phase === 'insurance' && (
          <InsuranceDialog
            onBuy={handleBuyInsurance}
            onDecline={handleDeclineInsurance}
            insuranceCost={Math.floor(currentBet / 2)}
          />
        )}

        {/* New Round button when finished */}
        {phase === 'finished' && (
          <div className="blackjack-table__new-round-btn">
            <button className="deal-button" onClick={handleNewRound} data-testid="new-round-button" aria-label="New round">
              NEW ROUND
            </button>
          </div>
        )}

        {/* Error toast */}
        {error && (
          <div className="blackjack-table__error" role="alert" data-testid="game-error">
            <span className="blackjack-table__error-text">{error.message}</span>
            <button
              className="blackjack-table__error-dismiss"
              onClick={dismissError}
              aria-label="Dismiss error"
            >
              ×
            </button>
          </div>
        )}

        {/* Game results overlay */}
        {phase === 'finished' && roundResults && (
          <GameResult results={roundResults} hands={playerHands} />
        )}

        {/* Shoe indicator */}
        <div className="blackjack-table__shoe">
          <div className="shoe__label">SHOE</div>
          <div className="shoe__cards">♠ ♥ ♣ ♦</div>
        </div>
      </div>
    </div>
  );
}
