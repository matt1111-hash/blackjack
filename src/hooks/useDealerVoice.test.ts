import { act, renderHook, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { readVoiceEnabled, useDealerVoice, writeVoiceEnabled } from './useDealerVoice';
import { speakDealerLine, hasVoiceFile, VOICED_LINE_KEYS } from './voiceLines';
import type { DealerLineKey } from '../logic/dealerLines';

const MOCK_VOICED_KEYS = vi.hoisted(() =>
  [
    'placeBets', 'noMoreBets', 'insuranceOpen', 'blackjackPays', 'playerBust',
    'dealerBust', 'playerWins', 'houseWins', 'push', 'newShoe',
  ] as import('../logic/dealerLines').DealerLineKey[],
);

vi.mock('./voiceLines', () => ({
  speakDealerLine: vi.fn(),
  hasVoiceFile: (key: DealerLineKey) => MOCK_VOICED_KEYS.includes(key),
  VOICED_LINE_KEYS: MOCK_VOICED_KEYS,
}));

function installFakeSpeech(voiceCount: number) {
  const spoken: string[] = [];
  const synth = {
    cancel: vi.fn(),
    speak: vi.fn((utterance: SpeechSynthesisUtterance) => spoken.push(utterance.text)),
    getVoices: vi.fn(() => Array.from({ length: voiceCount }, () => ({}))),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  };
  vi.stubGlobal('speechSynthesis', synth);
  vi.stubGlobal(
    'SpeechSynthesisUtterance',
    class {
      text: string;
      lang = '';
      rate = 1;
      pitch = 1;
      volume = 1;
      constructor(text: string) {
        this.text = text;
      }
    },
  );
  return { spoken, synth };
}

describe('useDealerVoice', () => {
  beforeEach(() => {
    window.localStorage.clear();
    vi.mocked(speakDealerLine).mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it('prefers TTS when the browser offers voices', async () => {
    const { spoken } = installFakeSpeech(2);
    const { result } = renderHook(
      ({ text }: { text: string | null }) =>
        useDealerVoice({ lineKey: 'placeBets', text, enabled: true, muted: false }),
      { initialProps: { text: 'Place your bets' } },
    );

    await waitFor(() => expect(result.current.engine).toBe('tts'));
    await waitFor(() => expect(spoken).toEqual(['Place your bets']));
    expect(vi.mocked(speakDealerLine)).not.toHaveBeenCalled();
  });

  it('falls back to generated audio files without voices (Brave case)', async () => {
    installFakeSpeech(0);
    renderHook(() =>
      useDealerVoice({ lineKey: 'placeBets', text: 'Place your bets', enabled: true, muted: false }),
    );

    await waitFor(() => expect(vi.mocked(speakDealerLine)).toHaveBeenCalledWith('placeBets', 'en'));
  });

  it('uses audio even without speechSynthesis at all', async () => {
    vi.stubGlobal('speechSynthesis', undefined);
    renderHook(() =>
      useDealerVoice({ lineKey: 'dealerBust', text: 'Dealer busts', enabled: true, muted: false }),
    );
    await waitFor(() => expect(vi.mocked(speakDealerLine)).toHaveBeenCalledWith('dealerBust', 'en'));
  });

  it('stays silent while muted or disabled', () => {
    installFakeSpeech(0);
    renderHook(() => useDealerVoice({ lineKey: 'placeBets', text: 'x', enabled: true, muted: true }));
    renderHook(() => useDealerVoice({ lineKey: 'placeBets', text: 'x', enabled: false, muted: false }));
    expect(vi.mocked(speakDealerLine)).not.toHaveBeenCalled();
  });

  it('skips unvoiced keys in the audio engine', async () => {
    vi.stubGlobal('speechSynthesis', undefined);
    renderHook(() =>
      useDealerVoice({ lineKey: 'dealerTotal', text: 'Dealer has 17', enabled: true, muted: false }),
    );
    // Megvárjuk, hogy a probe lezáruljon — utána sem szabadott megszólalnia.
    await act(async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
    });
    expect(vi.mocked(speakDealerLine)).not.toHaveBeenCalled();
  });

  it('persists the voice preference', () => {
    installFakeSpeech(0);
    const { result } = renderHook(() =>
      useDealerVoice({ lineKey: null, text: null, enabled: true, muted: false }),
    );

    expect(result.current.voiceOn).toBe(true);
    act(() => result.current.toggle());
    expect(result.current.voiceOn).toBe(false);
    expect(readVoiceEnabled()).toBe(false);

    act(() => result.current.toggle());
    expect(readVoiceEnabled()).toBe(true);
    writeVoiceEnabled(false);
    expect(readVoiceEnabled()).toBe(false);
  });
});

describe('voiceLines', () => {
  it('every gameplay line has a generated voice file', () => {
    expect(hasVoiceFile('placeBets')).toBe(true);
    expect(hasVoiceFile('newShoe')).toBe(true);
    expect(hasVoiceFile('dealerTotal')).toBe(false);
    expect(VOICED_LINE_KEYS).toHaveLength(10);
  });
});
