import { motion } from 'framer-motion';
import { Chip } from '../Chip/Chip';
import type { ChipValue } from '../../types';
import './ChipSelector.css';

interface ChipSelectorProps {
  onPlaceBet: (amount: ChipValue) => void;
  disabled?: boolean;
  balance: number;
}

const CHIP_VALUES: ChipValue[] = [5, 25, 100, 500];

export function ChipSelector({ onPlaceBet, disabled, balance }: ChipSelectorProps) {
  return (
    <div className="chip-selector">
      <div className="chip-selector__chips">
        {CHIP_VALUES.map((value) => {
          const canAfford = balance >= value;
          return (
            <motion.button
              key={value}
              className="chip-selector__chip-btn"
              onClick={() => onPlaceBet(value)}
              disabled={disabled || !canAfford}
              whileHover={!disabled && canAfford ? { scale: 1.1, y: -4 } : undefined}
              whileTap={!disabled && canAfford ? { scale: 0.95 } : undefined}
            >
              <Chip value={value} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
