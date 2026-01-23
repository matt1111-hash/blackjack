import { motion } from 'framer-motion';
import './Balance.css';

interface BalanceProps {
  balance: number;
  className?: string;
}

export function Balance({ balance, className = '' }: BalanceProps) {
  return (
    <motion.div
      className={`balance ${className}`}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <span className="balance__label">Balance</span>
      <span className="balance__amount">${balance.toLocaleString()}</span>
    </motion.div>
  );
}
