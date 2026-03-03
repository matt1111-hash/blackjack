import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import './Balance.css';

interface BalanceProps {
  balance: number;
  className?: string;
}

export function Balance({ balance, className = '' }: BalanceProps) {
  const resetBalance = useGameStore((state) => state.resetBalance);
  const isLowBalance = balance < 5;

  return (
    <motion.div
      className={`balance ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="balance__label">Balance</span>
      <span className="balance__amount">${balance.toLocaleString()}</span>
      {isLowBalance && (
        <button className="balance__reset" onClick={resetBalance} title="Reset balance to $5,000">
          🔄
        </button>
      )}
    </motion.div>
  );
}
