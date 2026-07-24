import { motion } from 'framer-motion';
import type { ChipValue } from '../../types';
import {
  CHIP_STACK_VERTICAL_OFFSET,
  CHIP_STACK_HORIZONTAL_OFFSET,
  CHIP_STACK_STAGGER_DELAY,
} from '../../constants/animations';
import { Chip } from './Chip';
import './ChipStack.css';

interface ChipStackProps {
  chips: Array<{ value: ChipValue; id: string }>;
  className?: string;
  vertical?: boolean;
}

export function ChipStack({ chips, className = '', vertical = true }: ChipStackProps) {
  const offset = vertical ? CHIP_STACK_VERTICAL_OFFSET : CHIP_STACK_HORIZONTAL_OFFSET;

  return (
    <div className={`chip-stack ${className}`}>
      {chips.map((chip, index) => (
        <motion.div
          key={chip.id}
          className="chip-stack__wrapper"
          style={{ [vertical ? 'bottom' : 'right']: index * offset }}
          initial={{ y: vertical ? 20 : -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: index * CHIP_STACK_STAGGER_DELAY }}
        >
          <Chip value={chip.value} />
        </motion.div>
      ))}
    </div>
  );
}
