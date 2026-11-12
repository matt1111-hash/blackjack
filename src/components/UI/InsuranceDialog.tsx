import { motion } from 'framer-motion';
import './InsuranceDialog.css';

interface InsuranceDialogProps {
  onBuy: () => void;
  onDecline: () => void;
  insuranceCost: number;
}

/** Biztosítási ajánlat: az osztó ászt mutat — a játékos dönt, a kör vár. */
export function InsuranceDialog({ onBuy, onDecline, insuranceCost }: InsuranceDialogProps) {
  return (
    <div className="insurance-dialog__anchor">
      <motion.div
        className="insurance-dialog"
        role="dialog"
        aria-labelledby="insurance-dialog-title"
        initial={{ scale: 0.96, opacity: 0, y: 8 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.96, opacity: 0 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        <span className="insurance-dialog__eyebrow">DEALER SHOWS AN ACE</span>
        <h2 id="insurance-dialog-title">Insurance?</h2>
        <p>
          Insurance pays 2 to 1 if the dealer has Blackjack. Cost: <strong>${insuranceCost}</strong>
        </p>
        <div className="insurance-dialog__actions">
          <button data-testid="insurance-decline" onClick={onDecline} className="console-btn">
            DECLINE
          </button>
          <button data-testid="insurance-buy" onClick={onBuy} className="console-btn console-btn--primary">
            BUY (${insuranceCost})
          </button>
        </div>
      </motion.div>
    </div>
  );
}
