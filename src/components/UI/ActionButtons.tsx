import { motion } from 'framer-motion';
import './ActionButtons.css';

interface ActionButtonsProps {
  onHit: () => void;
  onStand: () => void;
  onDouble?: () => void;
  onSplit?: () => void;
  disabled?: boolean;
  canDouble?: boolean;
  canSplit?: boolean;
}

export function ActionButtons({
  onHit,
  onStand,
  onDouble,
  onSplit,
  disabled = false,
  canDouble = false,
  canSplit = false,
}: ActionButtonsProps) {
  return (
    <div className="action-buttons">
      <motion.button
        className="action-btn action-btn--hit"
        onClick={onHit}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : undefined}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
      >
        HIT
      </motion.button>
      <motion.button
        className="action-btn action-btn--stand"
        onClick={onStand}
        disabled={disabled}
        whileHover={!disabled ? { scale: 1.05 } : undefined}
        whileTap={!disabled ? { scale: 0.95 } : undefined}
      >
        STAND
      </motion.button>
      {onDouble && (
        <motion.button
          className="action-btn action-btn--double"
          onClick={onDouble}
          disabled={disabled || !canDouble}
          whileHover={!disabled && canDouble ? { scale: 1.05 } : undefined}
          whileTap={!disabled && canDouble ? { scale: 0.95 } : undefined}
        >
          DOUBLE
        </motion.button>
      )}
      {onSplit && (
        <motion.button
          className="action-btn action-btn--split"
          onClick={onSplit}
          disabled={disabled || !canSplit}
          whileHover={!disabled && canSplit ? { scale: 1.05 } : undefined}
          whileTap={!disabled && canSplit ? { scale: 0.95 } : undefined}
        >
          SPLIT
        </motion.button>
      )}
    </div>
  );
}
