import { AnimatePresence, motion } from 'framer-motion';
import { DECISION_LABELS } from '../../logic/strategy';
import type { CoachFeedback } from '../../hooks/useStrategyCoach';
import './CoachToast.css';

interface CoachToastProps {
  feedback: CoachFeedback | null;
}

/** Halk, nem blokkoló edző-jelzés: csak eltérésnél szól, magától eltűnik. */
export function CoachToast({ feedback }: CoachToastProps) {
  return (
    <div className="coach-toast" role="status" aria-live="polite">
      <AnimatePresence>
        {feedback && (
          <motion.div
            key={feedback.id}
            className="coach-toast__plate"
            data-testid="coach-feedback"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.22 }}
          >
            <span className="coach-toast__label">BASIC STRATEGY</span>
            <span className="coach-toast__optimal">{DECISION_LABELS[feedback.optimal]}</span>
            <span className="coach-toast__played">you played {DECISION_LABELS[feedback.played]}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
