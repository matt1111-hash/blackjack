import { describe, expect, it } from 'vitest';
import { pickTake, voiceSources, VOICE_TAKES, VOICED_LINE_KEYS } from './voiceLines';

describe('pickTake', () => {
  it('never repeats the previous take', () => {
    for (let previous = 1; previous <= 3; previous++) {
      for (const r of [0, 0.4, 0.99]) {
        expect(pickTake(previous, 3, () => r)).not.toBe(previous);
      }
    }
  });

  it('covers every other take across the random range', () => {
    const seen = new Set([0, 0.6].map((r) => pickTake(2, 3, () => r)));
    expect(seen).toEqual(new Set([1, 3]));
  });

  it('always returns 1 for a single take', () => {
    expect(pickTake(1, 1)).toBe(1);
  });

  it('can pick any take on the first call', () => {
    expect(pickTake(undefined, 3, () => 0.99)).toBe(3);
  });
});

describe('voiceSources', () => {
  it('points English lines to the neural takes', () => {
    expect(voiceSources('placeBets', 'en', 2)).toEqual([
      '/sounds/voice/placeBets.en.2.ogg',
      '/sounds/voice/placeBets.en.2.mp3',
    ]);
  });

  it('keeps Hungarian lines on the single espeak file', () => {
    expect(voiceSources('push', 'hu', 3)).toEqual(['/sounds/voice/push.hu.ogg', '/sounds/voice/push.hu.mp3']);
  });

  it('has every referenced English take on disk', () => {
    // Vite statikus glob: a kulcsok a lemezen lévő fájlok (betöltés nélkül).
    const onDisk = new Set(
      Object.keys(import.meta.glob('../../public/sounds/voice/*.en.*')).map((path) =>
        path.replace('../../public', ''),
      ),
    );
    const missing: string[] = [];
    for (const key of VOICED_LINE_KEYS) {
      for (let take = 1; take <= VOICE_TAKES; take++) {
        missing.push(...voiceSources(key, 'en', take).filter((src) => !onDisk.has(src)));
      }
    }
    expect(onDisk.size).toBeGreaterThan(0);
    expect(missing).toEqual([]);
  });
});
