import { SHOE_DECKS } from '../../store/gameHelpers';
import './Shoe.css';

interface ShoeProps {
  remaining: number;
}

/** Az osztó shoe-ja — a maradék lapok magasságával (D8: penetration végre látszik). */
export function Shoe({ remaining }: ShoeProps) {
  const total = SHOE_DECKS * 52;
  const rows = Math.max(1, Math.round((Math.min(remaining, total) / total) * 6));

  return (
    <div className="shoe" aria-hidden="true">
      <div className="shoe__box">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="shoe__card-row" />
        ))}
      </div>
      <div className="shoe__label">SHOE</div>
      <div className="shoe__count">{remaining}</div>
    </div>
  );
}
