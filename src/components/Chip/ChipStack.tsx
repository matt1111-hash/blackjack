import { motion } from 'framer-motion';
import type { ChipValue } from '../../types';
import { Chip } from './Chip';
import './ChipStack.css';

interface ChipStackProps {
  chips: Array<{ value: ChipValue; id: string }>;
  className?: string;
  vertical?: boolean;
}

export function ChipStack({ chips, className = '', vertical = true }: ChipStackProps) {
  const offset = vertical ? 4 : 6;

  return (
    <div className={`chip-stack ${className}`}>
      {chips.map((chip, index) => (
        <motion.div
          key={chip.id}
          className="chip-stack__wrapper"
          style={{ [vertical ? 'bottom' : 'right']: index * offset }}
          initial={{ y: vertical ? 20 : -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * 0.05 }}
        >
          <Chip value={chip.value} />
        </motion.div>
      ))}
    </div>
  );
}

interface BettingChipsProps {
  totalAmount: number;
  className?: string;
}

export function BettingChips({ totalAmount, className = '' }: BettingChipsProps) {
  const denominations: ChipValue[] = [500, 100, 25, 5, 1];
  const chipCounts: Record<ChipValue, number> = {
    1: 0,
    5: 0,
    25: 0,
    100: 0,
    500: 0,
  };

  let remaining = totalAmount;
  for (const denom of denominations) {
    chipCounts[denom] = Math.floor(remaining / denom);
    remaining %= denom;
  }

  const allChips: Array<{ value: ChipValue; id: string }> = [];
  let id = 0;
  for (const denom of denominations) {
    for (let i = 0; i < chipCounts[denom]; i++) {
      allChips.push({ value: denom, id: `chip-${id++}` });
    }
  }

  return (
    <div className={`betting-chips ${className}`}>
      <ChipStack chips={allChips} vertical={false} />
    </div>
  );
}
