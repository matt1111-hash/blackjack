import { useMemo } from 'react';
import { motion } from 'framer-motion';
import { decomposeBet } from '../../logic/chips';
import { Chip } from './Chip';
import './BetStack.css';

/** Honnan érkezik a stack: a játékos kezéből (tét) vagy az osztó tálcájából (kifizetés). */
export type StackSource = 'player' | 'dealer';

interface BetStackProps {
  amount: number;
  /** Kör kimenete: vesztésnél az osztó felé söpri; nyerésnél enyhe koccanás. */
  outcome?: 'win' | 'lose' | null;
  source?: StackSource;
  /** A felirat (összeg) megjelenítése. */
  showAmount?: boolean;
  testId?: string;
}

/** Zsetononkénti oszlop-lépés (px) — a lapított zseton éle így látszik. */
const STACK_STEP = 7;

/** Determinisztikus kézi pontatlanság — a stack nem gépi oszlop. */
function jitterX(seed: number): number {
  return ((seed * 37) % 5) - 2;
}

/**
 * A tét mint fizikai, oldalról látott zseton-oszlop: legnagyobb címlet alul,
 * minden zsetonnak látható éle van. A belépés a forrás felől ívben érkezik.
 */
export function BetStack({ amount, outcome = null, source = 'player', showAmount = true, testId }: BetStackProps) {
  // Kaszinó-rakás: a nagy címlet kerül alulra.
  const chips = useMemo(() => [...decomposeBet(amount)].sort((a, b) => b - a), [amount]);
  const fromY = source === 'dealer' ? -280 : 240;

  return (
    <div
      className={`bet-stack bet-stack--${source}`}
      aria-label={`Bet: $${amount}`}
      data-testid={testId}
      style={{ height: 46 + Math.min(chips.length, 12) * STACK_STEP }}
    >
      {chips.slice(0, 12).map((value, index) => {
        const x = jitterX(index + value);
        return (
          <motion.div
            key={`${value}-${index}`}
            className="bet-stack__chip"
            style={{ bottom: index * STACK_STEP, zIndex: index }}
            initial={{ x: x * 4, y: fromY, opacity: 0 }}
            animate={
              outcome === 'lose'
                ? { x: 40, y: -240, opacity: 0 }
                : outcome === 'win'
                  ? { x, y: [0, -6, 0], opacity: 1 }
                  : { x, y: 0, opacity: 1 }
            }
            transition={
              outcome === 'lose'
                ? { duration: 0.5, delay: 0.15 + index * 0.03, ease: [0.5, 0, 0.75, 0] }
                : outcome === 'win'
                  ? { duration: 0.35, delay: index * 0.02 }
                  : { type: 'spring', stiffness: 260, damping: 24, delay: index * 0.045 }
            }
          >
            <div className="bet-stack__tilt">
              <Chip value={value} />
            </div>
          </motion.div>
        );
      })}
      {showAmount && amount > 0 && <div className="bet-stack__amount">${amount.toLocaleString()}</div>}
    </div>
  );
}
