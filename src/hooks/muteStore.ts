/**
 * Egyetlen mester-mute forrás (Q-01 gyökér ok javítása): korábban minden
 * useSound-példány saját React-state-ben tartotta az isMuted-et, így a
 * SoundSettings némítása nem jutott el az osztó hangjához. Ez a modul egy
 * külső store (useSyncExternalStore-kompatibilis) — minden olvasó ugyanazt látja.
 */
type Listener = () => void;

const STORAGE_KEY = 'blackjack:muted';

function readInitial(): boolean {
  try {
    return typeof window !== 'undefined' && window.localStorage.getItem(STORAGE_KEY) === '1';
  } catch {
    return false;
  }
}

let muted = readInitial();
const listeners = new Set<Listener>();

export function isMuted(): boolean {
  return muted;
}

export function setMuted(next: boolean): void {
  if (next === muted) return;
  muted = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, next ? '1' : '0');
  } catch {
    // privát mód / tiltott storage — a session-en belül így is működik
  }
  listeners.forEach((listener) => listener());
}

export function subscribeMuted(listener: Listener): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
