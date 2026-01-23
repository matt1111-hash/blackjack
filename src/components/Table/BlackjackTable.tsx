import { useGameStore } from '../../store/gameStore';
import { DealerArea } from './DealerArea';
import { PlayerArea } from './PlayerArea';
import { Balance } from '../UI/Balance';
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
    placeBet,
    deal,
    hit,
    stand,
    double,
    split,
  } = useGameStore();

  const handlePlaceBet = (amount: ChipValue) => {
    placeBet(amount);
  };

  const handleDeal = () => {
    deal();
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
            showHoleCard={phase === 'dealerTurn' || phase === 'finished'}
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

        {/* Shoe indicator */}
        <div className="blackjack-table__shoe">
          <div className="shoe__label">SHOE</div>
          <div className="shoe__cards">♠ ♥ ♣ ♦</div>
        </div>
      </div>
    </div>
  );
}
