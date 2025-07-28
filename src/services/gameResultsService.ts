import {
	type FieldValue,
	type Timestamp,
	collection,
	doc,
	getDoc,
	serverTimestamp,
	setDoc,
} from "firebase/firestore";
import type { Pokemon } from "../components/pokemon-game/types";
import { db } from "../firebase";

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
}

export const gameResultsService = {
	/**
	 * Save a game result to Firebase and return the unique ID
	 */
	async saveGameResult(
		resultData: Omit<GameResult, "id" | "createdAt">,
	): Promise<string> {
		try {
			// Generate a unique ID for the result
			const resultId = doc(collection(db, "gameResults")).id;

			const gameResult = {
				...resultData,
				id: resultId,
				createdAt: serverTimestamp(),
			};

			// Save to Firebase
			await setDoc(doc(db, "gameResults", resultId), gameResult);

			console.log("Game result saved with ID:", resultId);
			return resultId;
		} catch (error) {
			console.error("Error saving game result:", error);
			throw new Error("Failed to save game result");
		}
	},

	/**
	 * Retrieve a game result by its ID
	 */
	async getGameResult(resultId: string): Promise<GameResult | null> {
		try {
			const docRef = doc(db, "gameResults", resultId);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				return docSnap.data() as GameResult;
			}

			console.log("No game result found for ID:", resultId);
			return null;
		} catch (error) {
			console.error("Error retrieving game result:", error);
			throw new Error("Failed to retrieve game result");
		}
	},

	/**
	 * Generate a shareable URL for a game result
	 */
	generateShareableUrl(resultId: string): string {
		const baseUrl = window.location.origin;
		return `${baseUrl}/results/${resultId}`;
	},
};
