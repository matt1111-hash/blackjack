import { Hand } from '../Card/Hand';
import type { Hand as HandType } from '../../types';
import { calculateHandDetails } from '../../logic/hand';
import './DealerArea.css';

interface DealerAreaProps {
  hand: HandType;
  /** Hány lap látszik az asztalon (osztási koreográfia / felfedés szabályozza). */
  visibleCount?: number;
  /** A hole card felfedve — a 3D fordítás lejátszódott? */
  holeRevealed?: boolean;
  /** Szoros helyzet: a hole card megemelkedik a fordítás előtt. */
  liftHole?: boolean;
  /** A hole card fordításának hossza (s). */
  flipDuration?: number;
}

/**
 * Az osztó lapjai a perem előtt. Az érték-jelző a felfordított lapok összegét
 * mutatja (élő kaszinó-UI szabvány), a hole card felfedése után a teljes kezet.
 */
export function DealerArea({
  hand,
  visibleCount,
  holeRevealed = false,
  liftHole = false,
  flipDuration,
}: DealerAreaProps) {
  const limit = visibleCount ?? hand.cards.length;
  const displayCards = hand.cards
    .slice(0, limit)
    .map((card, index) => (index === 1 && !holeRevealed ? { ...card, faceUp: false } : card));

  const faceUpCards = displayCards.filter((card) => card.faceUp);
  const { value, isSoft } = calculateHandDetails(faceUpCards);
  // Felfedés előtt a puha érték kaszinó-írásmóddal (ász: „1 / 11”), utána a végösszeg.
  const label = isSoft && !holeRevealed ? `${value - 10} / ${value}` : String(value);
  const busted = hand.isBusted && holeRevealed && limit >= hand.cards.length;

  return (
    <div className="dealer-area" data-testid="dealer-area">
      <div className="dealer-area__cards">
        <Hand cards={displayCards} owner="dealer" flipHole liftHole={liftHole} flipDuration={flipDuration} />
        {faceUpCards.length > 0 && (
          <div
            className={`dealer-area__value ${busted ? 'dealer-area__value--bust' : ''}`}
            data-testid="dealer-value"
          >
            {label}
          </div>
        )}
      </div>
      {busted && <div className="dealer-area__bust">DEALER BUST</div>}
    </div>
  );
}
