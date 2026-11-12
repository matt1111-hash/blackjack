import { motion } from 'framer-motion';
import type { CSSProperties } from 'react';
import type { Card as CardType } from '../../types';
import { Card } from './Card';
import { CardFlip } from './CardFlip';
import './Hand.css';

/** Kinek osztják a lapot — a repülés a shoe felől indul (asztal jobb felső sarka). */
export type HandOwner = 'dealer' | 'player';

interface HandProps {
  cards: CardType[];
  owner: HandOwner;
  className?: string;
  /** A hole card (index 1) valódi 3D fordítással jelenik meg. */
  flipHole?: boolean;
  /** A hole card megemelkedik a fordítás előtt (szoros helyzet). */
  liftHole?: boolean;
  /** A hole card fordításának hossza (s). */
  flipDuration?: number;
}

/** Indulási pont a shoe felől, a lap céljához viszonyítva (px). */
const ORIGIN: Record<HandOwner, { x: number; y: number; rotate: number }> = {
  dealer: { x: 340, y: -30, rotate: 24 },
  player: { x: 320, y: -360, rotate: 32 },
};

/** Determinisztikus „kézzel letett” elfordulás — a játékos lapjai sosem merőlegesek. */
function restRotation(owner: HandOwner, index: number): number {
  if (owner === 'dealer') return 0;
  const pattern = [-3, 2, -1.5, 2.5, -2, 1.5];
  return pattern[index % pattern.length];
}

/**
 * Kéz-elrendezés kaszinó-lépcsőzéssel: a lapok átfedik egymást, de minden
 * rang-index látszik. A játékos lapjai átlósan emelkednek; a repülő lap közelebb
 * van a kamerához (nagyobb), landoláskor felveszi a filc-árnyékot.
 */
export function Hand({ cards, owner, className = '', flipHole = false, liftHole = false, flipDuration }: HandProps) {
  const origin = ORIGIN[owner];
  const style = { '--n': Math.max(cards.length, 1) } as CSSProperties;

  return (
    <div className={`hand hand--${owner} ${className}`} style={style}>
      {cards.map((card, index) => {
        const rise = owner === 'player' ? cards.length - 1 - index : 0;
        const isHole = flipHole && index === 1;
        return (
          <motion.div
            key={`${card.suit}-${card.rank}-${index}`}
            className="hand__card-wrapper"
            style={{
              left: `calc(var(--hand-step) * ${index})`,
              top: `calc(var(--hand-rise) * ${rise})`,
              zIndex: index,
            }}
            initial={{ x: origin.x, y: origin.y, rotate: origin.rotate, scale: 1.14, opacity: 0 }}
            animate={{ x: 0, y: 0, rotate: restRotation(owner, index), scale: 1, opacity: 1 }}
            transition={{ type: 'spring', stiffness: 230, damping: 27, mass: 0.85 }}
          >
            <div className={`hand__lift ${isHole && liftHole ? 'hand__lift--up' : ''}`}>
              {isHole ? <CardFlip card={card} duration={flipDuration} /> : <Card card={card} />}
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
