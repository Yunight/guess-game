import type { Timestamp } from "firebase/firestore";

export const computeGuessTimeLeft = (
	roundStartedAt: Timestamp,
	roundDurationSeconds: number,
	nowMs: number = Date.now(),
): number => {
	const elapsedSeconds = Math.floor(
		(nowMs - roundStartedAt.toMillis()) / 1000,
	);
	return Math.max(0, roundDurationSeconds - elapsedSeconds);
};

export const isRoundTimedOut = (
	roundStartedAt: Timestamp,
	roundDurationSeconds: number,
	nowMs: number = Date.now(),
): boolean =>
	computeGuessTimeLeft(roundStartedAt, roundDurationSeconds, nowMs) <= 0;

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
