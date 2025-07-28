import {
	type FieldValue,
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
	// New fields for optimization
	isShared?: boolean;
	viewCount?: number;
	expiresAt?: Timestamp;
}

// Usage monitoring and cost optimization
export const STORAGE_LIMITS = {
	MAX_RESULTS_PER_DAY: 1000, // Prevent spam
	MAX_VIEWS_PER_RESULT: 10000, // Popular result limit
	CLEANUP_BATCH_SIZE: 50, // Process deletions in batches
	MAX_USER_RESULTS_PER_DAY: 20, // Per-user daily limit
};

export const gameResultsService = {
	/**
	 * Save a game result to Firebase and return the unique ID
	 * Includes anti-spam and cost optimization
	 */
	async saveGameResult(
		resultData: Omit<GameResult, "id" | "createdAt">,
	): Promise<string> {
		try {
			// Basic validation to prevent spam
			if (!resultData.playerName || resultData.playerName.length > 50) {
				throw new Error("Invalid player name");
			}

			if (resultData.score < 0 || resultData.score > 10000) {
				throw new Error("Invalid score range");
			}

			// Generate a unique ID for the result with additional entropy
			const timestamp = Date.now();
			const randomPart = Math.random().toString(36).substr(2, 9);
			const resultId = doc(collection(db, "gameResults")).id;

			console.log("🆔 Generated NEW Firebase document ID:", resultId);
			console.log(
				"🔒 Additional entropy - timestamp:",
				timestamp,
				"random:",
				randomPart,
			);

			// Check if this ID already exists (very unlikely but just in case)
			const existingDoc = await getDoc(doc(db, "gameResults", resultId));
			if (existingDoc.exists()) {
				console.warn("⚠️ Document ID collision detected, generating new ID");
				// Generate a new ID with additional entropy
				const fallbackId = `${resultId}_${timestamp}_${randomPart}`;
				console.log("🔄 Using fallback ID:", fallbackId);

				// Set expiration date (30 days from now for non-exceptional scores)
				const expirationDate = new Date();
				const isExceptionalScore =
					resultData.score >= 1000 ||
					resultData.remainingPokemon.length === 0 ||
					(resultData.userRanking && resultData.userRanking <= 10);

				// Exceptional results last longer (90 days), regular ones expire in 30 days
				expirationDate.setDate(
					expirationDate.getDate() + (isExceptionalScore ? 90 : 30),
				);

				const gameResult = {
					...resultData,
					id: fallbackId,
					createdAt: serverTimestamp(),
					isShared: false,
					viewCount: 0,
					expiresAt: expirationDate,
				};

				console.log("💾 Saving game result with fallback ID:", {
					id: fallbackId,
					playerName: resultData.playerName,
					score: resultData.score,
					rewardPokemon: resultData.rewardPokemon?.englishName,
					timestamp: new Date().toISOString(),
				});

				// Save to Firebase with fallback ID
				await setDoc(doc(db, "gameResults", fallbackId), gameResult);

				console.log(
					"✅ Game result successfully saved to Firebase with fallback ID:",
					fallbackId,
					"Expires:",
					expirationDate,
				);
				return fallbackId;
			}

			// Set expiration date (30 days from now for non-exceptional scores)
			const expirationDate = new Date();
			const isExceptionalScore =
				resultData.score >= 1000 ||
				resultData.remainingPokemon.length === 0 ||
				(resultData.userRanking && resultData.userRanking <= 10);

			// Exceptional results last longer (90 days), regular ones expire in 30 days
			expirationDate.setDate(
				expirationDate.getDate() + (isExceptionalScore ? 90 : 30),
			);

			const gameResult = {
				...resultData,
				id: resultId,
				createdAt: serverTimestamp(),
				isShared: false,
				viewCount: 0,
				expiresAt: expirationDate,
			};

			console.log("💾 Saving game result with data:", {
				id: resultId,
				playerName: resultData.playerName,
				score: resultData.score,
				rewardPokemon: resultData.rewardPokemon?.englishName,
				timestamp: new Date().toISOString(),
			});

			// Save to Firebase
			await setDoc(doc(db, "gameResults", resultId), gameResult);

			console.log(
				"✅ Game result successfully saved to Firebase with ID:",
				resultId,
				"Expires:",
				expirationDate,
			);
			return resultId;
		} catch (error) {
			console.error("Error saving game result:", error);
			throw new Error("Failed to save game result");
		}
	},

	/**
	 * Retrieve a game result by its ID and increment view count
	 */
	async getGameResult(resultId: string): Promise<GameResult | null> {
		try {
			const docRef = doc(db, "gameResults", resultId);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				const result = docSnap.data() as GameResult;

				// Check if result has expired
				if (result.expiresAt && result.expiresAt.toDate() < new Date()) {
					console.log("Result has expired:", resultId);
					// Optionally delete expired result
					await this.deleteExpiredResult(resultId);
					return null;
				}

				// Increment view count and mark as shared (fire and forget)
				// Only if not exceeded max views
				if ((result.viewCount || 0) < STORAGE_LIMITS.MAX_VIEWS_PER_RESULT) {
					this.incrementViewCount(resultId).catch(console.error);
				}

				return result;
			}

			console.log("No game result found for ID:", resultId);
			return null;
		} catch (error) {
			console.error("Error retrieving game result:", error);
			throw new Error("Failed to retrieve game result");
		}
	},

	/**
	 * Increment view count for a shared result
	 */
	async incrementViewCount(resultId: string): Promise<void> {
		try {
			const docRef = doc(db, "gameResults", resultId);
			const docSnap = await getDoc(docRef);

			if (docSnap.exists()) {
				const data = docSnap.data();
				const currentViews = data.viewCount || 0;

				// Don't increment if already at max
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

	/**
	 * Delete an expired result
	 */
	async deleteExpiredResult(resultId: string): Promise<void> {
		try {
			await deleteDoc(doc(db, "gameResults", resultId));
			console.log("Deleted expired result:", resultId);
		} catch (error) {
			console.error("Error deleting expired result:", error);
		}
	},

	/**
	 * Clean up expired results (call this periodically)
	 * Recommended: Run this daily via Cloud Functions
	 */
	async cleanupExpiredResults(): Promise<number> {
		try {
			const now = new Date();
			const expiredQuery = query(
				collection(db, "gameResults"),
				where("expiresAt", "<=", now),
				limit(STORAGE_LIMITS.CLEANUP_BATCH_SIZE),
			);

			const querySnapshot = await getDocs(expiredQuery);
			let deletedCount = 0;

			for (const docSnap of querySnapshot.docs) {
				await deleteDoc(docSnap.ref);
				deletedCount++;
			}

			console.log(`Cleaned up ${deletedCount} expired results`);
			return deletedCount;
		} catch (error) {
			console.error("Error cleaning up expired results:", error);
			return 0;
		}
	},

	/**
	 * Get popular results (most viewed)
	 */
	async getPopularResults(limitCount = 10): Promise<GameResult[]> {
		try {
			const popularQuery = query(
				collection(db, "gameResults"),
				where("isShared", "==", true),
				orderBy("viewCount", "desc"),
				limit(limitCount),
			);

			const querySnapshot = await getDocs(popularQuery);
			return querySnapshot.docs.map((doc) => doc.data() as GameResult);
		} catch (error) {
			console.error("Error getting popular results:", error);
			return [];
		}
	},

	/**
	 * Generate a shareable URL for a game result
	 */
	generateShareableUrl(resultId: string): string {
		const baseUrl = window.location.origin;
		// Add a cache-busting parameter to ensure fresh loads
		const timestamp = Date.now();
		const url = `${baseUrl}/results/${resultId}?t=${timestamp}`;
		console.log(
			"🔗 Generated shareable URL:",
			url,
			"from ID:",
			resultId,
			"at timestamp:",
			timestamp,
		);
		return url;
	},
};

/* 
🔥 RECOMMENDED FIREBASE RULES:
Copy this to your Firestore rules:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Game results - public read, restricted write
    match /gameResults/{document} {
      allow read: if true;
      allow write: if request.auth != null 
        && resource == null 
        && request.resource.data.score >= 0 
        && request.resource.data.score <= 10000
        && request.resource.data.playerName.size() <= 50;
      allow update: if request.auth != null 
        && (request.resource.data.diff(resource.data).affectedKeys()
            .hasOnly(['viewCount', 'isShared']));
      allow delete: if request.auth != null;
    }
  }
}

💰 COST OPTIMIZATION TIPS:
1. Enable Firebase Usage Alerts (set budget limit)
2. Use Firebase Analytics to monitor storage growth
3. Consider implementing user-based rate limiting
4. Monitor popular results to prevent viral cost spikes
5. Set up Cloud Functions for automated cleanup
*/
