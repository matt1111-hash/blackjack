import { Hand } from '../Card/Hand';
import type { Hand as HandType } from '../../types';
import { calculateHandValue } from '../../logic/hand';
import './DealerArea.css';

interface DealerAreaProps {
  hand: HandType;
  showHoleCard?: boolean;
}

export function DealerArea({ hand, showHoleCard = false }: DealerAreaProps) {
  const value = calculateHandValue(hand.cards);
  const displayCards = showHoleCard ? hand.cards : hand.cards.map((c, i) => i === 1 ? { ...c, faceUp: false } : c);

  return (
    <div className="dealer-area">
      <div className="dealer-area__label">DEALER</div>
      <Hand cards={displayCards} spread />
      <div className="dealer-area__value">
        {showHoleCard || hand.cards[1]?.faceUp ? value : '?'}
      </div>
    </div>
  );
}
