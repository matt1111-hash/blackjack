import { describe, expect, it } from 'vitest';
import { classifyGesture, DOUBLE_TAP_MS } from './gestures';

const at = (x: number, y: number, time: number) => ({ x, y, time });

describe('classifyGesture', () => {
  it('treats a long horizontal swipe as stand', () => {
    const result = classifyGesture(at(100, 100, 0), at(200, 110, 180), null);
    expect(result.gesture).toBe('stand');
    expect(result.lastTapTime).toBeNull();
  });

  it('treats a swipe to the left as stand too', () => {
    expect(classifyGesture(at(300, 100, 0), at(210, 90, 150), null).gesture).toBe('stand');
  });

  it('ignores a mostly vertical drag', () => {
    const result = classifyGesture(at(100, 100, 0), at(180, 220, 200), null);
    expect(result.gesture).toBeNull();
    expect(result.lastTapTime).toBeNull();
  });

  it('remembers a single tap without acting', () => {
    const result = classifyGesture(at(50, 50, 1000), at(52, 51, 1100), null);
    expect(result.gesture).toBeNull();
    expect(result.lastTapTime).toBe(1100);
  });

  it('turns a second quick tap into hit', () => {
    const result = classifyGesture(at(50, 50, 1200), at(50, 50, 1250), 1100);
    expect(result.gesture).toBe('hit');
    expect(result.lastTapTime).toBeNull();
  });

  it('does not chain taps that are too far apart in time', () => {
    const late = 1100 + DOUBLE_TAP_MS + 200;
    const result = classifyGesture(at(50, 50, late - 50), at(50, 50, late), 1100);
    expect(result.gesture).toBeNull();
    expect(result.lastTapTime).toBe(late);
  });

  it('does not count a slow press as a tap', () => {
    expect(classifyGesture(at(50, 50, 0), at(50, 50, 900), 0).gesture).toBeNull();
  });
});
