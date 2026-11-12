import { motion } from 'framer-motion';
import type { ChipValue } from '../../types';
import './Chip.css';

interface ChipProps {
  value: ChipValue;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

/** Kaszinó zseton — színes test, fehér él-betétek a keréken (D2). */
export function Chip({ value, className = '', onClick, selected }: ChipProps) {
  return (
    <motion.div
      className={`chip chip-palette--${value} ${selected ? 'chip--selected' : ''} ${
        onClick ? 'chip--clickable' : ''
      } ${className}`}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.1 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      layout
    >
      {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
        <span key={index} className="chip__decoration" />
      ))}
      <span className="chip__ring" />
      <span className="chip__top">
        <span className="chip__value">${value}</span>
      </span>
    </motion.div>
  );
}
