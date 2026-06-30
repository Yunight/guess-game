import type { Rankings } from "../components/pokemon-game/types";
import type { DocumentData, Timestamp } from "firebase/firestore";

export interface RankingEntry {
	score: number;
	time: number;
}

export const RANKINGS_DISPLAY_LIMIT = 50;
export const RANKINGS_CALCULATION_LIMIT = 200;

export const getRankingsCollectionPath = (
	startId: number,
	endId: number,
): string => `rankings_gen${startId}_${endId}`;

export const calculateRankFromEntries = (
	entries: readonly RankingEntry[],
	score: number,
	time: number,
): number => {
	let rank = 1;
	for (const entry of entries) {
		if (entry.score > score || (entry.score === score && entry.time <= time)) {
			rank++;
		}
	}
	return rank;
};

export const isBetterRankingScore = (
	newScore: number,
	newTime: number,
	existingScore: number,
	existingTime: number,
): boolean => {
	if (newScore > existingScore) {
		return true;
	}
	if (newScore < existingScore) {
		return false;
	}
	return newTime < existingTime;
};

export const convertStoredNameToDisplay = (name: string): string =>
	name.replace(/_/g, " ");

export const mapRankingDocuments = (
	docs: ReadonlyArray<{ data: () => DocumentData }>,
): Rankings[] => {
	const rankingsData: Rankings[] = [];
	for (const docSnap of docs) {
		const data = docSnap.data();
		if (
			typeof data.name !== "string" ||
			typeof data.score !== "number" ||
			typeof data.time !== "number"
		) {
			continue;
		}

		rankingsData.push({
			name: convertStoredNameToDisplay(data.name),
			score: data.score,
			time: data.time,
			timestamp:
				(data.timestamp as Timestamp)?.toDate() || new Date(data.timestamp),
			uid: typeof data.uid === "string" ? data.uid : null,
		});
	}

	return rankingsData;
};

export const isDuplicateSaveAttempt = (
	lastAttempt: { score: number; time: number; timestamp: number } | null,
	score: number,
	time: number,
	now: number,
	windowMs = 5000,
): boolean => {
	if (!lastAttempt) {
		return false;
	}

	const timeSinceLastAttempt = now - lastAttempt.timestamp;
	return (
		timeSinceLastAttempt < windowMs &&
		lastAttempt.score === score &&
		lastAttempt.time === time
	);
};
