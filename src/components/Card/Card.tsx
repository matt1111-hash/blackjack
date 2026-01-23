import type { Card as CardType } from '../../types';
import './Card.css';

interface CardProps {
  card: CardType;
  className?: string;
  style?: React.CSSProperties;
}

const RANK_SYMBOLS: Record<string, string> = {
  A: 'A',
  K: 'K',
  Q: 'Q',
  J: 'J',
  '10': '10',
  '9': '9',
  '8': '8',
  '7': '7',
  '6': '6',
  '5': '5',
  '4': '4',
  '3': '3',
  '2': '2',
};

const SUIT_SYMBOLS: Record<string, string> = {
  hearts: '♥',
  diamonds: '♦',
  clubs: '♣',
  spades: '♠',
};

const SUIT_COLORS: Record<string, string> = {
  hearts: '#dc2626',
  diamonds: '#dc2626',
  clubs: '#1f2937',
  spades: '#1f2937',
};

export function Card({ card, className = '', style }: CardProps) {
  const suitSymbol = SUIT_SYMBOLS[card.suit];
  const suitColor = SUIT_COLORS[card.suit];

  if (!card.faceUp) {
    return (
      <div className={`card card--back ${className}`} style={style}>
        <div className="card__pattern" />
      </div>
    );
  }

  return (
    <div className={`card ${className}`} style={style}>
      <div className="card__corner card__corner--top">
        <span className="card__rank">{RANK_SYMBOLS[card.rank]}</span>
        <span className="card__suit" style={{ color: suitColor }}>{suitSymbol}</span>
      </div>
      <div className="card__center" style={{ color: suitColor }}>
        {suitSymbol}
      </div>
      <div className="card__corner card__corner--bottom">
        <span className="card__rank">{RANK_SYMBOLS[card.rank]}</span>
        <span className="card__suit" style={{ color: suitColor }}>{suitSymbol}</span>
      </div>
    </div>
  );
}
