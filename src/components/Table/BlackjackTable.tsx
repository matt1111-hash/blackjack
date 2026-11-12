import { useCallback } from 'react';
import { AnimatePresence, useReducedMotion } from 'framer-motion';
import { useShallow } from 'zustand/react/shallow';
import { useGameStore } from '../../store/gameStore';
import { SHOE_DECKS } from '../../store/gameHelpers';
import { useGameSounds } from '../../hooks/soundHelpers';
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts';
import { useSessionStats } from '../../hooks/useSessionStats';
import { useStrategyCoach } from '../../hooks/useStrategyCoach';
import { useTableGestures } from '../../hooks/useTableGestures';
import { useTableSpeed } from '../../hooks/useTableSpeed';
import { canPlayerDouble, canPlayerSplit } from '../../logic/rules';
import { CHOREO_SPEED } from '../../constants/animations';
import type { ChipValue } from '../../types';
import { ChipTray } from './ChipTray';
import { DealerArea } from './DealerArea';
import { DiscardTray } from './DiscardTray';
import { PlayerArea } from './PlayerArea';
import { Shoe } from './Shoe';
import { TableConsole } from './TableConsole';
import { TableMarkings } from './TableMarkings';
import { useBlackjackActions } from './useBlackjackActions';
import { useDealerCommentary } from './useDealerCommentary';
import { useTableDirector } from './useTableDirector';
import { DealerFigure } from '../Avatar/DealerFigure';
import { DealerSpeech } from '../Avatar/DealerSpeech';
import { CoachToast } from '../UI/CoachToast';
import { GameResult } from '../UI/GameResult';
import { InsuranceDialog } from '../UI/InsuranceDialog';
import './BlackjackTable.css';

const TOTAL_SHOE_CARDS = SHOE_DECKS * 52;
const CHIP_VALUES: readonly ChipValue[] = [5, 25, 100, 500];
const DEALER_NAME = 'MARCO';
const readSnapshot = () => useGameStore.getState();

/**
 * Élő kaszinó asztal a játékos székéből nézve: az osztó az asztal mögött,
 * a félhold-filc előttünk, a döntések az asztal előtti kezelőpulton.
 */
