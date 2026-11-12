import type { ChipValue } from '../types';

/** A felbontható címletek, nagytól kicsiig. */
export const CHIP_DENOMINATIONS: readonly ChipValue[] = [500, 100, 25, 5];

/**
 * Tét felbontása fizikai zsetonokra (mohó algoritmus).
 * Az 5-nek nem osztható maradékot eldobja — tét csak 5 többszöröseiből rakható össze.
 */
export function decomposeBet(amount: number): ChipValue[] {
  const chips: ChipValue[] = [];
  let remaining = Math.max(0, Math.floor(amount));

  for (const denomination of CHIP_DENOMINATIONS) {
    while (remaining >= denomination) {
      chips.push(denomination);
      remaining -= denomination;
    }
  }

  return chips;
}
