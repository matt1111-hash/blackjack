import { motion, type Variants } from 'framer-motion';
import type { Card as CardType } from '../../types';
import { Card } from './Card';
import './CardAnimations.css';

// Card dealing animation variants - 3D enhanced
const cardDealVariants: Variants = {
  initial: {
    x: 250,
    y: -180,
    z: 200,
    rotate: -20,
    rotateX: 15,
    opacity: 0,
    scale: 0.7,
  },
  dealing: {
    x: 0,
    y: 0,
    z: 0,
    rotate: 0,
    rotateX: 0,
    opacity: 1,
    scale: 1,
    transition: {
      type: 'spring' as const,
      stiffness: 350,
      damping: 25,
    },
  },
  instant: {
    x: 0,
    y: 0,
    z: 0,
    rotate: 0,
    rotateX: 0,
    opacity: 1,
    scale: 1,
  },
};

// Card flip variants - internal only
const cardFlipVariants: Variants = {
  faceDown: {
    rotateY: 180,
    transition: { duration: 0.4, ease: 'easeInOut' as const },
  },
  faceUp: {
    rotateY: 0,
    transition: { duration: 0.4, ease: 'easeInOut' as const },
  },
};

// Hole card reveal animation - internal only
const holeCardRevealVariants: Variants = {
  hidden: {
    rotateY: 180,
    transition: { duration: 0 },
  },
  revealed: {
    rotateY: 0,
    transition: { duration: 0.5, ease: 'easeOut' as const },
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
        style={{ transformStyle: 'preserve-3d' }}
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
      style={{ transformStyle: 'preserve-3d' }}
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
      style={{ transformStyle: 'preserve-3d' }}
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
