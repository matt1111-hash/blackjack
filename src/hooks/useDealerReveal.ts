import { useEffect, useState } from 'react';
import { DEALER_REVEAL_STEP_DELAY, HOLE_CARD_REVEAL_DURATION } from '../constants/animations';
import type { GamePhase } from '../types';

export interface DealerReveal {
  visible: number;
  holeRevealed: boolean;
  done: boolean;
}

interface RevealState extends DealerReveal {
  /** Melyik fázishoz tartozó szekvencia írta utoljára az állapotot. */
  seqPhase: GamePhase | null;
}

/**
 * Az osztó kézének felfedése (D11) domain-érintés nélkül: a store már
 * birtokolja a teljes kezet, a hook csak azt szabályozza, hány lap látszik.
 * Előbb a hole card fordul (~0,5 s), majd egylaponkénti lépésköz (~0,4 s).
 *
 * A lépések abszolút célt állítanak (StrictMode- és dupla effekt-biztos),
 * fázisváltáskor pedig az állapot render-időben alaphelyzetbe áll — így az
 * előző kör `done`-ja sosem engedheti be az eredményt a flip előtt.
 */
export function useDealerReveal(
  phase: GamePhase,
  dealerCount: number,
  armed: boolean,
  speed = 1,
  /** Szoros helyzetben a hole card előtti „levegővétel” (ms, speed-del skálázva). */
  anticipationMs = 0,
): DealerReveal {
  const immediate = speed <= 0;
  const [state, setState] = useState<RevealState>({
    seqPhase: null,
    visible: Math.min(2, dealerCount),
    holeRevealed: false,
    done: true,
  });
  const [prevPhase, setPrevPhase] = useState<GamePhase>(phase);

  // Fázisváltás: azonnali (render idejű) alaphelyzet — hivatalos React minta.
  if (phase !== prevPhase) {
    setPrevPhase(phase);
    setState({ seqPhase: null, visible: Math.min(2, dealerCount), holeRevealed: false, done: true });
  }

  useEffect(() => {
    // Azonnali mód: a hívó a végállapotot kapja — nincs mit időzíteni.
    if (immediate) return;
    if (phase !== 'finished' || !armed) return;

    const flipMs = (HOLE_CARD_REVEAL_DURATION * 1000 + anticipationMs) * speed;
    const stepMs = DEALER_REVEAL_STEP_DELAY * 1000 * speed;

    window.setTimeout(() => {
      setState({ seqPhase: 'finished', visible: Math.min(2, dealerCount), holeRevealed: false, done: false });
    }, 0);

    window.setTimeout(() => {
      setState({
        seqPhase: 'finished',
        visible: Math.min(2, dealerCount),
        holeRevealed: true,
        done: dealerCount <= 2,
      });
    }, flipMs);

    for (let cardIndex = 2; cardIndex < dealerCount; cardIndex++) {
      window.setTimeout(() => {
        setState({
          seqPhase: 'finished',
          visible: cardIndex + 1,
          holeRevealed: true,
          done: cardIndex + 1 >= dealerCount,
        });
      }, flipMs + (cardIndex - 1) * stepMs);
    }
    // Időzítők tudatosan cleanup nélkül — abszolút célpontok, lásd docstring.
  }, [phase, dealerCount, armed, speed, immediate, anticipationMs]);

  if (immediate) {
    return { visible: dealerCount, holeRevealed: phase === 'finished', done: true };
  }

  const inSync = state.seqPhase === phase && (phase !== 'finished' || armed);
  return inSync
    ? { visible: state.visible, holeRevealed: state.holeRevealed, done: state.done }
    : { visible: Math.min(2, dealerCount), holeRevealed: false, done: phase !== 'finished' };
}
