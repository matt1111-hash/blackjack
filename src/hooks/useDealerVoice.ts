import { useEffect, useRef, useState } from 'react';
import type { DealerLineKey, DealerLineLang } from '../logic/dealerLines';
import { speakDealerLine, hasVoiceFile } from './voiceLines';

const VOICE_STORAGE_KEY = 'blackjack:dealer-voice';

export function readVoiceEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  return window.localStorage.getItem(VOICE_STORAGE_KEY) !== 'off';
}

export function writeVoiceEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(VOICE_STORAGE_KEY, enabled ? 'on' : 'off');
}

export interface DealerVoiceOptions {
  /** A mondát azonosító kulcs — a generált hangfájlok kulcsa. */
  lineKey: DealerLineKey | null;
  /** A megjelenített mondat szövege (TTS ág használja). */
  text: string | null;
  lang?: DealerLineLang;
  enabled: boolean;
  /** Mester-mute alatt az osztó sem beszél. */
  muted: boolean;
}

/** 'tts' ha a böngésző valóban kínál hangokat; egyébként 'audio' fájl. */
export type VoiceEngine = 'tts' | 'audio';

/**
 * Az osztó hangja kétmotorúan:
 * - TTS (Web Speech), HA a böngésző ténylegesen ad hangokat (Brave és a
 *   beágyazott böngészők gyakran nem — náluk a speak() néma marad);
 * - egyébként az előre generált hangfájl (minden böngészőben megszólal).
 * A választás a voiceschanged esemény után véglegesedik.
 */
export function useDealerVoice({
  lineKey,
  text,
  lang = 'en',
  enabled,
  muted,
}: DealerVoiceOptions) {
  const [voiceOn, setVoiceOn] = useState(readVoiceEnabled);
  const [engine, setEngine] = useState<VoiceEngine>('audio');
  const [engineReady, setEngineReady] = useState(false);
  const lastSpokenRef = useRef<string | null>(null);

  // Motor-detektálás: csak akkor hiszünk a TTS-nek, ha hang is van mögötte.
  // A voiceschanged késve is jöhet — 350 ms probe-ablak után döntünk.
  useEffect(() => {
    const synth = typeof window !== 'undefined' ? window.speechSynthesis : undefined;

    const check = () => {
      if (synth && synth.getVoices().length > 0) setEngine('tts');
    };

    if (!synth) {
      const timer = window.setTimeout(() => setEngineReady(true), 0);
      return () => window.clearTimeout(timer);
    }

    check();
    const readyDelay = synth.getVoices().length > 0 ? 0 : 350;
    const timer = window.setTimeout(() => {
      check();
      setEngineReady(true);
    }, readyDelay);
    synth.addEventListener?.('voiceschanged', check);
    return () => {
      window.clearTimeout(timer);
      synth.removeEventListener?.('voiceschanged', check);
    };
  }, []);

  useEffect(() => {
    if (!engineReady || !lineKey || !enabled || !voiceOn || muted) return;

    if (engine === 'tts' && text) {
      if (lastSpokenRef.current === text) return;
      lastSpokenRef.current = text;
      const synth = window.speechSynthesis;
      if (!synth) return;
      synth.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang === 'hu' ? 'hu-HU' : 'en-US';
      utterance.rate = 1.02;
      utterance.pitch = 0.85;
      utterance.volume = 0.9;
      synth.speak(utterance);
      return;
    }

    // Audio fallback: fájl-alapú, kulcsonként egyszer.
    if (lastSpokenRef.current === lineKey) return;
    lastSpokenRef.current = lineKey;
    if (hasVoiceFile(lineKey)) {
      speakDealerLine(lineKey, lang);
    }
  }, [lineKey, text, lang, engine, engineReady, enabled, voiceOn, muted]);

  const toggle = () => {
    setVoiceOn((prev) => {
      writeVoiceEnabled(!prev);
      return !prev;
    });
  };

  return { voiceOn, engine, toggle };
}
