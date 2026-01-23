import { motion } from 'framer-motion';
import type { Card as CardType } from '../../types';
import { Card } from './Card';
import './CardAnimations.css';

// Card dealing animation variants - internal only
const cardDealVariants = {
  initial: {
    x: 200,
    y: -100,
    rotate: -15,
    opacity: 0,
    scale: 0.8,
  },
  dealing: {
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring',
      stiffness: 400,
      damping: 25,
    },
  },
  instant: {
    x: 0,
    y: 0,
    rotate: 0,
    opacity: 1,
    scale: 1,
  },
};

// Card flip variants - internal only
const cardFlipVariants = {
  faceDown: {
    rotateY: 180,
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
  faceUp: {
    rotateY: 0,
    transition: { duration: 0.4, ease: 'easeInOut' },
  },
};

// Hole card reveal animation - internal only
const holeCardRevealVariants = {
  hidden: {
    rotateY: 180,
    transition: { duration: 0 },
  },
  revealed: {
    rotateY: 0,
    transition: { duration: 0.5, ease: 'easeOut' },
  },
};

interface CardAnimationProps {
  card: CardType;
  index: number;
  dealing?: boolean;
  reveal?: boolean;
  className?: string;
}

export function CardAnimation({
  card,
  index,
  dealing = false,
  reveal = false,
  className = '',
}: CardAnimationProps) {
  const delay = dealing ? index * 0.15 : 0;

  // Hole card (dealer second card)
  const isHoleCard = reveal && index === 1;

  if (isHoleCard) {
    return (
      <motion.div
        className={`card-animation ${className}`}
        variants={holeCardRevealVariants}
        initial="hidden"
        animate="revealed"
        transition={{ delay: 0.5 }}
      >
        <Card card={card} />
      </motion.div>
    );
  }

  return (
    <motion.div
      className={`card-animation ${className}`}
      variants={cardDealVariants}
      initial="initial"
      animate={dealing ? 'dealing' : 'instant'}
      transition={{ delay, type: 'spring', stiffness: 400, damping: 25 }}
    >
      {dealing ? (
        <CardFlipAnimation card={card} />
      ) : (
        <Card card={card} />
      )}
    </motion.div>
  );
}

// Flip animation wrapper
function CardFlipAnimation({ card }: { card: CardType }) {
  return (
    <motion.div
      className="card-flip-container"
      variants={cardFlipVariants}
      animate={card.faceUp ? 'faceUp' : 'faceDown'}
    >
      <div className="card-flip-inner">
        <div className="card-flip-front">
          <Card card={{ ...card, faceUp: true }} />
        </div>
        <div className="card-flip-back">
          <Card card={{ ...card, faceUp: false }} />
        </div>
      </div>
    </motion.div>
  );
}
