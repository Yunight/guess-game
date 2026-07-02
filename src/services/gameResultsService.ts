import type { Query, QuerySnapshot } from "firebase/firestore";
import {
	type Timestamp,
	collection,
	deleteDoc,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	serverTimestamp,
	setDoc,
	where,
} from "firebase/firestore";
import type { Pokemon } from "../components/pokemon-game/types";
import { db } from "../firebase";
import {
	buildExpirationDate,
	extractTimestampMs,
	GameResultValidationError,
	isDailyGlobalLimitReached,
	isDailyUserLimitReached,
	STORAGE_LIMITS,
	validateGameResultInput,
} from "./gameResultsValidation";

export interface GameResult {
	id: string;
	playerName: string;
	score: number;
	totalTimeElapsed: number;
	userRanking: number | null;
	selectedGeneration: {
		name: string;
		startId: number;
		endId: number;
	};
	rewardPokemon: Pokemon | null;
	remainingPokemon: number[];
	criticalHitCount: number;
	criticalSuccessCount: number;
	hyperTrainCount: number;
	maxHypeChain: number;
	createdAt: Timestamp;
	gameMode?: string;
	isShared?: boolean;
	viewCount?: number;
	expiresAt?: Timestamp;
}

const mapQueryTimestamps = async (recentQuery: Query): Promise<number[]> => {
	const snapshot: QuerySnapshot = await getDocs(recentQuery);
	return snapshot.docs
		.map((docSnap) => extractTimestampMs(docSnap.data().createdAt))
		.filter((timestamp): timestamp is number => timestamp !== null);
};

const getRecentSaveTimestamps = async (playerName: string): Promise<number[]> => {
	const recentQuery = query(
		collection(db, "gameResults"),
		where("playerName", "==", playerName),
		limit(STORAGE_LIMITS.MAX_USER_RESULTS_PER_DAY + 5),
	);
	return mapQueryTimestamps(recentQuery);
};

const getGlobalSaveTimestampsToday = async (): Promise<number[]> => {
	const recentQuery = query(
		collection(db, "gameResults"),
		orderBy("createdAt", "desc"),
		limit(STORAGE_LIMITS.MAX_RESULTS_PER_DAY + 5),
	);
	return mapQueryTimestamps(recentQuery);
};

export const gameResultsService = {
	async saveGameResult(resultData: Omit<GameResult, "id" | "createdAt">): Promise<string> {
		try {
			validateGameResultInput({
				playerName: resultData.playerName,
				score: resultData.score,
				remainingPokemonCount: resultData.remainingPokemon.length,
				userRanking: resultData.userRanking,
			});

			const userTimestamps = await getRecentSaveTimestamps(resultData.playerName);
			if (isDailyUserLimitReached(userTimestamps)) {
				throw new GameResultValidationError("Daily user save limit exceeded");
			}

			const globalTimestamps = await getGlobalSaveTimestampsToday();
			if (isDailyGlobalLimitReached(globalTimestamps)) {
				throw new GameResultValidationError("Daily global save limit exceeded");
			}

			const timestamp = Date.now();
			const randomPart = Math.random().toString(36).slice(2, 11);
			const resultId = doc(collection(db, "gameResults")).id;

			const existingDoc = await getDoc(doc(db, "gameResults", resultId));
			const resolvedId = existingDoc.exists() ? `${resultId}_${timestamp}_${randomPart}` : resultId;

			const expirationDate = buildExpirationDate({
				playerName: resultData.playerName,
				score: resultData.score,
				remainingPokemonCount: resultData.remainingPokemon.length,
				userRanking: resultData.userRanking,
			});

			const gameResult = {
				...resultData,
				id: resolvedId,
				createdAt: serverTimestamp(),
				isShared: false,
				viewCount: 0,
				expiresAt: expirationDate,
			};

			await setDoc(doc(db, "gameResults", resolvedId), gameResult);
			return resolvedId;
		} catch (error) {
			console.error("Error saving game result:", error);
			if (error instanceof GameResultValidationError) {
				throw error;
			}
			throw new Error("Failed to save game result");
		}
	},

	async getGameResult(resultId: string): Promise<GameResult | null> {
		try {
			const docRef = doc(db, "gameResults", resultId);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				const result = docSnap.data() as GameResult;

				if (result.expiresAt && result.expiresAt.toDate() < new Date()) {
					await this.deleteExpiredResult(resultId);
					return null;
				}

				if ((result.viewCount || 0) < STORAGE_LIMITS.MAX_VIEWS_PER_RESULT) {
					this.incrementViewCount(resultId).catch(console.error);
				}

				return result;
			}

			return null;
		} catch (error) {
			console.error("Error retrieving game result:", error);
			throw new Error("Failed to retrieve game result");
		}
	},

	async incrementViewCount(resultId: string): Promise<void> {
		try {
			const docRef = doc(db, "gameResults", resultId);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				const data = docSnap.data();
				const currentViews = data.viewCount || 0;

				if (currentViews >= STORAGE_LIMITS.MAX_VIEWS_PER_RESULT) {
					return;
				}

				await setDoc(
					docRef,
					{
						...data,
						isShared: true,
						viewCount: currentViews + 1,
					},
					{ merge: true },
				);
			}
		} catch (error) {
			console.error("Error incrementing view count:", error);
		}
	},

	async deleteExpiredResult(resultId: string): Promise<void> {
		try {
			await deleteDoc(doc(db, "gameResults", resultId));
		} catch (error) {
			console.error("Error deleting expired result:", error);
		}
	},

	async cleanupExpiredResults(): Promise<number> {
		try {
			const now = new Date();
			const expiredQuery = query(
				collection(db, "gameResults"),
				where("expiresAt", "<=", now),
				limit(STORAGE_LIMITS.CLEANUP_BATCH_SIZE),
			);

			const querySnapshot = await getDocs(expiredQuery);

			await Promise.all(querySnapshot.docs.map((docSnap) => deleteDoc(docSnap.ref)));

			return querySnapshot.docs.length;
		} catch (error) {
			console.error("Error cleaning up expired results:", error);
			return 0;
		}
	},

	async getPopularResults(limitCount = 10): Promise<GameResult[]> {
		try {
			const popularQuery = query(
				collection(db, "gameResults"),
				where("isShared", "==", true),
				orderBy("viewCount", "desc"),
				limit(limitCount),
			);

			const querySnapshot = await getDocs(popularQuery);
			return querySnapshot.docs.map((docSnap) => docSnap.data() as GameResult);
		} catch (error) {
			console.error("Error getting popular results:", error);
			return [];
		}
	},

	generateShareableUrl(resultId: string): string {
		const baseUrl = window.location.origin;
		const timestamp = Date.now();
		return `${baseUrl}/results/${resultId}?t=${timestamp}`;
	},
};
