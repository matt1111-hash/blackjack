import { Howl } from 'howler';
import type { DealerLineKey, DealerLineLang } from '../logic/dealerLines';

/**
 * Az osztó mondatai ELŐRE LEGENERÁLT hangfájlokkal (Brave és a beágyazott
 * böngészők gyakran nem kínálnak TTS-hangokat — a Web Speech ott néma).
 * - angol: neurális hang (Piper, en_US-joe-medium, CC0), mondatonként
 *   VOICE_TAKES felvétel — scripts/generate_voice_lines_neural.py;
 * - magyar: espeak-ng — scripts/generate_voice_lines.py.
 * A dealerTotal kimarad: érték-template, a játékmenetben sosem hangzik el.
 */
export const VOICED_LINE_KEYS: readonly DealerLineKey[] = [
  'placeBets',
  'noMoreBets',
  'insuranceOpen',
  'blackjackPays',
  'playerBust',
  'dealerBust',
  'playerWins',
  'houseWins',
  'push',
  'newShoe',
];

/** Ennyi felvétel készül mondatonként (angol, neurális hang). */
export const VOICE_TAKES = 3;

/** Van-e a kulcshoz generált hang? */
export function hasVoiceFile(key: DealerLineKey): boolean {
  return VOICED_LINE_KEYS.includes(key);
}

/**
 * Véletlen felvétel 1..takes között, de sosem ugyanaz kétszer egymás után —
 * a „Place your bets” így nem gépi ismétlés.
 */
export function pickTake(previous: number | undefined, takes: number, random: () => number = Math.random): number {
  if (takes <= 1) return 1;
  const pool = Array.from({ length: takes }, (_, i) => i + 1).filter((take) => take !== previous);
  return pool[Math.min(pool.length - 1, Math.floor(random() * pool.length))];
}

/** A lejátszandó források (ogg + mp3 fallback) nyelv és felvétel szerint. */
export function voiceSources(key: DealerLineKey, lang: DealerLineLang, take: number): string[] {
  const base = lang === 'en' ? `/sounds/voice/${key}.en.${take}` : `/sounds/voice/${key}.${lang}`;
  return [`${base}.ogg`, `${base}.mp3`];
}

const howls = new Map<string, Howl>();
const lastTake = new Map<string, number>();

/**
 * Előre generált osztó-mondat lejátszása. Ismeretlen kulcsnál csendesen
 * nem csinál semmit. A globális mute/Volume és a terem-zengés (Howler
 * masterGain) automatikusan érvényesül.
 */
export function speakDealerLine(key: DealerLineKey, lang: DealerLineLang = 'en'): void {
  if (!hasVoiceFile(key)) return;
  const lineId = `${key}.${lang}`;
  const take = lang === 'en' ? pickTake(lastTake.get(lineId), VOICE_TAKES) : 1;
  lastTake.set(lineId, take);

  const id = `${lineId}.${take}`;
  let howl = howls.get(id);
  if (!howl) {
    howl = new Howl({ src: voiceSources(key, lang, take), volume: 0.95 });
    howls.set(id, howl);
  }
  howl.play();
}

/** Teardown tesztekhez / teljes resethez. */
export function unloadVoiceLines(): void {
  howls.forEach((howl) => howl.unload());
  howls.clear();
  lastTake.clear();
}