export function BlackjackTable() {
  const { balance, currentBet, dealerHand, playerHands, activeHandIndex, phase, roundResults, error, shoeRemaining } =
    useGameStore(
      useShallow((state) => ({
        balance: state.balance,
        currentBet: state.currentBet,
        dealerHand: state.dealerHand,
        playerHands: state.playerHands,
        activeHandIndex: state.activeHandIndex,
        phase: state.phase,
        roundResults: state.roundResults,
        error: state.error,
        shoeRemaining: state.shoe.length,
      })),
    );

  const sounds = useGameSounds();
  const reducedMotion = useReducedMotion() ?? false;
  const pace = useTableSpeed();
  const speed = reducedMotion ? 0 : CHOREO_SPEED * pace.factor;

  const director = useTableDirector({ phase, playerHands, dealerHand, sounds, speed });
  const { choreographyDone } = director;
  const settledResults = choreographyDone ? roundResults : null;

  const session = useSessionStats(roundResults, playerHands);
  const coach = useStrategyCoach(readSnapshot);
  const actions = useBlackjackActions({ sounds, phase, currentBet, balance, choreographyDone, error, roundResults });

  const activeHand = playerHands[activeHandIndex];
  const canDouble = activeHand ? canPlayerDouble(activeHand, balance) : false;
  const canSplit = playerHands.length === 1 && canPlayerSplit(playerHands[0], balance);

  // A döntéseket az edző a végrehajtás ELŐTTI állapoton méri.
  const { record } = coach;
  const { handleHit, handleStand, handleDouble, handleSplit } = actions;
  const onHit = useCallback(() => {
    record('hit');
    handleHit();
  }, [record, handleHit]);
  const onStand = useCallback(() => {
    record('stand');
    handleStand();
  }, [record, handleStand]);
  const onDouble = useCallback(() => {
    record('double');
    handleDouble();
  }, [record, handleDouble]);
  const onSplit = useCallback(() => {
    record('split');
    handleSplit();
  }, [record, handleSplit]);

  const decisionsOpen = phase === 'playing' && choreographyDone;
  const gestures = useTableGestures({ enabled: decisionsOpen, onHit, onStand });

  useKeyboardShortcuts({
    enabled: choreographyDone,
    phase,
    canDouble,
    canSplit,
    canDeal: phase === 'betting' && currentBet > 0,
    onHit,
    onStand,
    onDouble,
    onSplit,
    onDeal: actions.handleDeal,
    onNewRound: actions.handleNewRound,
    onChip: actions.handlePlaceBet,
    onClearBet: actions.handleClearBet,
    chipValues: CHIP_VALUES,
  });

  const dealer = useDealerCommentary({
    phase,
    roundResults,
    dealerHand,
    playerHands,
    holeRevealed: director.holeRevealed,
    dealerVisible: director.dealerVisible,
    reshuffled: actions.reshuffled,
    muted: sounds.isMuted ?? false,
  });

  const cardsInPlay = playerHands.reduce((sum, hand) => sum + hand.cards.length, 0) + dealerHand.cards.length;
  const discarded = Math.max(0, TOTAL_SHOE_CARDS - shoeRemaining - cardsInPlay);
  const betOnTable = playerHands.length > 0 ? playerHands.reduce((sum, hand) => sum + hand.bet, 0) : currentBet;

  return (
    <div className={`casino-room ${director.tense && director.revealing ? 'casino-room--hushed' : ''}`}>
      <div className="casino-room__table">
        <div className="table-frame">
          <DealerFigure name={DEALER_NAME} dealing={director.dealing} revealing={director.revealing} />

          {/* Az asztal teste: egyetlen döntött réteg (rail + félhold-filc + nyomat). */}
          <div className="table-frame__stage" aria-hidden="true">
            <div className="table-rail" />
            <div className="table-felt">
              <TableMarkings />
            </div>
          </div>

          <div className="table-frame__layer" onPointerDown={gestures.onPointerDown} onPointerUp={gestures.onPointerUp}>
            <div className="table-frame__props" aria-hidden="true">
              <DiscardTray discarded={discarded} />
              <ChipTray />
              <Shoe remaining={shoeRemaining} />
            </div>

            <div className="table-frame__dealer">
              <DealerSpeech line={dealer.line} />
              <DealerArea
                hand={dealerHand}
                visibleCount={director.dealerVisible}
                holeRevealed={director.holeRevealed}
                liftHole={director.liftHole}
                flipDuration={director.flipDuration}
              />
            </div>

            <div className="table-frame__player">
              <PlayerArea
                hands={playerHands}
                activeHandIndex={activeHandIndex}
                currentBet={currentBet}
                gamePhase={phase}
                roundResults={settledResults}
                visiblePlayerCards={director.visiblePlayerCards}
              />
            </div>

            <CoachToast feedback={coach.feedback} />

            {phase === 'insurance' && choreographyDone && (
              <InsuranceDialog
                onBuy={actions.handleBuyInsurance}
                onDecline={actions.handleDeclineInsurance}
                insuranceCost={Math.floor(currentBet / 2)}
              />
            )}

            {error && (
              <div className="table-frame__error" role="alert" data-testid="game-error">
                <span className="table-frame__error-text">{error.message}</span>
                <button className="table-frame__error-dismiss" onClick={actions.dismissError} aria-label="Dismiss error">
                  ×
                </button>
              </div>
            )}

            <AnimatePresence>
              {phase === 'finished' && settledResults && (
                <GameResult key="game-result" results={settledResults} hands={playerHands} />
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <TableConsole
        phase={phase}
        balance={balance}
        betOnTable={betOnTable}
        currentBet={currentBet}
        lastBet={actions.lastBet}
        ready={choreographyDone}
        canDouble={canDouble}
        canSplit={canSplit}
        handStanding={activeHand?.isStanding ?? false}
        handlers={{
          onPlaceBet: actions.handlePlaceBet,
          onClearBet: actions.handleClearBet,
          onDoubleBet: actions.handleDoubleBet,
          onRebet: actions.handleRebet,
          onDeal: actions.handleDeal,
          onHit,
          onStand,
          onDouble,
          onSplit,
          onNewRound: actions.handleNewRound,
          onRebetAndDeal: actions.handleRebetAndDeal,
        }}
        settings={{
          session,
          coachEnabled: coach.enabled,
          coachAccuracy: coach.accuracy,
          coachDecisions: coach.stats.decisions,
          onToggleCoach: coach.toggle,
          speed: pace.speed,
          onToggleSpeed: pace.toggle,
          voiceEnabled: dealer.voiceOn,
          onToggleVoice: dealer.toggleVoice,
        }}
      />
    </div>
  );
}
