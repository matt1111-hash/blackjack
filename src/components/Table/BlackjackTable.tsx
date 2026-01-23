import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { useGameSounds } from '../../hooks/useSound';
import { DealerArea } from './DealerArea';
import { PlayerArea } from './PlayerArea';
import { Balance } from '../UI/Balance';
import { GameResult } from '../UI/GameResult';
import { SoundSettings } from '../UI/SoundSettings';
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
    endDealerTurn,
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

  // Play sounds for phase transitions
  useEffect(() => {
    if (phase === 'dealerTurn') {
      endDealerTurn();
    }
  }, [phase, endDealerTurn]);

  // Play result sounds when round finishes
  useEffect(() => {
    if (phase === 'finished' && roundResults) {
      const hasWin = roundResults.some((r) => r.result === 'win' || r.result === 'blackjack');
      const hasLose = roundResults.every((r) => r.result === 'lose');
      const hasBlackjack = roundResults.some((r) => r.result === 'blackjack');

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

  return (
    <div className="blackjack-table">
      <div className="blackjack-table__felt">
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

        {/* Center line */}
        <div className="blackjack-table__center-line" />

        {/* Player area */}
        <div className="blackjack-table__player">
          <PlayerArea
            hands={playerHands}
            activeHandIndex={activeHandIndex}
            currentBet={currentBet}
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
