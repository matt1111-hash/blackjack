import { motion } from 'framer-motion';
import type { ChipValue } from '../../types';
import { CHIP_COLORS } from '../../types';
import './Chip.css';

interface ChipProps {
  value: ChipValue;
  className?: string;
  onClick?: () => void;
  selected?: boolean;
}

export function Chip({ value, className = '', onClick, selected }: ChipProps) {
  const color = CHIP_COLORS[value];

  return (
    <motion.div
      className={`chip ${selected ? 'chip--selected' : ''} ${onClick ? 'chip--clickable' : ''} ${className}`}
      style={{ '--chip-color': color } as React.CSSProperties}
      onClick={onClick}
      whileHover={onClick ? { scale: 1.1 } : undefined}
      whileTap={onClick ? { scale: 0.95 } : undefined}
      layout
    >
      <div className="chip__edge" />
      <div className="chip__top">
        <span className="chip__value">${value}</span>
        <div className="chip__decorations">
          {[0, 1, 2, 3, 4, 5, 6, 7].map((index) => (
            <span key={index} className="chip__decoration" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}
