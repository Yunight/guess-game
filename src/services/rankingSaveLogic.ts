import { isBetterRankingScore } from "./rankingUtils";

export interface ExistingRanking {
	score: number;
	time: number;
}

export type RankingSaveDecision = "skip" | "update" | "create";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

export const parseExistingRankingData = (
	data: unknown,
): ExistingRanking | null => {
	if (!isRecord(data)) {
		return null;
	}

	if (typeof data.score !== "number" || typeof data.time !== "number") {
		return null;
	}

	return {
		score: data.score,
		time: data.time,
	};
};

export const extractExistingRankingFromDocs = (
	docs: ReadonlyArray<{ data: () => unknown }>,
): ExistingRanking | null => {
	if (docs.length === 0) {
		return null;
	}

	const firstDoc = docs[0];
	if (!firstDoc) {
		return null;
	}

	return parseExistingRankingData(firstDoc.data());
};

export const resolveRankingSaveDecision = (
	existing: ExistingRanking | null,
	newScore: number,
	newTime: number,
): RankingSaveDecision => {
	if (
		existing !== null &&
		!isBetterRankingScore(newScore, newTime, existing.score, existing.time)
	) {
		return "skip";
	}

	return existing !== null ? "update" : "create";
};

export interface RankingPayloadInput {
	playerName: string;
	score: number;
	totalTimeElapsed: number;
	uid: string | null;
}

export interface RankingPayload {
	name: string;
	score: number;
	time: number;
	uid: string | null;
}

export const buildRankingPayload = (
	input: RankingPayloadInput,
): RankingPayload => ({
	name: input.playerName,
	score: input.score,
	time: input.totalTimeElapsed,
	uid: input.uid,
});

export const shouldUpdateBestScore = (
	newScore: number,
	bestScore: number,
): boolean => newScore > bestScore;

export const shouldLookupRankingByUid = (
	uid: string | null | undefined,
): uid is string => typeof uid === "string" && uid.length > 0;
