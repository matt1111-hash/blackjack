import { afterEach, describe, expect, it, vi } from 'vitest';
import { isMuted, setMuted, subscribeMuted } from './muteStore';

describe('muteStore', () => {
  afterEach(() => {
    setMuted(false);
  });

  it('notifies every subscriber with the shared value', () => {
    const a = vi.fn();
    const b = vi.fn();
    const offA = subscribeMuted(a);
    const offB = subscribeMuted(b);

    setMuted(true);

    expect(isMuted()).toBe(true);
    expect(a).toHaveBeenCalledTimes(1);
    expect(b).toHaveBeenCalledTimes(1);
    offA();
    offB();
  });

  it('does not notify when the value does not change', () => {
    const listener = vi.fn();
    const off = subscribeMuted(listener);

    setMuted(false);

    expect(listener).not.toHaveBeenCalled();
    off();
  });

  it('persists the choice', () => {
    setMuted(true);
    expect(window.localStorage.getItem('blackjack:muted')).toBe('1');
  });

  it('stops notifying after unsubscribe', () => {
    const listener = vi.fn();
    const off = subscribeMuted(listener);
    off();

    setMuted(true);

    expect(listener).not.toHaveBeenCalled();
  });
});
