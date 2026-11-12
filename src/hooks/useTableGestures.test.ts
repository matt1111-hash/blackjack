import { renderHook } from '@testing-library/react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useTableGestures } from './useTableGestures';

function pointer(x: number, y: number, time: number, extra: Partial<ReactPointerEvent> = {}): ReactPointerEvent {
  return {
    clientX: x,
    clientY: y,
    timeStamp: time,
    pointerType: 'touch',
    target: document.body,
    ...extra,
  } as unknown as ReactPointerEvent;
}

function setup(enabled = true) {
  const onHit = vi.fn();
  const onStand = vi.fn();
  const { result } = renderHook(() => useTableGestures({ enabled, onHit, onStand }));
  return { handlers: result.current, onHit, onStand };
}

describe('useTableGestures', () => {
  it('stands on a horizontal swipe', () => {
    const { handlers, onStand, onHit } = setup();

    handlers.onPointerDown(pointer(100, 300, 0));
    handlers.onPointerUp(pointer(220, 305, 160));

    expect(onStand).toHaveBeenCalledTimes(1);
    expect(onHit).not.toHaveBeenCalled();
  });

  it('hits on a double tap', () => {
    const { handlers, onHit } = setup();

    handlers.onPointerDown(pointer(100, 300, 0));
    handlers.onPointerUp(pointer(100, 300, 60));
    handlers.onPointerDown(pointer(101, 300, 160));
    handlers.onPointerUp(pointer(101, 301, 210));

    expect(onHit).toHaveBeenCalledTimes(1);
  });

  it('ignores mouse input', () => {
    const { handlers, onStand } = setup();

    handlers.onPointerDown(pointer(100, 300, 0, { pointerType: 'mouse' }));
    handlers.onPointerUp(pointer(240, 300, 150, { pointerType: 'mouse' }));

    expect(onStand).not.toHaveBeenCalled();
  });

  it('ignores gestures that start on a button', () => {
    const { handlers, onStand } = setup();
    const button = document.createElement('button');

    handlers.onPointerDown(pointer(100, 300, 0, { target: button }));
    handlers.onPointerUp(pointer(240, 300, 150));

    expect(onStand).not.toHaveBeenCalled();
  });

  it('does nothing while disabled', () => {
    const { handlers, onStand } = setup(false);

    handlers.onPointerDown(pointer(100, 300, 0));
    handlers.onPointerUp(pointer(240, 300, 150));

    expect(onStand).not.toHaveBeenCalled();
  });
});
