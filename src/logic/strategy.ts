import type { Card } from '../types';
import { calculateHandDetails, getCardValue } from './hand';

/** A játékos lehetséges döntései egy kézben. */
export type PlayerDecision = 'hit' | 'stand' | 'double' | 'split';

export interface DecisionOptions {
  canDouble: boolean;
  canSplit: boolean;
}

/** Chart-kód: H=hit, S=stand, D=double (különben hit), X=double (különben stand), P=split. */
type ChartCode = 'H' | 'S' | 'D' | 'X' | 'P';

/** Osztó felfordított lapjának értéke 2..11 (ász = 11). */
function upcardValue(card: Card): number {
  return getCardValue(card);
}

function inRange(value: number, from: number, to: number): boolean {
  return value >= from && value <= to;
}

/** Kemény kéz: 6 pakli, S17 (az osztó soft 17-en megáll), surrender nélkül. */
function hardCode(total: number, up: number): ChartCode {
  if (total <= 8) return 'H';
  if (total === 9) return inRange(up, 3, 6) ? 'D' : 'H';
  if (total === 10) return inRange(up, 2, 9) ? 'D' : 'H';
  if (total === 11) return up === 11 ? 'H' : 'D';
  if (total === 12) return inRange(up, 4, 6) ? 'S' : 'H';
  if (total <= 16) return inRange(up, 2, 6) ? 'S' : 'H';
  return 'S';
}

/** Puha kéz (ász 11-ként számolva): A2..A9. */
function softCode(total: number, up: number): ChartCode {
  if (total <= 14) return inRange(up, 5, 6) ? 'D' : 'H';
  if (total <= 16) return inRange(up, 4, 6) ? 'D' : 'H';
  if (total === 17) return inRange(up, 3, 6) ? 'D' : 'H';
  if (total === 18) {
    if (inRange(up, 3, 6)) return 'X';
    return up >= 9 ? 'H' : 'S';
  }
  return 'S';
}

/** Pár (azonos rang), double after split engedélyezve. */
function pairCode(pairValue: number, up: number): ChartCode | null {
  switch (pairValue) {
    case 11:
    case 8:
      return 'P';
    case 10:
      return 'S';
    case 9:
      return up === 7 || up >= 10 ? 'S' : 'P';
    case 7:
      return up <= 7 ? 'P' : 'H';
    case 6:
      return up <= 6 ? 'P' : 'H';
    case 4:
      return inRange(up, 5, 6) ? 'P' : 'H';
    case 3:
    case 2:
      return up <= 7 ? 'P' : 'H';
    default:
      // 5-5: kemény 10-ként játszandó
      return null;
  }
}

function resolve(code: ChartCode, options: DecisionOptions): PlayerDecision {
  if (code === 'H') return 'hit';
  if (code === 'S') return 'stand';
  if (code === 'D') return options.canDouble ? 'double' : 'hit';
  if (code === 'X') return options.canDouble ? 'double' : 'stand';
  return 'split';
}

/**
 * Basic strategy ajánlás a ház szabályai szerint (6 pakli, S17, DAS,
 * surrender nincs). Ha a chart split/double-t mond, de az nem engedélyezett,
 * a második legjobb döntést adja.
 */
export function recommendDecision(
  cards: Card[],
  dealerUpcard: Card,
  options: DecisionOptions,
): PlayerDecision {
  const up = upcardValue(dealerUpcard);

  if (options.canSplit && cards.length === 2 && cards[0].rank === cards[1].rank) {
    const code = pairCode(getCardValue(cards[0]), up);
    if (code === 'P') return 'split';
    if (code) return resolve(code, options);
  }

  const details = calculateHandDetails(cards);
  const code = details.isSoft ? softCode(details.value, up) : hardCode(details.value, up);
  return resolve(code, options);
}

/** Emberi címke a visszajelzéshez. */
export const DECISION_LABELS: Record<PlayerDecision, string> = {
  hit: 'HIT',
  stand: 'STAND',
  double: 'DOUBLE',
  split: 'SPLIT',
};
