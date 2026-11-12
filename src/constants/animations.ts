/** Hole card fordítás (mp) — a felfedés dramaturgiai ideje. */
export const HOLE_CARD_REVEAL_DURATION = 0.5;

/** Zseton-stack elrendezési offszetek (px). */
export const CHIP_STACK_VERTICAL_OFFSET = 4;
export const CHIP_STACK_HORIZONTAL_OFFSET = 6;

/** Animáció lépcső-késleltetések (mp). */
export const CHIP_STACK_STAGGER_DELAY = 0.05;

/** Kezdő osztás lépésköze: játékos → osztó → játékos → osztó (mp). */
export const DEAL_STAGGER_DELAY = 0.2;

/** Osztó felfedés: hole card után egylaponkénti lépésköz (mp). */
export const DEALER_REVEAL_STEP_DELAY = 0.4;

/**
 * Koreográfia sebesség-szorzó.
 * - unit teszt (MODE=test): 0 → az állapotok azonnal konvergálnak.
 * - e2e (VITE_E2E): 0.25 → a 7 kritikus 5 s-os e2e ablag bőven alá kerül.
 * - alapértelmezés: 1.
 * A szorzó KIZÁRÓLAG időzítést befolyásol — állapotot, shoe-t, kimenetelt nem.
 * prefers-reduced-motion esetén a hívó 0-ra vált (useReducedMotion).
 */
export const CHOREO_SPEED: number =
  import.meta.env.MODE === 'test' ? 0 : import.meta.env.VITE_E2E ? 0.25 : 1;
