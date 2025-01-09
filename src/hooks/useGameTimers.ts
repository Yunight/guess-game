import { useRef, useCallback, useEffect } from 'react';

interface TimerCallbacks {
  onGuessTimeEnd?: () => void;
  onTotalTimeUpdate?: (time: number) => void;
}

export const useGameTimers = (
  isGameActive: boolean,
  isHardMode: boolean,
  isShiny: boolean | undefined,
  callbacks: TimerCallbacks
) => {
  const guessTimerRef = useRef<NodeJS.Timeout | null>(null);
  const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimeRef = useRef<number>(0);

  const clearGuessTimer = useCallback(() => {
    if (guessTimerRef.current) {
      console.log('Clearing guess timer');
      clearInterval(guessTimerRef.current);
      guessTimerRef.current = null;
    }
  }, []);

  const clearTotalTimer = useCallback(() => {
    if (totalTimerRef.current) {
      console.log('Clearing total timer');
      clearInterval(totalTimerRef.current);
      totalTimerRef.current = null;
    }
  }, []);

  const startGuessTimer = useCallback(
    (setGuessTimeLeft: (time: number | ((prev: number) => number)) => void) => {
      console.log('Starting guess timer, isActive:', isGameActive, 'isHardMode:', isHardMode);
      
      // Only start timer if game is active and in hard mode
      if (!isGameActive || !isHardMode) {
        console.log('Not starting guess timer - game inactive or not hard mode');
        return;
      }

      // Clear any existing timer first
      clearGuessTimer();

      // Set initial time based on whether Pokemon is shiny
      const initialTime = isShiny ? 10 : 15;
      console.log('Setting initial guess time:', initialTime);
      setGuessTimeLeft(initialTime);

      let timeLeft = initialTime;

      // Start new timer that updates every second
      guessTimerRef.current = setInterval(() => {
        timeLeft -= 1;
        console.log('Guess time updated:', timeLeft);
        
        if (timeLeft <= 0) {
          console.log('Guess time reached zero');
          clearGuessTimer();
          setGuessTimeLeft(0);
          if (callbacks.onGuessTimeEnd) {
            callbacks.onGuessTimeEnd();
          }
        } else {
          setGuessTimeLeft(timeLeft);
        }
      }, 1000);
    },
    [isGameActive, isHardMode, isShiny, callbacks, clearGuessTimer]
  );

  const startTotalTimer = useCallback(
    (setTotalTimeElapsed: (time: number | ((prev: number) => number)) => void) => {
      console.log('Starting total timer, isActive:', isGameActive);
      
      // Only start timer if game is active
      if (!isGameActive) {
        console.log('Not starting total timer - game inactive');
        return;
      }

      // Clear any existing timer first
      clearTotalTimer();

      // Reset elapsed time and set initial state
      elapsedTimeRef.current = 0;
      console.log('Setting initial total time: 0');
      setTotalTimeElapsed(0);

      // Start new timer that updates every second
      totalTimerRef.current = setInterval(() => {
        elapsedTimeRef.current += 1;
        console.log('Total time updated:', elapsedTimeRef.current);
        setTotalTimeElapsed(elapsedTimeRef.current);
        if (callbacks.onTotalTimeUpdate) {
          callbacks.onTotalTimeUpdate(elapsedTimeRef.current);
        }
      }, 1000);
    },
    [isGameActive, callbacks, clearTotalTimer]
  );

  const stopAllTimers = useCallback(() => {
    console.log('Stopping all timers');
    clearGuessTimer();
    clearTotalTimer();
  }, [clearGuessTimer, clearTotalTimer]);

  // Effect to handle timer cleanup based on game state
  useEffect(() => {
    if (!isGameActive) {
      console.log('Game became inactive, stopping timers');
      stopAllTimers();
    }
  }, [isGameActive, stopAllTimers]);

  // Additional effect to handle hard mode timer
  useEffect(() => {
    if (!isHardMode) {
      console.log('Hard mode disabled, clearing guess timer');
      clearGuessTimer();
    }
  }, [isHardMode, clearGuessTimer]);

  return {
    startGuessTimer,
    startTotalTimer,
    stopAllTimers,
    clearGuessTimer,
    clearTotalTimer,
  };
}; 