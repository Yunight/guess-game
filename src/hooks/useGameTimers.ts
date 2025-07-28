import { useCallback, useEffect, useRef } from "react";

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
	const guessTimerRef = useRef<number | null>(null);
	const totalTimerRef = useRef<number | null>(null);
	const elapsedTimeRef = useRef<number>(0);

	// Add mobile-friendly timer tracking
	const startTimeRef = useRef<number | null>(null);
	const pausedTimeRef = useRef<number>(0);
	const lastVisibilityChangeRef = useRef<number>(Date.now());

	const clearGuessTimer = useCallback(() => {
		if (guessTimerRef.current) {
			console.log("[useGameTimers] Clearing guess timer", {
				timerId: guessTimerRef.current,
			});
			window.clearInterval(guessTimerRef.current);
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
			window.clearInterval(totalTimerRef.current);
			totalTimerRef.current = null;
		} else {
			console.log("[useGameTimers] No total timer to clear");
		}
	}, []);

	// Mobile-friendly timer calculation using performance timestamps
	const calculateElapsedTime = useCallback((): number => {
		if (!startTimeRef.current) return 0;

		const now = Date.now();
		const totalElapsed = Math.floor((now - startTimeRef.current) / 1000);
		const adjustedElapsed = Math.max(0, totalElapsed - pausedTimeRef.current);

		console.log("[useGameTimers] Calculated elapsed time:", {
			totalElapsed,
			pausedTime: pausedTimeRef.current,
			adjustedElapsed,
		});

		return adjustedElapsed;
	}, []);

	// Handle page visibility changes for mobile timer accuracy
	useEffect(() => {
		const handleVisibilityChange = () => {
			const now = Date.now();

			if (document.hidden) {
				// Page became hidden - pause timer tracking
				lastVisibilityChangeRef.current = now;
				console.log("[useGameTimers] Page hidden, pausing timer tracking");
			} else {
				// Page became visible - resume timer tracking
				if (startTimeRef.current && lastVisibilityChangeRef.current) {
					const pauseDuration = Math.floor(
						(now - lastVisibilityChangeRef.current) / 1000,
					);
					pausedTimeRef.current += pauseDuration;
					console.log(
						"[useGameTimers] Page visible, adding pause duration:",
						pauseDuration,
					);

					// Update timer immediately with accurate time
					if (isGameActive && totalTimerRef.current) {
						const accurateElapsed = calculateElapsedTime();
						elapsedTimeRef.current = accurateElapsed;
						if (callbacks.onTotalTimeUpdate) {
							callbacks.onTotalTimeUpdate(accurateElapsed);
						}
					}
				}
				lastVisibilityChangeRef.current = now;
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [isGameActive, calculateElapsedTime, callbacks]);

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
			guessTimerRef.current = window.setInterval(() => {
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

			// Reset timer tracking for mobile accuracy
			const now = Date.now();
			startTimeRef.current = now;
			pausedTimeRef.current = 0;
			lastVisibilityChangeRef.current = now;
			elapsedTimeRef.current = 0;

			console.log("[useGameTimers] Setting initial total time: 0");
			setTotalTimeElapsed(0);

			// Start new timer that updates every second with mobile-friendly calculation
			console.log("[useGameTimers] Creating new total timer interval");
			totalTimerRef.current = window.setInterval(() => {
				// Use mobile-friendly elapsed time calculation
				const accurateElapsed = calculateElapsedTime();
				elapsedTimeRef.current = accurateElapsed;

				console.log("[useGameTimers] Total time updated:", accurateElapsed);
				setTotalTimeElapsed(accurateElapsed);
				if (callbacks.onTotalTimeUpdate) {
					callbacks.onTotalTimeUpdate(accurateElapsed);
				}
			}, 1000);

			console.log("[useGameTimers] New total timer started", {
				timerId: totalTimerRef.current,
			});
		},
		[isGameActive, callbacks, clearTotalTimer, calculateElapsedTime],
	);

	const stopAllTimers = useCallback(() => {
		console.log("[useGameTimers] Stopping all timers", {
			guessTimerId: guessTimerRef.current,
			totalTimerId: totalTimerRef.current,
		});
		clearGuessTimer();
		clearTotalTimer();

		// Reset mobile timer tracking
		startTimeRef.current = null;
		pausedTimeRef.current = 0;
		lastVisibilityChangeRef.current = Date.now();
	}, [clearGuessTimer, clearTotalTimer]);

	return {
		startGuessTimer,
		startTotalTimer,
		stopAllTimers,
		clearGuessTimer,
		clearTotalTimer,
	};
};
