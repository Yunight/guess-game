import { useCallback, useEffect, useRef } from "react";
import {
	calculateElapsedTime,
	getInitialGuessTime,
	resolveVisibilityChange,
	shouldStartGuessTimer,
	tickGuessTimer,
} from "./gameTimerLogic";

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

	useEffect(() => {
		const handleVisibilityChange = (): void => {
			const now = Date.now();
			const result = resolveVisibilityChange({
				isHidden: document.hidden,
				now,
				lastVisibilityChange: lastVisibilityChangeRef.current,
				startTime: startTimeRef.current,
				pausedTime: pausedTimeRef.current,
				isGameActive,
				hasTotalTimer: totalTimerRef.current !== null,
			});

			if (document.hidden) {
				console.log("[useGameTimers] Page hidden, pausing timer tracking");
				lastVisibilityChangeRef.current = result.lastVisibilityChange;
				return;
			}

			const previousPausedTime = pausedTimeRef.current;
			pausedTimeRef.current = result.pausedTime;
			console.log(
				"[useGameTimers] Page visible, adding pause duration:",
				result.pausedTime - previousPausedTime,
			);

			if (result.shouldUpdateTotal) {
				elapsedTimeRef.current = result.accurateElapsed;
				callbacks.onTotalTimeUpdate?.(result.accurateElapsed);
			}

			lastVisibilityChangeRef.current = result.lastVisibilityChange;
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [isGameActive, callbacks]);

	const startGuessTimer = useCallback(
		(setGuessTimeLeft: (time: number | ((prev: number) => number)) => void) => {
			console.log("[useGameTimers] Attempting to start guess timer", {
				isGameActive,
				isHardMode,
				isShiny,
				existingTimer: guessTimerRef.current,
			});

			if (!shouldStartGuessTimer(isGameActive, isHardMode)) {
				console.log("[useGameTimers] Not starting guess timer - game inactive or not hard mode");
				return;
			}

			if (guessTimerRef.current) {
				console.log("[useGameTimers] Clearing existing guess timer before starting new one");
				clearGuessTimer();
			}

			const initialTime = getInitialGuessTime(isShiny);
			console.log("[useGameTimers] Setting initial guess time:", initialTime);
			setGuessTimeLeft(initialTime);

			let timeLeft = initialTime;

			console.log("[useGameTimers] Creating new guess timer interval");
			guessTimerRef.current = window.setInterval(() => {
				const tickResult = tickGuessTimer(timeLeft);
				timeLeft = tickResult.timeLeft;
				console.log("[useGameTimers] Guess time updated:", timeLeft);

				if (tickResult.isExpired) {
					console.log("[useGameTimers] Guess time reached zero, clearing timer");
					clearGuessTimer();
					setGuessTimeLeft(0);
					callbacks.onGuessTimeEnd?.();
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
		(setTotalTimeElapsed: (time: number | ((prev: number) => number)) => void) => {
			console.log("[useGameTimers] Attempting to start total timer", {
				isGameActive,
				existingTimer: totalTimerRef.current,
				currentElapsedTime: elapsedTimeRef.current,
			});

			if (!isGameActive) {
				console.log("[useGameTimers] Not starting total timer - game inactive");
				return;
			}

			if (totalTimerRef.current) {
				console.log("[useGameTimers] Clearing existing total timer before starting new one");
				clearTotalTimer();
			}

			const now = Date.now();
			startTimeRef.current = now;
			pausedTimeRef.current = 0;
			lastVisibilityChangeRef.current = now;
			elapsedTimeRef.current = 0;

			console.log("[useGameTimers] Setting initial total time: 0");
			setTotalTimeElapsed(0);

			console.log("[useGameTimers] Creating new total timer interval");
			totalTimerRef.current = window.setInterval(() => {
				const accurateElapsed = calculateElapsedTime(
					startTimeRef.current,
					pausedTimeRef.current,
					Date.now(),
				);
				elapsedTimeRef.current = accurateElapsed;

				console.log("[useGameTimers] Total time updated:", accurateElapsed);
				setTotalTimeElapsed(accurateElapsed);
				callbacks.onTotalTimeUpdate?.(accurateElapsed);
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
