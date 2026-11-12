import { describe, expect, it, vi } from 'vitest';
import { buildImpulseChannel, ensureRoomReverb, mulberry32, REVERB_PREDELAY, REVERB_WET } from './roomReverb';

function fakeContext() {
  const node = () => ({ connect: vi.fn() });
  const gain = { ...node(), gain: { value: 1 } };
  const convolver = { ...node(), buffer: null as unknown };
  const channels = [new Float32Array(8), new Float32Array(8)];
  const ctx = {
    sampleRate: 100,
    destination: {},
    createBuffer: vi.fn(() => ({ getChannelData: (i: number) => ({ set: vi.fn(() => channels[i]) }) })),
    createConvolver: vi.fn(() => convolver),
    createGain: vi.fn(() => gain),
  };
  return { ctx, gain, convolver };
}

describe('mulberry32', () => {
  it('is deterministic for a seed', () => {
    const a = mulberry32(3);
    const b = mulberry32(3);
    expect([a(), a()]).toEqual([b(), b()]);
  });
});

describe('buildImpulseChannel', () => {
  it('is silent during the pre-delay and decays afterwards', () => {
    const rate = 1000;
    const data = buildImpulseChannel(rate, 1);
    const pre = Math.floor(rate * REVERB_PREDELAY);
    expect(data[0]).toBe(0);
    expect(data[pre - 1]).toBe(0);
    const early = Math.max(...Array.from(data.slice(pre, pre + 50), Math.abs));
    const late = Math.max(...Array.from(data.slice(data.length - 50), Math.abs));
    expect(early).toBeGreaterThan(late);
  });
});

describe('ensureRoomReverb', () => {
  it('does nothing without a Web Audio context', () => {
    expect(ensureRoomReverb({})).toBe(false);
  });

  it('wires master → convolver → wet → destination exactly once', () => {
    const { ctx, gain, convolver } = fakeContext();
    const masterGain = { connect: vi.fn() };
    const host = { ctx: ctx as unknown as AudioContext, masterGain: masterGain as unknown as GainNode };

    expect(ensureRoomReverb(host)).toBe(true);
    expect(ensureRoomReverb(host)).toBe(true);

    expect(masterGain.connect).toHaveBeenCalledTimes(1);
    expect(masterGain.connect).toHaveBeenCalledWith(convolver);
    expect(convolver.connect).toHaveBeenCalledWith(gain);
    expect(gain.connect).toHaveBeenCalledWith(ctx.destination);
    expect(gain.gain.value).toBe(REVERB_WET);
  });
});
