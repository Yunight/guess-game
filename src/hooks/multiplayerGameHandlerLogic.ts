import type { Timestamp } from "firebase/firestore";

export const computeGuessTimeLeft = (
	roundStartedAt: Timestamp,
	roundDurationSeconds: number,
	nowMs: number = Date.now(),
): number => {
	const elapsedSeconds = Math.max(
		0,
		Math.floor((nowMs - roundStartedAt.toMillis()) / 1000),
	);
	const timeLeft = roundDurationSeconds - elapsedSeconds;
	return Math.min(roundDurationSeconds, Math.max(0, timeLeft));
};

export const isRoundTimedOut = (
	roundStartedAt: Timestamp,
	roundDurationSeconds: number,
	nowMs: number = Date.now(),
): boolean =>
	computeGuessTimeLeft(roundStartedAt, roundDurationSeconds, nowMs) <= 0;

export const shouldScheduleAdvanceRound = (
	lastAdvancedRound: number,
	roundNumber: number,
	roundResolved: boolean,
): boolean => roundResolved && lastAdvancedRound < roundNumber;

export const getPlayerDisplayName = (
	playerId: string,
	hostPlayerId: string,
	hostName: string,
	guestPlayerId: string | undefined,
	guestName: string | undefined,
): string => {
	if (playerId === hostPlayerId) {
		return hostName;
	}
	if (guestPlayerId === playerId && guestName) {
		return guestName;
	}
	return playerId;
};
