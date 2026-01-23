import { motion, AnimatePresence } from 'framer-motion';
import type { RoundResult } from '../../store/gameStore';
import type { Hand } from '../../types';
import './GameResult.css';

interface GameResultProps {
  results: RoundResult[];
  hands: Hand[];
}

const RESULT_LABELS: Record<string, string> = {
  win: 'WIN',
  lose: 'LOSE',
  push: 'PUSH',
  blackjack: 'BLACKJACK!',
};

const RESULT_COLORS: Record<string, string> = {
  win: '#22c55e',
  lose: '#ef4444',
  push: '#eab308',
  blackjack: '#f59e0b',
};

export function GameResult({ results, hands }: GameResultProps) {
  return (
    <div className="game-result-overlay">
      <AnimatePresence>
        {results.map((result, index) => (
          <motion.div
            key={result.playerHandIndex}
            className="game-result-card"
            initial={{ scale: 0, opacity: 0, y: 50 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0, opacity: 0 }}
            transition={{ delay: index * 0.2, type: 'spring', stiffness: 200 }}
            style={{ '--result-color': RESULT_COLORS[result.result] } as React.CSSProperties}
          >
            {hands.length > 1 && (
              <div className="game-result__hand-label">HAND {result.playerHandIndex + 1}</div>
            )}
            <div
              className="game-result__badge"
              style={{ backgroundColor: RESULT_COLORS[result.result] }}
            >
              {RESULT_LABELS[result.result]}
            </div>
            {result.result !== 'lose' && result.result !== 'push' && (
              <div className="game-result__payout">
                +${Math.floor(hands[result.playerHandIndex].bet * result.payout)}
              </div>
            )}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
