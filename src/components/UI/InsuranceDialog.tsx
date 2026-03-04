import { motion } from 'framer-motion';
import './InsuranceDialog.css';

interface InsuranceDialogProps {
  onBuy: () => void;
  onDecline: () => void;
  insuranceCost: number;
}

export function InsuranceDialog({ onBuy, onDecline, insuranceCost }: InsuranceDialogProps) {
  return (
    <motion.div
      className="insurance-dialog"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0.8, opacity: 0 }}
      transition={{ type: 'spring', bounce: 0.4 }}
    >
      <motion.div
        className="insurance-dialog__icon"
        animate={{ scale: [1, 1.2, 1] }}
        transition={{ repeat: Infinity, duration: 2 }}
      >
        🛡️
      </motion.div>
      <h2>
        Insurance?
      </h2>
      <p>
        Dealer shows an Ace. Protect your hand against Blackjack for <strong>${insuranceCost}</strong>?
      </p>
      <div className="insurance-dialog__actions">
        <motion.button
          onClick={onBuy}
          className="insurance-dialog__btn-buy"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          BUY (${insuranceCost})
        </motion.button>
        <motion.button
          onClick={onDecline}
          className="insurance-dialog__btn-decline"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          DECLINE
        </motion.button>
      </div>
    </motion.div>
  );
}
