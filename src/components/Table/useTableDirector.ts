import { useCallback, useEffect, useRef } from 'react';
import { useDealChoreography } from '../../hooks/useDealChoreography';
import { useDealerReveal } from '../../hooks/useDealerReveal';
import { HOLE_CARD_REVEAL_DURATION } from '../../constants/animations';
import type { GamePhase, Hand } from '../../types';

/** Szoros helyzetben ennyivel tovább tart a hole card előtti csend (ms). */
export const TENSION_ANTICIPATION_MS = 650;
/** Szoros helyzetben a fordítás hossza (s) — a „squeeze” ritmusa. */
export const TENSION_FLIP_DURATION = 0.62;

interface DirectorSounds {
  playCardSlide?: () => void;
  playCardPlace?: () => void;
}

export interface DirectorInputs {
  phase: GamePhase;
  playerHands: Hand[];
  dealerHand: Hand;
  sounds: DirectorSounds;
  /** 0 = azonnali (reduced motion / unit teszt), egyébként a tempó-szorzó. */
  speed: number;
}

/** Dönt-e még valamit a hole card? (Van élő, nem blackjack játékos-kéz.) */
export function isTenseReveal(phase: GamePhase, playerHands: Hand[]): boolean {
  if (phase !== 'finished') return false;
  return playerHands.some((hand) => !hand.isBusted && !hand.isBlackjack);
}

/**
 * Az asztal rendezője: egy helyen dönti el, mi mikor látszik és szól.
 * - kezdő osztás koreográfiája (lapok egyesével, hanggal);
 * - osztó-felfedés, amely szoros helyzetben kivár, megemeli és lassabban fordítja
 *   a hole cardot, rutin helyzetben (minden kéz bust) gyorsan lezárja;
 * - az osztó húzott lapjai ugyanúgy hanggal érkeznek, mint a kezdő lapok.
 */
export function useTableDirector({ phase, playerHands, dealerHand, sounds, speed }: DirectorInputs) {
  const playerCount = playerHands[0]?.cards.length ?? 0;
  const dealerCount = dealerHand.cards.length;
  const tense = isTenseReveal(phase, playerHands);

  const handleCardDealt = useCallback(() => {
    sounds.playCardSlide?.();
    window.setTimeout(() => sounds.playCardPlace?.(), 90);
  }, [sounds]);

  const dealChoreo = useDealChoreography(phase, playerCount, dealerCount, {
    speed,
    onCardDealt: handleCardDealt,
  });
  const reveal = useDealerReveal(
    phase,
    dealerCount,
    dealChoreo.done,
    speed,
    tense ? TENSION_ANTICIPATION_MS : 0,
  );

  const dealerVisible = dealChoreo.done ? reveal.visible : dealChoreo.dealer;
  const choreographyDone = dealChoreo.done && (phase !== 'finished' || reveal.done);
  const revealing = phase === 'finished' && dealChoreo.done && !reveal.done;

  // A felfedés hangjai: fordítás + minden húzott lap.
  const heardRef = useRef({ visible: dealerVisible, hole: reveal.holeRevealed });
  useEffect(() => {
    const heard = heardRef.current;
    if (speed > 0 && revealing && (reveal.holeRevealed !== heard.hole || dealerVisible > heard.visible)) {
      handleCardDealt();
    }
    heardRef.current = { visible: dealerVisible, hole: reveal.holeRevealed };
  }, [dealerVisible, reveal.holeRevealed, revealing, speed, handleCardDealt]);

  const flipSeconds = (tense ? TENSION_FLIP_DURATION : HOLE_CARD_REVEAL_DURATION) * Math.max(speed, 0.0001);

  return {
    tense,
    dealerVisible,
    holeRevealed: reveal.holeRevealed,
    choreographyDone,
    dealing: !dealChoreo.done,
    revealing,
    liftHole: tense && revealing && !reveal.holeRevealed,
    flipDuration: speed > 0 ? flipSeconds : HOLE_CARD_REVEAL_DURATION,
    visiblePlayerCards: dealChoreo.done ? undefined : dealChoreo.player,
  };
}
