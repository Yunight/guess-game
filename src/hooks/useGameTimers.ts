import { useCallback, useRef } from "react";

interface TimerCallbacks {
	onGuessTimeEnd?: () => void;
	onTotalTimeUpdate?: (time: number) => void;
}

export const useGameTimers = (
	isGameActive: boolean,
	isHardMode: boolean,
	isShiny: boolean | undefined,
	callbacks: TimerCallbacks,
) => {
	const guessTimerRef = useRef<NodeJS.Timeout | null>(null);
	const totalTimerRef = useRef<NodeJS.Timeout | null>(null);
	const elapsedTimeRef = useRef<number>(0);

	const clearGuessTimer = useCallback(() => {
		if (guessTimerRef.current) {
			console.log("[useGameTimers] Clearing guess timer", {
				timerId: guessTimerRef.current,
			});
			clearInterval(guessTimerRef.current);
			guessTimerRef.current = null;
		} else {
			console.log("[useGameTimers] No guess timer to clear");
		}
	}, []);

	const clearTotalTimer = useCallback(() => {
		if (totalTimerRef.current) {
			console.log("[useGameTimers] Clearing total timer", {
				timerId: totalTimerRef.current,
			});
			clearInterval(totalTimerRef.current);
			totalTimerRef.current = null;
		} else {
			console.log("[useGameTimers] No total timer to clear");
		}
	}, []);

	const startGuessTimer = useCallback(
		(setGuessTimeLeft: (time: number | ((prev: number) => number)) => void) => {
			console.log("[useGameTimers] Attempting to start guess timer", {
				isGameActive,
				isHardMode,
				isShiny,
				existingTimer: guessTimerRef.current,
			});

			// Only start timer if game is active and in hard mode
			if (!isGameActive || !isHardMode) {
				console.log(
					"[useGameTimers] Not starting guess timer - game inactive or not hard mode",
				);
				return;
			}

			// Clear any existing timer first
			if (guessTimerRef.current) {
				console.log(
					"[useGameTimers] Clearing existing guess timer before starting new one",
				);
				clearGuessTimer();
			}

			// Set initial time based on whether Pokemon is shiny
			const initialTime = isShiny ? 10 : 15;
			console.log("[useGameTimers] Setting initial guess time:", initialTime);
			setGuessTimeLeft(initialTime);

			let timeLeft = initialTime;

			// Start new timer that updates every second
			console.log("[useGameTimers] Creating new guess timer interval");
			guessTimerRef.current = setInterval(() => {
				timeLeft -= 1;
				console.log("[useGameTimers] Guess time updated:", timeLeft);

				if (timeLeft <= 0) {
					console.log(
						"[useGameTimers] Guess time reached zero, clearing timer",
					);
					clearGuessTimer();
					setGuessTimeLeft(0);
					if (callbacks.onGuessTimeEnd) {
						callbacks.onGuessTimeEnd();
					}
				} else {
					setGuessTimeLeft(timeLeft);
				}
			}, 1000);

			console.log("[useGameTimers] New guess timer started", {
				timerId: guessTimerRef.current,
			});
		},
		[isGameActive, isHardMode, isShiny, callbacks, clearGuessTimer],
	);

	const startTotalTimer = useCallback(
		(
			setTotalTimeElapsed: (time: number | ((prev: number) => number)) => void,
		) => {
			console.log("[useGameTimers] Attempting to start total timer", {
				isGameActive,
				existingTimer: totalTimerRef.current,
				currentElapsedTime: elapsedTimeRef.current,
			});

			// Only start timer if game is active
			if (!isGameActive) {
				console.log("[useGameTimers] Not starting total timer - game inactive");
				return;
			}

			// Clear any existing timer first
			if (totalTimerRef.current) {
				console.log(
					"[useGameTimers] Clearing existing total timer before starting new one",
				);
				clearTotalTimer();
			}

			// Reset elapsed time and set initial state
			elapsedTimeRef.current = 0;
			console.log("[useGameTimers] Setting initial total time: 0");
			setTotalTimeElapsed(0);

			// Start new timer that updates every second
			console.log("[useGameTimers] Creating new total timer interval");
			totalTimerRef.current = setInterval(() => {
				elapsedTimeRef.current += 1;
				console.log(
					"[useGameTimers] Total time updated:",
					elapsedTimeRef.current,
				);
				setTotalTimeElapsed(elapsedTimeRef.current);
				if (callbacks.onTotalTimeUpdate) {
					callbacks.onTotalTimeUpdate(elapsedTimeRef.current);
				}
			}, 1000);

			console.log("[useGameTimers] New total timer started", {
				timerId: totalTimerRef.current,
			});
		},
		[isGameActive, callbacks, clearTotalTimer],
	);

	const stopAllTimers = useCallback(() => {
		console.log("[useGameTimers] Stopping all timers", {
			guessTimerId: guessTimerRef.current,
			totalTimerId: totalTimerRef.current,
		});
		clearGuessTimer();
		clearTotalTimer();
	}, [clearGuessTimer, clearTotalTimer]);

	return {
		startGuessTimer,
		startTotalTimer,
		stopAllTimers,
		clearGuessTimer,
		clearTotalTimer,
	};
};
