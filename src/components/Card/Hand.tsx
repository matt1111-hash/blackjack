import { motion } from 'framer-motion';
import type { Card as CardType } from '../../types';
import { Card } from './Card';
import { CardFlip } from './CardFlip';
import './Hand.css';

interface HandProps {
  cards: CardType[];
  className?: string;
  showBack?: boolean;
  spread?: boolean;
}

export function Hand({ cards, className = '', showBack = false, spread = false }: HandProps) {
  const offset = spread ? 35 : 5;

  return (
    <div className={`hand ${className}`}>
      {cards.map((card, index) => {
        const isFaceDown = showBack && index === 1;

        if (isFaceDown) {
          return (
            <motion.div
              key={`${card.suit}-${card.rank}-${index}`}
              className="hand__card-wrapper"
              style={{ left: index * offset }}
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: index * 0.1 }}
            >
              <CardFlip card={card} />
            </motion.div>
          );
        }

        return (
          <motion.div
            key={`${card.suit}-${card.rank}-${index}`}
            className="hand__card-wrapper"
            style={{ left: index * offset }}
            initial={{ x: -100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            transition={{ delay: index * 0.1 }}
          >
            <Card card={card} />
          </motion.div>
        );
      })}
    </div>
  );
}
