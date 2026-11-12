import { motion } from 'framer-motion';
import './HandValueBadge.css';

interface HandValueBadgeProps {
  value: number;
  isSoft: boolean;
  isBusted: boolean;
  testId: string;
  tone?: 'neutral' | 'win' | 'lose';
}

/**
 * Kézérték badge — MINDEN fázisban mutatja az értéket (D14),
 * soft kéznél „7 / 17” formátumban. Bust ág szövege e2e-szerződés: „BUST”.
 */
export function HandValueBadge({ value, isSoft, isBusted, testId, tone = 'neutral' }: HandValueBadgeProps) {
  return (
    <motion.div
      className={`hand-value-badge hand-value-badge--${isBusted ? 'busted' : tone}`}
      data-testid={testId}
      animate={tone === 'win' ? { scale: [1, 1.14, 1] } : { scale: 1 }}
      transition={{ duration: 0.35 }}
    >
      {isBusted ? 'BUST' : isSoft ? `${value - 10} / ${value}` : value}
    </motion.div>
  );
}
