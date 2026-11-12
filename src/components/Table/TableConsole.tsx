import type { ChipValue, GamePhase } from '../../types';
import type { SessionSummary } from '../../hooks/useSessionStats';
import type { TableSpeed } from '../../hooks/useTableSpeed';
import { ActionButtons } from '../UI/ActionButtons';
import { Balance } from '../UI/Balance';
import { BetControls } from '../UI/BetControls';
import { ChipSelector } from '../UI/ChipSelector';
import { SessionStats } from '../UI/SessionStats';
import { SoundSettings } from '../UI/SoundSettings';
import './TableConsole.css';

export interface ConsoleHandlers {
  onPlaceBet: (amount: ChipValue) => void;
  onClearBet: () => void;
  onDoubleBet: () => void;
  onRebet: () => void;
  onDeal: () => void;
  onHit: () => void;
  onStand: () => void;
  onDouble: () => void;
  onSplit: () => void;
  onNewRound: () => void;
  onRebetAndDeal: () => void;
}

export interface ConsoleSettings {
  session: SessionSummary;
  coachEnabled: boolean;
  coachAccuracy: number;
  coachDecisions: number;
  onToggleCoach: () => void;
  speed: TableSpeed;
  onToggleSpeed: () => void;
  voiceEnabled: boolean;
  onToggleVoice: () => void;
}

interface TableConsoleProps {
  phase: GamePhase;
  balance: number;
  /** A körben kockán lévő teljes tét (split/double után is). */
  betOnTable: number;
  currentBet: number;
  lastBet: number;
  ready: boolean;
  canDouble: boolean;
  canSplit: boolean;
  handStanding: boolean;
  handlers: ConsoleHandlers;
  settings: ConsoleSettings;
}

/** A fázishoz illő egyetlen fő-sor: tét → döntés → következő kör. */
function MainControls({ phase, balance, currentBet, lastBet, ready, canDouble, canSplit, handStanding, handlers }: TableConsoleProps) {
  if (phase === 'betting') {
    return (
      <div className="table-console__betting">
        <ChipSelector onPlaceBet={handlers.onPlaceBet} balance={balance} />
        <div className="table-console__bet-row">
          <BetControls
            currentBet={currentBet}
            balance={balance}
            lastBet={lastBet}
            onDoubleBet={handlers.onDoubleBet}
            onRebet={handlers.onRebet}
            onClearBet={handlers.onClearBet}
          />
          {currentBet > 0 && (
            <button className="console-btn console-btn--primary" onClick={handlers.onDeal} data-testid="deal-button" aria-label="Deal">
              DEAL
            </button>
          )}
        </div>
      </div>
    );
  }

  if (!ready || phase === 'insurance') {
    return <div className="table-console__status" aria-live="polite">{phase === 'insurance' ? 'INSURANCE OPEN' : 'DEALING…'}</div>;
  }

  if (phase === 'playing') {
    return (
      <ActionButtons
        onHit={handlers.onHit}
        onStand={handlers.onStand}
        onDouble={handlers.onDouble}
        onSplit={handlers.onSplit}
        disabled={handStanding}
        canDouble={canDouble}
        canSplit={canSplit}
      />
    );
  }

  const canRebetDeal = lastBet > 0 && balance >= lastBet;
  return (
    <div className="table-console__bet-row">
      <button className="console-btn" onClick={handlers.onNewRound} data-testid="new-round-button" aria-label="New round">
        NEW BET
      </button>
      {canRebetDeal && (
        <button className="console-btn console-btn--primary" onClick={handlers.onRebetAndDeal} data-testid="rebet-deal-button">
          REBET ${lastBet.toLocaleString()} &amp; DEAL
        </button>
      )}
    </div>
  );
}

/**
 * A játékos kezelőpultja az asztal előtti peremen: bal oldalt a bank (egyenleg +
 * tét), középen az aktuális fázis egyetlen döntési sora, jobb oldalt a beállítások.
 * Egyetlen egyenleg-forrás a képernyőn.
 */
export function TableConsole(props: TableConsoleProps) {
  const { balance, betOnTable, settings } = props;

  return (
    <footer className="table-console">
      <div className="table-console__bank">
        <Balance balance={balance} />
        <div className="table-console__readout">
          <span className="table-console__readout-label">BET</span>
          <span className="table-console__readout-value" data-testid="bet-on-table">
            ${betOnTable.toLocaleString()}
          </span>
        </div>
      </div>

      <div className="table-console__main">
        <MainControls {...props} />
      </div>

      <div className="table-console__meta">
        <SessionStats summary={settings.session} />
        <div className="table-console__toggles">
          <button
            className={`console-chip ${settings.coachEnabled ? 'console-chip--on' : ''}`}
            onClick={settings.onToggleCoach}
            aria-pressed={settings.coachEnabled}
            title="Basic strategy coach"
            data-testid="coach-toggle"
          >
            COACH {settings.coachDecisions > 0 ? `${settings.coachAccuracy}%` : ''}
          </button>
          <button
            className="console-chip console-chip--on"
            onClick={settings.onToggleSpeed}
            title="Dealing pace"
            data-testid="speed-toggle"
          >
            {settings.speed === 'live' ? 'LIVE PACE' : 'FAST PACE'}
          </button>
        </div>
        <SoundSettings voiceEnabled={settings.voiceEnabled} onToggleVoice={settings.onToggleVoice} />
      </div>
    </footer>
  );
}
