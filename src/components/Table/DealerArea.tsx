import { Hand } from '../Card/Hand';
import { DealerAvatar } from '../Avatar/DealerAvatar';
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

  // Determine dealer mood based on hand value
  const getDealerMood = (): 'neutral' | 'happy' | 'serious' => {
    if (!showHoleCard) return 'neutral';
    if (value >= 17 && value <= 21) return 'serious';
    if (value > 21) return 'neutral';
    return 'serious';
  };

  return (
    <div className="dealer-area">
      <DealerAvatar mood={getDealerMood()} size={56} />
      <div className="dealer-area__label">DEALER</div>
      <Hand cards={displayCards} spread />
      <div className="dealer-area__value">
        {(showHoleCard || hand.cards[1]?.faceUp) ? value : '?'}
      </div>
    </div>
  );
}
