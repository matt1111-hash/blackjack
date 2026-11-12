import type { GamePhase } from '../types';

export type RoundOutcome = 'win' | 'lose' | 'push' | 'blackjack' | null;

export interface DealerLineContext {
  phase: GamePhase;
  roundResult: RoundOutcome;
  dealerBusted: boolean;
  playerBusted: boolean;
  playerBlackjack: boolean;
  dealerValue: number | null;
  reshuffled: boolean;
}

export type DealerLineKey =
  | 'placeBets'
  | 'noMoreBets'
  | 'insuranceOpen'
  | 'dealerTotal'
  | 'blackjackPays'
  | 'playerBust'
  | 'dealerBust'
  | 'playerWins'
  | 'houseWins'
  | 'push'
  | 'newShoe';

/** Az osztó mondatai — magyar és angol párban, nyelvváltásra készen (D17). */
const LINES: Record<DealerLineKey, Record<'en' | 'hu', string>> = {
  placeBets: { en: 'Place your bets', hu: 'Tegyék meg tétjeiket' },
  noMoreBets: { en: 'No more bets', hu: 'Nincs több tét' },
  insuranceOpen: { en: 'Insurance open — pays 2 to 1', hu: 'Biztosítás nyitva — fizet 2 az 1-hez' },
  dealerTotal: { en: 'Dealer has {value}', hu: 'Az osztónak {value}' },
  blackjackPays: { en: 'Blackjack — pays 3 to 2', hu: 'Blackjack — fizet 3 a 2-hez' },
  playerBust: { en: 'Too many — bust', hu: 'Több mint 21 — besokallt' },
  dealerBust: { en: 'Dealer busts', hu: 'Az osztó besokallt' },
  playerWins: { en: 'Player wins', hu: 'A játékos nyer' },
  houseWins: { en: 'House wins', hu: 'Az osztó nyer' },
  push: { en: 'Push — bet returned', hu: 'Döntetlen — a tét visszajár' },
  newShoe: { en: 'Shuffling a new shoe', hu: 'Új paklit keverek' },
};

export type DealerLineLang = keyof (typeof LINES)['placeBets'];

/** Sorformázás — a dealerTotal sornak érték-behelyettesítése van. */
export function formatDealerLine(
  key: DealerLineKey,
  params: { value?: number | null } = {},
  lang: DealerLineLang = 'en',
): string {
  return LINES[key][lang].replace('{value}', String(params.value ?? ''))
}

/** Totális leképezés: minden (fázis, kontextus) kombinációhoz van kulcs. */
export function resolveDealerLineKey(ctx: DealerLineContext): DealerLineKey {
  if (ctx.reshuffled && ctx.phase === 'betting') return 'newShoe'
  switch (ctx.phase) {
    case 'betting':
      return 'placeBets'
    case 'insurance':
      return 'insuranceOpen'
    case 'playing':
      return 'noMoreBets'
    case 'finished':
      if (ctx.roundResult === 'blackjack') return 'blackjackPays'
      if (ctx.dealerBusted) return 'dealerBust'
      if (ctx.roundResult === 'lose' && ctx.playerBusted) return 'playerBust'
      if (ctx.roundResult === 'win') return 'playerWins'
      if (ctx.roundResult === 'lose') return 'houseWins'
      if (ctx.roundResult === 'push') return 'push';
      return 'dealerTotal';
  }
}

/**
 * Az aktuális osztó-mondat. Egyetlen esetben ad nullát: dealerTotal kulcs
 * még nem ismert értékkel (a felszámolás nem kezdődött el).
 */
export function resolveDealerLine(ctx: DealerLineContext, lang: DealerLineLang = 'en'): string | null {
  const key = resolveDealerLineKey(ctx)
  if (key === 'dealerTotal' && ctx.dealerValue === null) return null
  return formatDealerLine(key, { value: ctx.dealerValue }, lang)
}
