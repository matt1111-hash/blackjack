import type { SessionSummary } from '../../hooks/useSessionStats';
import './SessionStats.css';

interface SessionStatsProps {
  summary: SessionSummary;
}

function streakLabel(streak: number): string {
  if (streak > 1) return `W${streak}`;
  if (streak < -1) return `L${-streak}`;
  return '–';
}

/** Halk session-sáv: körök, nyerési arány, legnagyobb nyeremény, széria (Fázis 7). */
export function SessionStats({ summary }: SessionStatsProps) {
  if (summary.rounds === 0) return null;

  return (
    <div className="session-stats" aria-label="Session statistics">
      <span className="session-stats__item">
        {summary.rounds} {summary.rounds === 1 ? 'round' : 'rounds'}
      </span>
      <span className="session-stats__dot">·</span>
      <span className="session-stats__item">{summary.winRate}% win</span>
      <span className="session-stats__dot">·</span>
      <span className="session-stats__item">best ${summary.bestWin}</span>
      <span className="session-stats__dot">·</span>
      <span className="session-stats__item">streak {streakLabel(summary.streak)}</span>
    </div>
  );
}
