import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useGameSounds } from '../../hooks/useSound';
import { DealerArea } from './DealerArea';
import { PlayerArea } from './PlayerArea';
import { Balance } from '../UI/Balance';
import { GameResult } from '../UI/GameResult';
import { SoundSettings } from '../UI/SoundSettings';
import { InsuranceDialog } from '../UI/InsuranceDialog';
import type { ChipValue } from '../../types';
import './BlackjackTable.css';

export function BlackjackTable() {
  const {
    balance,
    currentBet,
    dealerHand,
    playerHands,
    activeHandIndex,
    phase,
    roundResults,
    placeBet,
    deal,
    hit,
    stand,
    double,
    split,
    buyInsurance,
    declineInsurance,
    newRound,
  } = useGameStore();

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
    if (phase === 'finished' && roundResults) {
      let hasWin = false;
      let hasLose = true;
      let hasBlackjack = false;

      for (let i = 0; i < roundResults.length; i++) {
        const result = roundResults[i].result;
        if (result === 'win' || result === 'blackjack') hasWin = true;
        if (result !== 'lose') hasLose = false;
        if (result === 'blackjack') hasBlackjack = true;
      }

      if (hasBlackjack) {
        setTimeout(playBlackjack, 500);
      } else if (hasWin && !hasLose) {
        setTimeout(playWin, 500);
      } else if (hasLose) {
        setTimeout(playLose, 500);
      }
    }
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
            canDouble={balance >= (playerHands[activeHandIndex]?.bet || 0)}
            canSplit={playerHands.length === 1 && playerHands[0]?.cards.length === 2}
            roundResults={roundResults}
          />
        </div>

        {/* Deal button when betting */}
        {phase === 'betting' && currentBet > 0 && (
          <div className="blackjack-table__deal-btn">
            <button className="deal-button" onClick={handleDeal}>
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
            <button className="deal-button" onClick={handleNewRound}>
              NEW ROUND
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
