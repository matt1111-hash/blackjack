import { Hand } from '../Card/Hand';
import { ActionButtons } from '../UI/ActionButtons';
import { BettingChips } from '../Chip/ChipStack';
import type { Hand as HandType } from '../../types';
import { calculateHandValue } from '../../logic/hand';
import './PlayerArea.css';

interface PlayerAreaProps {
  hands: HandType[];
  activeHandIndex: number;
  currentBet: number;
  onHit: () => void;
  onStand: () => void;
  onDouble?: () => void;
  onSplit?: () => void;
  onPlaceBet?: (amount: number) => void;
  gamePhase: string;
  canDouble?: boolean;
  canSplit?: boolean;
}

export function PlayerArea({
  hands,
  activeHandIndex,
  currentBet,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onPlaceBet,
  gamePhase,
  canDouble = false,
  canSplit = false,
}: PlayerAreaProps) {
  const isBetting = gamePhase === 'betting';
  const isPlaying = gamePhase === 'playing';

  return (
    <div className="player-area">
      {isBetting && onPlaceBet && (
        <div className="player-area__betting">
          <div className="player-area__bet-label">YOUR BET</div>
          {currentBet > 0 && (
            <div className="player-area__bet-chips">
              <BettingChips totalAmount={currentBet} />
            </div>
          )}
        </div>
      )}

      <div className="player-area__hands">
        {hands.map((hand, index) => {
          const value = calculateHandValue(hand.cards);
          const isActive = index === activeHandIndex && isPlaying;
          const isBusted = hand.isBusted;
          const isStanding = hand.isStanding;

          return (
            <div
              key={index}
              className={`player-area__hand ${isActive ? 'player-area__hand--active' : ''} ${isBusted ? 'player-area__hand--busted' : ''}`}
            >
              {hands.length > 1 && (
                <div className="player-area__hand-label">HAND {index + 1}</div>
              )}
              <Hand cards={hand.cards} spread />
              <div className={`player-area__hand-value ${isBusted ? 'player-area__hand-value--busted' : ''}`}>
                {isBusted ? 'BUST' : value}
              </div>
              {isActive && (
                <ActionButtons
                  onHit={onHit}
                  onStand={onStand}
                  onDouble={hand.cards.length === 2 && canDouble ? onDouble : undefined}
                  onSplit={hand.cards.length === 2 && canSplit ? onSplit : undefined}
                  disabled={isBusted || isStanding}
                  canDouble={canDouble && hand.cards.length === 2}
                  canSplit={canSplit && hand.cards.length === 2}
                />
              )}
            </div>
          );
        })}
      </div>

      {hands.length === 0 && isBetting && onPlaceBet && (
        <div className="player-area__empty">PLACE YOUR BET TO START</div>
      )}
    </div>
  );
}
