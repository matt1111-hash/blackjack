import { useCallback, useEffect, useRef, useState } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../store/gameStore';
import { didReshuffle } from '../../logic/shoe';
import type { ChipValue, GameError } from '../../types';

/** A useGameSounds által kínált lejátszók (a teszt-mock részleges). */
export interface TableSoundPlayers {
  playDealStart?: () => void;
  playButtonClick?: () => void;
  playCardPlace?: () => void;
  playCardSlide?: () => void;
  playChipDrop?: () => void;
  playChipStack?: () => void;
  playChipWin?: () => void;
  playWin?: () => void;
  playLose?: () => void;
  playBlackjack?: () => void;
}

export interface TableActionInputs {
  sounds: TableSoundPlayers;
  phase: string;
  currentBet: number;
  balance: number;
  choreographyDone: boolean;
  error: GameError | null;
  roundResults: Array<{ result: string }> | null;
}

const RESULT_SOUND_DELAY_MS = 500;

const SHOE_TOTAL_CARDS = 312;

/**
 * Az asztal összes felhasználói akciója és hang-effektje egy helyen:
 * hiba-toast, eredmény-hangok, tét-kezelők, akciógombok, shoe-újrakeverés.
 */
export function useBlackjackActions(inputs: TableActionInputs) {
  const { sounds, phase, currentBet, balance, choreographyDone, error, roundResults } = inputs;

  const {
    placeBet,
    clearBet,
    deal,
    hit,
    stand,
    double,
    split,
    buyInsurance,
    declineInsurance,
    newRound: newRoundAction,
    clearError,
  } = useGameStore(
    useShallow((state) => ({
      placeBet: state.placeBet,
      clearBet: state.clearBet,
      deal: state.deal,
      hit: state.hit,
      stand: state.stand,
      double: state.double,
      split: state.split,
      buyInsurance: state.buyInsurance,
      declineInsurance: state.declineInsurance,
      newRound: state.newRound,
      clearError: state.clearError,
    })),
  );

  const [lastBet, setLastBet] = useState(0);
  const [reshuffled, setReshuffled] = useState(false);

  // --- Hiba-toast auto-dismiss ---
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (error) {
      if (timerRef.current) clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => {
        clearError();
      }, 3000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [error, clearError]);

  const dismissError = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    clearError();
  }, [clearError]);

  // --- Eredmény-hangok: a koreográfia után, kifizetésnél zseton-hanggal ---
  const { playWin, playLose, playBlackjack, playChipWin } = sounds;

  useEffect(() => {
    if (phase !== 'finished' || !roundResults || !choreographyDone) return;

    let hasWin = false;
    let hasLose = true;
    let hasBlackjack = false;

    for (const roundResult of roundResults) {
      if (roundResult.result === 'win' || roundResult.result === 'blackjack') hasWin = true;
      if (roundResult.result !== 'lose') hasLose = false;
      if (roundResult.result === 'blackjack') hasBlackjack = true;
    }

    let timer: ReturnType<typeof setTimeout> | undefined;
    if (hasBlackjack) {
      timer = setTimeout(() => {
        playBlackjack?.();
        playChipWin?.();
      }, RESULT_SOUND_DELAY_MS);
    } else if (hasWin && !hasLose) {
      timer = setTimeout(() => {
        playWin?.();
        playChipWin?.();
      }, RESULT_SOUND_DELAY_MS);
    } else if (hasLose) {
      timer = setTimeout(() => {
        playLose?.();
      }, RESULT_SOUND_DELAY_MS);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [phase, roundResults, choreographyDone, playWin, playLose, playBlackjack, playChipWin]);

  // --- Kezelők ---
  const handlePlaceBet = useCallback(
    (amount: ChipValue) => {
      sounds.playChipDrop?.();
      sounds.playChipStack?.();
      placeBet(amount);
    },
    [sounds, placeBet],
  );

  const handleDoubleBet = useCallback(() => {
    if (currentBet <= 0 || balance < currentBet) return;
    sounds.playChipDrop?.();
    sounds.playChipStack?.();
    placeBet(currentBet);
  }, [currentBet, balance, sounds, placeBet]);

  const handleRebet = useCallback(() => {
    if (currentBet !== 0 || lastBet <= 0 || balance < lastBet) return;
    sounds.playChipDrop?.();
    sounds.playChipStack?.();
    placeBet(lastBet);
  }, [currentBet, lastBet, balance, sounds, placeBet]);

  const handleClearBet = useCallback(() => {
    if (currentBet <= 0) return;
    sounds.playChipStack?.();
    clearBet();
  }, [currentBet, sounds, clearBet]);

  const handleDeal = useCallback(() => {
    sounds.playDealStart?.();
    sounds.playButtonClick?.();
    setLastBet(currentBet);
    setReshuffled(false);
    deal();
  }, [sounds, currentBet, deal]);

  const handleNewRound = useCallback(() => {
    sounds.playButtonClick?.();
    // Újrakeverés-detektálás itt, eseményben: a shoe a 25% alá ért és megtelt.
    const before = useGameStore.getState().shoe.length;
    newRoundAction();
    const after = useGameStore.getState().shoe.length;
    if (didReshuffle(before, after, SHOE_TOTAL_CARDS)) {
      setReshuffled(true);
    }
  }, [sounds, newRoundAction]);

  // Rutin kör egy mozdulattal: új kör + az előző tét + osztás (élő asztal ütem).
  const handleRebetAndDeal = useCallback(() => {
    const bet = lastBet;
    handleNewRound();
    if (bet <= 0 || useGameStore.getState().balance < bet) return;
    sounds.playChipDrop?.();
    placeBet(bet);
    sounds.playDealStart?.();
    deal();
  }, [lastBet, handleNewRound, sounds, placeBet, deal]);

  const handleHit = useCallback(() => {
    sounds.playCardPlace?.();
    sounds.playButtonClick?.();
    hit();
  }, [sounds, hit]);

  const handleStand = useCallback(() => {
    sounds.playButtonClick?.();
    stand();
  }, [sounds, stand]);

  const handleDouble = useCallback(() => {
    sounds.playChipDrop?.();
    sounds.playButtonClick?.();
    double?.();
  }, [sounds, double]);

  const handleSplit = useCallback(() => {
    sounds.playChipDrop?.();
    sounds.playButtonClick?.();
    split?.();
  }, [sounds, split]);

  const handleBuyInsurance = useCallback(() => {
    sounds.playChipDrop?.();
    sounds.playButtonClick?.();
    buyInsurance();
  }, [sounds, buyInsurance]);

  const handleDeclineInsurance = useCallback(() => {
    sounds.playButtonClick?.();
    declineInsurance();
  }, [sounds, declineInsurance]);

  return {
    lastBet,
    reshuffled,
    dismissError,
    handlePlaceBet,
    handleClearBet,
    handleDoubleBet,
    handleRebet,
    handleDeal,
    handleNewRound,
    handleRebetAndDeal,
    handleHit,
    handleStand,
    handleDouble,
    handleSplit,
    handleBuyInsurance,
    handleDeclineInsurance,
  };
}
