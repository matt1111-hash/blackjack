import { motion, AnimatePresence } from 'framer-motion';
import { Hand } from '../Card/Hand';
import { ActionButtons } from '../UI/ActionButtons';
import { ChipSelector } from '../UI/ChipSelector';
import { AnimatedChipStack } from '../Chip/ChipAnimations';
import { PlayerAvatar } from '../Avatar/PlayerAvatar';
import type { Hand as HandType } from '../../types';
import { calculateHandValue } from '../../logic/hand';
import './PlayerArea.css';

interface PlayerAreaProps {
  hands: HandType[];
  activeHandIndex: number;
  currentBet: number;
  balance: number;
  onHit: () => void;
  onStand: () => void;
  onDouble?: () => void;
  onSplit?: () => void;
  onPlaceBet?: (amount: number) => void;
  gamePhase: string;
  canDouble?: boolean;
  canSplit?: boolean;
  roundResults?: Array<{ playerHandIndex: number; result: string }> | null;
}

export function PlayerArea({
  hands,
  activeHandIndex,
  currentBet,
  balance,
  onHit,
  onStand,
  onDouble,
  onSplit,
  onPlaceBet,
  gamePhase,
  canDouble = false,
  canSplit = false,
  roundResults = null,
}: PlayerAreaProps) {
  const isBetting = gamePhase === 'betting';
  const isPlaying = gamePhase === 'playing';
  const isFinished = gamePhase === 'finished';

  // Determine player mood based on game state
  const getPlayerMood = (): 'neutral' | 'happy' | 'excited' | 'thinking' | 'sad' => {
    if (isBetting) return 'neutral';
    if (isFinished && roundResults) {
      const hasWin = roundResults.some(r => ['win', 'blackjack'].includes(r.result));
      const hasLoss = roundResults.some(r => r.result === 'lose');
      if (hasWin) return 'excited';
      if (hasLoss) return 'sad';
    }
    if (isPlaying) return 'thinking';
    return 'neutral';
  };

  return (
    <div className="player-area">
      <div className="player-area__avatar">
        <PlayerAvatar mood={getPlayerMood()} size={56} />
        <div className="player-area__balance">${balance}</div>
      </div>

      {isBetting && onPlaceBet && (
        <div className="player-area__betting">
          <div className="player-area__bet-label">YOUR BET</div>
          {currentBet > 0 && (
            <div className="player-area__bet-chips">
              <AnimatedChipStack
                chips={[{ value: 25, id: 'bet-chip' }]}
                vertical={false}
              />
            </div>
          )}
        </div>
      )}

      <div className="player-area__hands">
        <AnimatePresence mode="popLayout">
          {hands.map((hand, index) => {
            const value = calculateHandValue(hand.cards);
            const isActive = index === activeHandIndex && isPlaying;
            const isBusted = hand.isBusted;
            const isStanding = hand.isStanding;

            // Check if this hand won
            const handResult = roundResults?.find((r) => r.playerHandIndex === index);
            const hasWon = handResult && ['win', 'blackjack'].includes(handResult.result);
            const hasLost = handResult && handResult.result === 'lose';

            return (
              <motion.div
                key={index}
                className={`player-area__hand ${isActive ? 'player-area__hand--active' : ''} ${isBusted ? 'player-area__hand--busted' : ''}`}
                initial={{ scale: 0.8, opacity: 0, y: 30 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.8, opacity: 0 }}
                transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              >
                {hands.length > 1 && (
                  <div className="player-area__hand-label">HAND {index + 1}</div>
                )}

                <motion.div
                  animate={
                    hasWon
                      ? { scale: [1, 1.05, 1], borderColor: '#22c55e' }
                      : hasLost
                      ? { scale: 0.95, opacity: 0.7 }
                      : {}
                  }
                  transition={{ duration: 0.3 }}
                >
                  <Hand cards={hand.cards} spread />
                </motion.div>

                <motion.div
                  className={`player-area__hand-value ${isBusted ? 'player-area__hand-value--busted' : ''}`}
                  animate={
                    isBusted
                      ? { backgroundColor: '#dc2626' }
                      : hasWon
                      ? { backgroundColor: '#22c55e' }
                      : {}
                  }
                >
                  {isBusted ? 'BUST' : isFinished ? value : ''}
                </motion.div>

                {isActive && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <ActionButtons
                      onHit={onHit}
                      onStand={onStand}
                      onDouble={onDouble}
                      onSplit={onSplit}
                      disabled={isBusted || isStanding}
                      canDouble={canDouble}
                      canSplit={canSplit}
                    />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {hands.length === 0 && isBetting && onPlaceBet && (
        <motion.div
          className="player-area__betting-section"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="player-area__empty">
            PLACE YOUR BET TO START
          </div>
          <ChipSelector onPlaceBet={onPlaceBet} balance={balance} />
        </motion.div>
      )}
    </div>
  );
}
