import './DiscardTray.css';

interface DiscardTrayProps {
  discarded: number;
}

/** Elhasznált lapok tálcája — telik a körök során (D8). */
export function DiscardTray({ discarded }: DiscardTrayProps) {
  const rows = Math.min(6, Math.max(0, Math.round(discarded / 52)));

  return (
    <div className="discard-tray" aria-hidden="true">
      <div className="discard-tray__box">
        {Array.from({ length: rows }).map((_, index) => (
          <div key={index} className="discard-tray__card-row" />
        ))}
      </div>
      <div className="discard-tray__label">DISCARD</div>
    </div>
  );
}
