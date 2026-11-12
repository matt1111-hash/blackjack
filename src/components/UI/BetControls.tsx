import './BetControls.css';

interface BetControlsProps {
  currentBet: number;
  balance: number;
  lastBet: number;
  onDoubleBet: () => void;
  onRebet: () => void;
  onClearBet?: () => void;
}

/**
 * Tét-vezérlők (Fázis 3/7): CLEAR — mindig látszik betting fázisban,
 * tét nélkül letiltva; REBET — az előző kör tétje; DOUBLE BET — megduplázás.
 */
export function BetControls({ currentBet, balance, lastBet, onDoubleBet, onRebet, onClearBet }: BetControlsProps) {
  const canClear = !!onClearBet;
  const canDouble = currentBet > 0 && balance >= currentBet;
  const canRebet = currentBet === 0 && lastBet > 0 && balance >= lastBet;

  if (!canDouble && !canRebet && !canClear) return null;

  return (
    <div className="bet-controls">
      {canClear && (
        <button
          className="bet-controls__btn bet-controls__btn--clear"
          onClick={onClearBet}
          disabled={currentBet === 0}
          data-testid="bet-clear"
        >
          CLEAR
        </button>
      )}
      {canRebet && (
        <button className="bet-controls__btn" onClick={onRebet} data-testid="bet-rebet">
          REBET ${lastBet}
        </button>
      )}
      {canDouble && (
        <button className="bet-controls__btn bet-controls__btn--double" onClick={onDoubleBet} data-testid="bet-double">
          DOUBLE BET
        </button>
      )}
    </div>
  );
}
