import { motion } from 'framer-motion';
import { useGameStore } from '../../store/gameStore';
import { useCountUp } from '../../hooks/useCountUp';
import './Balance.css';

interface BalanceProps {
  balance: number;
  className?: string;
}

/** Egyenleg-panel rugós felszámolással — ugrás helyett (D12 / Fázis 3). */
export function Balance({ balance, className = '' }: BalanceProps) {
  const resetBalance = useGameStore((state) => state.resetBalance);
  const isLowBalance = balance < 5;
  const displayBalance = useCountUp(balance, 600);

  return (
    <motion.div
      className={`balance ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="balance__label">Balance</span>
      <span className="balance__amount" data-testid="balance-amount">
        ${displayBalance.toLocaleString()}
      </span>
      {isLowBalance && (
        <button
          data-testid="balance-reset"
          className="balance__reset"
          onClick={resetBalance}
          title="Reset balance to $5,000"
        >
          🔄
        </button>
      )}
    </motion.div>
  );
}
