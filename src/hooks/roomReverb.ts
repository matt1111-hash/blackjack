/**
 * Közös terem-akusztika: minden Web Audio-hang (lap, zseton, eredmény) ugyanazon
 * a szintetizált „kaszinóterem” lecsengésen megy át, így egy térből szólnak,
 * nem külön-külön a fülhallgatóból. A jelút:
 *   masterGain ─┬─► destination              (száraz jel)
 *               └─► convolver ─► wet ─► destination  (lecsengés)
 * Az impulzusválasz determinisztikus (seedelt zaj) — nincs külső asset.
 */

/** A zengés aránya a száraz jelhez. */
export const REVERB_WET = 0.16;
/** Lecsengés hossza másodpercben (közepes, szőnyeges terem). */
export const REVERB_SECONDS = 1.1;
/** Korai visszaverődés előtti szünet (s). */
export const REVERB_PREDELAY = 0.018;

/** Kis, determinisztikus PRNG — a lecsengés minden futásnál ugyanaz. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Egy csatorna impulzusválasza: pre-delay + exponenciálisan csengő zaj. */
export function buildImpulseChannel(sampleRate: number, seed: number): Float32Array {
  const length = Math.floor(sampleRate * REVERB_SECONDS);
  const preDelay = Math.floor(sampleRate * REVERB_PREDELAY);
  const data = new Float32Array(length);
  const random = mulberry32(seed);
  for (let i = preDelay; i < length; i++) {
    const t = (i - preDelay) / (length - preDelay);
    // Gyors kezdeti esés + hosszú farok: szőnyeg/függöny elnyelte terem.
    const envelope = Math.pow(1 - t, 3.2) * (0.55 + 0.45 * Math.exp(-t * 9));
    data[i] = (random() * 2 - 1) * envelope;
  }
  return data;
}

interface ReverbHost {
  ctx?: AudioContext;
  masterGain?: GainNode;
}

const wired = new WeakSet<AudioContext>();

/**
 * Idempotens bekötés a Howler globális lánca közé. Ha nincs Web Audio
 * (html5-mód, jsdom, régi böngésző), csendben nem csinál semmit.
 */
export function ensureRoomReverb(host: ReverbHost): boolean {
  const { ctx, masterGain } = host;
  if (!ctx || !masterGain || typeof ctx.createConvolver !== 'function') return false;
  if (wired.has(ctx)) return true;

  const impulse = ctx.createBuffer(2, Math.floor(ctx.sampleRate * REVERB_SECONDS), ctx.sampleRate);
  impulse.getChannelData(0).set(buildImpulseChannel(ctx.sampleRate, 7));
  impulse.getChannelData(1).set(buildImpulseChannel(ctx.sampleRate, 11));

  const convolver = ctx.createConvolver();
  convolver.buffer = impulse;
  const wet = ctx.createGain();
  wet.gain.value = REVERB_WET;

  masterGain.connect(convolver);
  convolver.connect(wet);
  wet.connect(ctx.destination);
  wired.add(ctx);
  return true;
}
