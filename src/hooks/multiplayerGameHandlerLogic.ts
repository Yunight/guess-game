import type { Timestamp } from "firebase/firestore";

export const computeGuessTimeLeft = (
	roundStartedAt: Timestamp,
	roundDurationSeconds: number,
	nowMs: number = Date.now(),
): number => {
	const elapsedSeconds = Math.max(0, Math.floor((nowMs - roundStartedAt.toMillis()) / 1000));
	const timeLeft = roundDurationSeconds - elapsedSeconds;
	return Math.min(roundDurationSeconds, Math.max(0, timeLeft));
};

export const shouldScheduleAdvanceRound = (
	lastAdvancedRound: number,
	roundNumber: number,
	roundResolved: boolean,
): boolean => roundResolved && lastAdvancedRound < roundNumber;
