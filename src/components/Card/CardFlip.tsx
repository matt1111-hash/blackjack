import { motion } from 'framer-motion';
import type { Card as CardType } from '../../types';
import { Card } from './Card';
import './CardFlip.css';

interface CardFlipProps {
  card: CardType;
  delay?: number;
  className?: string;
  style?: React.CSSProperties;
}

export function CardFlip({ card, delay = 0, className = '', style }: CardFlipProps) {
  return (
    <motion.div
      className={`card-flip ${className}`}
      style={style}
      initial={false}
      animate={{ rotateY: card.faceUp ? 0 : 180 }}
      transition={{ duration: 0.4, delay, ease: 'easeOut' }}
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
