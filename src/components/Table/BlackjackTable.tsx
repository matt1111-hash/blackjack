import { useEffect } from 'react';
import { useGameStore } from '../../store/gameStore';
import { DealerArea } from './DealerArea';
import { PlayerArea } from './PlayerArea';
import { Balance } from '../UI/Balance';
import { GameResult } from '../UI/GameResult';
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

  // Trigger dealer turn when phase changes to dealerTurn
  useEffect(() => {
    if (phase === 'dealerTurn') {
      endDealerTurn();
    }
  }, [phase, endDealerTurn]);

  const handlePlaceBet = (amount: ChipValue) => {
    placeBet(amount);
  };

  const handleDeal = () => {
    deal();
  };

  const handleNewRound = () => {
    newRound();
  };

  return (
    <div className="blackjack-table">
      <div className="blackjack-table__felt">
        {/* Header with balance */}
        <div className="blackjack-table__header">
          <Balance balance={balance} />
          <h1 className="blackjack-table__title">BLACKJACK</h1>
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
            onHit={hit}
            onStand={stand}
            onDouble={double}
            onSplit={split}
            onPlaceBet={phase === 'betting' ? handlePlaceBet : undefined}
            gamePhase={phase}
            canDouble={balance >= (playerHands[activeHandIndex]?.bet || 0)}
            canSplit={playerHands.length === 1 && playerHands[0]?.cards.length === 2}
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
