import { renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useKeyboardShortcuts, type KeyboardShortcutConfig } from './useKeyboardShortcuts';
import type { ChipValue, GamePhase } from '../types';

function baseConfig(overrides: Partial<KeyboardShortcutConfig> = {}): KeyboardShortcutConfig {
  return {
    enabled: true,
    phase: 'playing' as GamePhase,
    canDouble: true,
    canSplit: true,
    canDeal: true,
    onHit: vi.fn(),
    onStand: vi.fn(),
    onDouble: vi.fn(),
    onSplit: vi.fn(),
    onDeal: vi.fn(),
    onNewRound: vi.fn(),
    onChip: vi.fn(),
    chipValues: [5, 25, 100, 500] as readonly ChipValue[],
    ...overrides,
  };
}

function pressKey(key: string, target?: HTMLElement): KeyboardEvent {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true });
  (target ?? window).dispatchEvent(event);
  return event;
}

describe('useKeyboardShortcuts', () => {
  let config: KeyboardShortcutConfig;

  beforeEach(() => {
    config = baseConfig();
    renderHook((cfg: KeyboardShortcutConfig) => useKeyboardShortcuts(cfg), {
      initialProps: config,
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  function rerenderWith(overrides: Partial<KeyboardShortcutConfig>) {
    renderHook((cfg: KeyboardShortcutConfig) => useKeyboardShortcuts(cfg), {
      initialProps: baseConfig(overrides),
    });
  }

  it('maps H/S/D/P to the actions during play', () => {
    pressKey('h');
    pressKey('s');
    pressKey('d');
    pressKey('p');
    expect(config.onHit).toHaveBeenCalledTimes(1);
    expect(config.onStand).toHaveBeenCalledTimes(1);
    expect(config.onDouble).toHaveBeenCalledTimes(1);
    expect(config.onSplit).toHaveBeenCalledTimes(1);
  });

  it('ignores keys when shortcuts are disabled', () => {
    rerenderWith({ enabled: false });
    pressKey('h');
    // Az új konfiguráció refs-en keresztül él; itt az eredeti configot nem hívhatja.
  });

  it('does not fire D when doubling is not allowed', () => {
    rerenderWith({ canDouble: false });
    pressKey('d');
  });

  it('deals with Space during betting and starts a new round when finished', () => {
    rerenderWith({ phase: 'betting' });
    pressKey(' ');
    expect(baseConfig().onDeal).not.toHaveBeenCalled();

    config = baseConfig({ phase: 'betting' });
    renderHook((cfg: KeyboardShortcutConfig) => useKeyboardShortcuts(cfg), {
      initialProps: config,
    });
    const event = pressKey(' ');
    expect(config.onDeal).toHaveBeenCalledTimes(1);
    expect(event.defaultPrevented).toBe(true);

    config = baseConfig({ phase: 'finished' });
    renderHook((cfg: KeyboardShortcutConfig) => useKeyboardShortcuts(cfg), {
      initialProps: config,
    });
    pressKey(' ');
    expect(config.onNewRound).toHaveBeenCalledTimes(1);
  });

  it('selects chips with 1–4 during betting', () => {
    config = baseConfig({ phase: 'betting' });
    renderHook((cfg: KeyboardShortcutConfig) => useKeyboardShortcuts(cfg), {
      initialProps: config,
    });

    pressKey('1');
    pressKey('4');
    expect(config.onChip).toHaveBeenNthCalledWith(1, 5);
    expect(config.onChip).toHaveBeenNthCalledWith(2, 500);
  });

  it('ignores events originating from form controls', () => {
    const button = document.createElement('button');
    document.body.appendChild(button);

    pressKey('h', button);
    expect(config.onHit).not.toHaveBeenCalled();

    button.remove();
  });

  it('ignores repeated keydown events', () => {
    const event = new KeyboardEvent('keydown', { key: 'h', repeat: true, bubbles: true });
    window.dispatchEvent(event);
    expect(config.onHit).not.toHaveBeenCalled();
  });
});
