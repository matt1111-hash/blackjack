import { AnimatePresence, motion } from 'framer-motion';
import './DealerSpeech.css';

interface DealerSpeechProps {
  line: string | null;
}

/** Az osztó beszéde-buborékja — be/kiúsző, egyszerre egy mondat (D17). */
export function DealerSpeech({ line }: DealerSpeechProps) {
  return (
    <div className="dealer-speech" role="status" aria-live="polite">
      <AnimatePresence mode="wait">
        {line && (
          <motion.div
            key={line}
            className="dealer-speech__bubble"
            initial={{ opacity: 0, y: 8, scale: 0.94 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.94 }}
            transition={{ duration: 0.22 }}
          >
            {line}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
