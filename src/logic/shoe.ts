/** Újrakeverés-detektálás: a shoe a 25%-os küszöb alá ért, majd megtelt. */
export function didReshuffle(
  previousRemaining: number,
  nextRemaining: number,
  totalCards: number,
): boolean {
  const threshold = totalCards * 0.25;
  return previousRemaining > 0 && previousRemaining < threshold && nextRemaining >= totalCards;
}
