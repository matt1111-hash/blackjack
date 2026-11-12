import { motion, AnimatePresence } from 'framer-motion';
import { useMemo } from 'react';
import { Hand } from '../Card/Hand';
import { BetStack } from '../Chip/BetStack';
import { HandValueBadge } from '../UI/HandValueBadge';
import type { Hand as HandType } from '../../types';
import { calculateHandDetails } from '../../logic/hand';
import type { RoundResult } from '../../logic/rules';
import './PlayerArea.css';

interface PlayerAreaProps {
  hands: HandType[];
  activeHandIndex: number;
  currentBet: number;
  gamePhase: string;
  /** Csak a koreográfia végén érkezik meg — előbb nem söpörhető el a tét. */
  roundResults?: RoundResult[] | null;
  /** Kezdő osztás közben hány lapja látszik az első kéznek. */
  visiblePlayerCards?: number;
}

/** A kifizetés profitja (a tét mellé kerül, ahogy élőben). */
function payoutAmount(hand: HandType, result: RoundResult | undefined): number {
  if (!result || (result.result !== 'win' && result.result !== 'blackjack')) return 0;
  return Math.floor(hand.bet * result.payout);
}

/**
 * A játékos ülőhelye: lapok a tétkör fölött, érték-jelző a kéz mellett,
 * a tét fizikai zseton-oszlopként a körben. Nyerésnél az osztó a tét mellé
 * rakja a kifizetést; vesztésnél a tétet besöpri.
 */
export function PlayerArea({
  hands,
  activeHandIndex,
  currentBet,
  gamePhase,
  roundResults = null,
  visiblePlayerCards,
}: PlayerAreaProps) {
  const isPlaying = gamePhase === 'playing';

  const resultsByHand = useMemo(() => {
    const map = new Map<number, RoundResult>();
    for (const result of roundResults ?? []) map.set(result.playerHandIndex, result);
    return map;
  }, [roundResults]);

  if (hands.length === 0) {
    return (
      <div className="player-area">
        <div className="player-area__seat">
          {currentBet === 0 && <div className="player-area__hint">PLACE YOUR BET TO START</div>}
          <div className="bet-spot bet-spot--open">
            <BetStack amount={currentBet} testId="bet-spot-stack" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`player-area ${hands.length > 1 ? 'player-area--split' : ''} ${isPlaying ? 'player-area--deciding' : ''}`}
    >
      <AnimatePresence mode="popLayout">
        {hands.map((hand, index) => {
          const details = calculateHandDetails(hand.cards);
          const isActive = index === activeHandIndex && isPlaying && hands.length > 1;
          const result = resultsByHand.get(index);
          const won = result?.result === 'win' || result?.result === 'blackjack';
          const lost = result?.result === 'lose';
          const payout = payoutAmount(hand, result);
          const cards =
            visiblePlayerCards !== undefined && index === 0 ? hand.cards.slice(0, visiblePlayerCards) : hand.cards;

          const seatClass = [
            'player-area__seat',
            isActive ? 'player-area__seat--active' : '',
            hand.isBusted ? 'player-area__seat--busted' : '',
            result?.result === 'blackjack' ? 'player-area__seat--blackjack' : '',
          ]
            .filter(Boolean)
            .join(' ');

          return (
            <motion.div
              key={index}
              className={seatClass}
              data-testid={`player-hand-${index}`}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
            >
              <div className="player-area__cards">
                <Hand cards={cards} owner="player" />
                {cards.length > 0 && (
                  <div className="player-area__value">
                    <HandValueBadge
                      value={details.value}
                      isSoft={details.isSoft}
                      isBusted={hand.isBusted}
                      testId={`player-hand-value-${index}`}
                      tone={won ? 'win' : lost ? 'lose' : 'neutral'}
                    />
                  </div>
                )}
              </div>

              <div className={`bet-spot ${hand.isDoubled ? 'bet-spot--doubled' : ''}`}>
                <BetStack amount={hand.bet} outcome={won ? 'win' : lost ? 'lose' : null} />
                {payout > 0 && (
                  <div className="bet-spot__payout">
                    <BetStack amount={payout} source="dealer" testId={`payout-stack-${index}`} />
                  </div>
                )}
              </div>
              {hands.length > 1 && <div className="player-area__hand-label">HAND {index + 1}</div>}
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
