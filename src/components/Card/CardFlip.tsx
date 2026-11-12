import { motion } from 'framer-motion';
import type { Card as CardType } from '../../types';
import { HOLE_CARD_REVEAL_DURATION } from '../../constants/animations';
import { Card } from './Card';
import './CardFlip.css';

interface CardFlipProps {
  card: CardType;
  /** Fordítás hossza (s) — szoros helyzetben a rendező lassítja. */
  duration?: number;
  className?: string;
}

/** Valódi 3D lapfordítás — a hole card felfedésének dramaturgiája (D10). */
export function CardFlip({ card, duration = HOLE_CARD_REVEAL_DURATION, className = '' }: CardFlipProps) {
  return (
    <motion.div
      className={`card-flip ${className}`}
      initial={false}
      animate={{ rotateY: card.faceUp ? 0 : 180 }}
      transition={{ duration, ease: [0.45, 0.05, 0.2, 1] }}
    >
      <div className="card-flip__inner">
        <div className="card-flip__front">
          <Card card={{ ...card, faceUp: true }} />
        </div>
        <div className="card-flip__back">
          <Card card={{ ...card, faceUp: false }} />
        </div>
      </div>
    </motion.div>
  );
}
