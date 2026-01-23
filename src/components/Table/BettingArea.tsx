import { motion } from 'framer-motion';
import { Chip } from '../Chip/Chip';
import { BettingChips } from '../Chip/ChipStack';
import type { ChipValue } from '../../types';
import './BettingArea.css';

interface BettingAreaProps {
  currentBet: number;
  onPlaceBet: (amount: ChipValue) => void;
  disabled?: boolean;
}

export function BettingArea({ currentBet, onPlaceBet, disabled }: BettingAreaProps) {
  const chipValues: ChipValue[] = [1, 5, 25, 100, 500];

  return (
    <div className="betting-area">
      <div className="betting-area__label">PLACE YOUR BET</div>
      <div className="betting-area__chips">
        {chipValues.map((value) => (
          <motion.button
            key={value}
            className="betting-area__chip-btn"
            onClick={() => onPlaceBet(value)}
            disabled={disabled}
            whileHover={!disabled ? { scale: 1.1, y: -4 } : undefined}
            whileTap={!disabled ? { scale: 0.9 } : undefined}
          >
            <Chip value={value} />
          </motion.button>
        ))}
      </div>
      {currentBet > 0 && (
        <div className="betting-area__bet-display">
          <BettingChips totalAmount={currentBet} />
          <span className="betting-area__bet-amount">${currentBet}</span>
        </div>
      )}
    </div>
  );
}
