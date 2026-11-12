import { useMemo } from 'react';
import { useDealerVoice } from '../../hooks/useDealerVoice';
import { resolveDealerLine, resolveDealerLineKey } from '../../logic/dealerLines';
import { calculateHandValue } from '../../logic/hand';
import type { RoundResult } from '../../logic/rules';
import type { GamePhase, Hand } from '../../types';

export interface DealerCommentaryInputs {
  phase: GamePhase;
  roundResults: RoundResult[] | null;
  dealerHand: Hand;
  playerHands: Hand[];
  holeRevealed: boolean;
  dealerVisible: number;
  reshuffled: boolean;
  /** A közös mester-mute (Q-01): némítva az osztó sem beszél. */
  muted: boolean;
}

/** Az osztó mondása (D17) és hangja egy helyen: mit mond, és el is mondja. */
export function useDealerCommentary({
  phase,
  roundResults,
  dealerHand,
  playerHands,
  holeRevealed,
  dealerVisible,
  reshuffled,
  muted,
}: DealerCommentaryInputs) {
  const context = useMemo(
    () => ({
      phase,
      roundResult: roundResults?.[0]?.result ?? null,
      dealerBusted: dealerHand.isBusted,
      playerBusted: playerHands[0]?.isBusted ?? false,
      playerBlackjack: playerHands[0]?.isBlackjack ?? false,
      dealerValue: holeRevealed ? calculateHandValue(dealerHand.cards.slice(0, dealerVisible)) : null,
      reshuffled,
    }),
    [phase, roundResults, dealerHand, playerHands, holeRevealed, dealerVisible, reshuffled],
  );

  const lineKey = resolveDealerLineKey(context);
  const line = resolveDealerLine(context);
  const voice = useDealerVoice({ lineKey, text: line, lang: 'en', enabled: true, muted });

  return { line, voiceOn: voice.voiceOn, toggleVoice: voice.toggle };
}
