import type {
	CollectionReference,
	DocumentData,
	DocumentReference,
	Query,
	QuerySnapshot,
} from "firebase/firestore";
import { isBetterRankingScore } from "./rankingUtils";

export interface ExistingRanking {
	score: number;
	time: number;
}

type RankingSaveDecision = "skip" | "update" | "create";

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const parseExistingRankingData = (
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

const extractExistingRankingFromDocs = (
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

const resolveRankingSaveDecision = (
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

interface RankingPayloadInput {
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

const buildRankingPayload = (
	input: RankingPayloadInput,
): RankingPayload => ({
	name: input.playerName,
	score: input.score,
	time: input.totalTimeElapsed,
	uid: input.uid,
});

const shouldUpdateBestScore = (
	newScore: number,
	bestScore: number,
): boolean => newScore > bestScore;

const shouldLookupRankingByUid = (
	uid: string | null | undefined,
): uid is string => typeof uid === "string" && uid.length > 0;

export interface ExistingRankingLookup {
	existingDocRef: DocumentReference<DocumentData> | null;
	existingRanking: ExistingRanking | null;
}

export interface RankingFirestoreDeps {
	query: (
		collectionRef: CollectionReference<DocumentData>,
		...constraints: unknown[]
	) => Query<DocumentData>;
	where: (field: string, op: string, value: string) => unknown;
	getDocs: (queryRef: Query<DocumentData>) => Promise<QuerySnapshot<DocumentData>>;
	addDoc: (
		collectionRef: CollectionReference<DocumentData>,
		data: RankingPayload & { timestamp: unknown },
	) => Promise<unknown>;
	updateDoc: (
		docRef: DocumentReference<DocumentData>,
		data: RankingPayload & { timestamp: unknown },
	) => Promise<void>;
	createTimestamp: () => unknown;
}

export interface ExecuteRankingSaveInput {
	score: number;
	totalTimeElapsed: number;
	playerName: string;
	bestScore: number;
	uid: string | null;
}

export interface ExecuteRankingSaveCallbacks {
	onBestScoreUpdate: (score: number, time: number) => void;
	onAfterSave: () => Promise<void>;
	onError: () => void;
}

export const lookupExistingRanking = async (
	rankingsRef: CollectionReference<DocumentData>,
	playerName: string,
	uid: string | null,
	deps: RankingFirestoreDeps,
): Promise<ExistingRankingLookup> => {
	if (shouldLookupRankingByUid(uid)) {
		const userQuery = deps.query(rankingsRef, deps.where("uid", "==", uid));
		const userDocs = await deps.getDocs(userQuery);
		if (!userDocs.empty) {
			return {
				existingDocRef: userDocs.docs[0]?.ref ?? null,
				existingRanking: extractExistingRankingFromDocs(userDocs.docs),
			};
		}
		return { existingDocRef: null, existingRanking: null };
	}

	const nameQuery = deps.query(
		rankingsRef,
		deps.where("name", "==", playerName),
	);
	const nameDocs = await deps.getDocs(nameQuery);
	if (!nameDocs.empty) {
		return {
			existingDocRef: nameDocs.docs[0]?.ref ?? null,
			existingRanking: extractExistingRankingFromDocs(nameDocs.docs),
		};
	}

	return { existingDocRef: null, existingRanking: null };
};

export const executeRankingSave = async (
	input: ExecuteRankingSaveInput,
	rankingsRef: CollectionReference<DocumentData>,
	deps: RankingFirestoreDeps,
	callbacks: ExecuteRankingSaveCallbacks,
): Promise<void> => {
	try {
		const { existingDocRef, existingRanking } = await lookupExistingRanking(
			rankingsRef,
			input.playerName,
			input.uid,
			deps,
		);

		const saveDecision = resolveRankingSaveDecision(
			existingRanking,
			input.score,
			input.totalTimeElapsed,
		);

		if (saveDecision === "skip") {
			return;
		}

		const rankingData = {
			...buildRankingPayload({
				playerName: input.playerName,
				score: input.score,
				totalTimeElapsed: input.totalTimeElapsed,
				uid: input.uid,
			}),
			timestamp: deps.createTimestamp(),
		};

		if (saveDecision === "update" && existingDocRef) {
			await deps.updateDoc(existingDocRef, rankingData);
		} else {
			await deps.addDoc(rankingsRef, rankingData);
		}

		if (shouldUpdateBestScore(input.score, input.bestScore)) {
			callbacks.onBestScoreUpdate(input.score, input.totalTimeElapsed);
		}

		await callbacks.onAfterSave();
	} catch (error) {
		console.error("Error saving ranking:", error);
		callbacks.onError();
	}
};
