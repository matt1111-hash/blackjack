import type { Card as CardType } from '../../types';
import './Card.css';

interface CardProps {
  card: CardType;
  className?: string;
  style?: React.CSSProperties;
}

const SUIT_SYMBOLS: Record<CardType['suit'], string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const RED_SUITS: ReadonlySet<CardType['suit']> = new Set(['hearts', 'diamonds']);
const FACE_RANKS: ReadonlySet<CardType['rank']> = new Set(['J', 'Q', 'K']);

/**
 * Játékkártya. Kaszinó-szabvány: nagy rang-index mindkét sarokban (lépcsőzött
 * kéznél is olvasható), figurás lapon keretezett rang, ászon egyetlen nagy szín.
 */
export function Card({ card, className = '', style }: CardProps) {
  if (!card.faceUp) {
    return (
      <div className={`card card--back ${className}`} style={style}>
        <div className="card__pattern" />
      </div>
    );
  }

  const suit = SUIT_SYMBOLS[card.suit];
  const tone = RED_SUITS.has(card.suit) ? 'red' : 'black';
  const isFace = FACE_RANKS.has(card.rank);

  return (
    <div className={`card card--${tone} ${className}`} style={style}>
      <div className="card__index card__index--top">
        <span className="card__rank">{card.rank}</span>
        <span className="card__suit">{suit}</span>
      </div>
      {isFace ? (
        <div className="card__face-frame">
          <span className="card__face-rank">{card.rank}</span>
          <span className="card__face-suit">{suit}</span>
        </div>
      ) : (
        <div className={`card__center ${card.rank === 'A' ? 'card__center--ace' : ''}`}>{suit}</div>
      )}
      <div className="card__index card__index--bottom">
        <span className="card__rank">{card.rank}</span>
        <span className="card__suit">{suit}</span>
      </div>
    </div>
  );
}
