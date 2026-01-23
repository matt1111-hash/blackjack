import { useCallback, useState } from 'react';

interface AnimationState {
  isDealing: boolean;
  isRevealing: boolean;
  isCollecting: boolean;
}

export function useGameAnimations() {
  const [animState, setAnimState] = useState<AnimationState>({
    isDealing: false,
    isRevealing: false,
    isCollecting: false,
  });

  const startDealing = useCallback(() => {
    setAnimState({ isDealing: true, isRevealing: false, isCollecting: false });
  }, []);

  const endDealing = useCallback(() => {
    setAnimState((prev) => ({ ...prev, isDealing: false }));
  }, []);

  const startReveal = useCallback(() => {
    setAnimState((prev) => ({ ...prev, isRevealing: true }));
  }, []);

  const endReveal = useCallback(() => {
    setAnimState((prev) => ({ ...prev, isRevealing: false }));
  }, []);

  const startCollect = useCallback(() => {
    setAnimState({ isDealing: false, isRevealing: false, isCollecting: true });
  }, []);

  const endCollect = useCallback(() => {
    setAnimState((prev) => ({ ...prev, isCollecting: false }));
  }, []);

  return {
    ...animState,
    startDealing,
    endDealing,
    startReveal,
    endReveal,
    startCollect,
    endCollect,
  };
}

// Card count for staggered animations
export function useCardCount() {
  const [count, setCount] = useState(0);

  const increment = useCallback(() => {
    setCount((c) => c + 1);
  }, []);

  const reset = useCallback(() => {
    setCount(0);
  }, []);

  return { count, increment, reset };
}
