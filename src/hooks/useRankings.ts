import type { Generation, Rankings } from "@/components/pokemon-game/types";
import type { DocumentData } from "firebase/firestore";
import {
	Timestamp,
	addDoc,
	collection,
	deleteDoc,
	getDocs,
	limit,
	orderBy,
	query,
	updateDoc,
	where,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";

interface UseRankingsProps {
	selectedGeneration: Generation;
	playerName: string;
	isGameActive: boolean;
}

export const useRankings = ({
	selectedGeneration,
	playerName,
	isGameActive,
}: UseRankingsProps) => {
	const [rankings, setRankings] = useState<Rankings[]>([]);
	const [bestScore, setBestScore] = useState(0);
	const [bestTime, setBestTime] = useState(0);
	const [userRanking, setUserRanking] = useState<number | null>(null);
	const [bestRanking, setBestRanking] = useState<number | null>(null);
	
	// Add refs to track last save attempt
	const lastSaveAttempt = useRef<{ score: number; time: number; timestamp: number } | null>(null);

	const convertToDisplayFormat = useCallback((name: string) => {
		return name.replace(/_/g, " ");
	}, []);

	const fetchRankings = useCallback(async () => {
		try {
			const rankingsRef = collection(
				db,
				`rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`,
			);
			const q = query(rankingsRef, orderBy("score", "desc"), limit(50));
			const querySnapshot = await getDocs(q);
			const rankingsData: Rankings[] = [];
			for (const doc of querySnapshot.docs) {
				const data = doc.data() as DocumentData;
				const storedName = data.name;
				const displayName = convertToDisplayFormat(storedName);

				rankingsData.push({
					name: displayName,
					score: data.score,
					time: data.time,
					timestamp:
						(data.timestamp as Timestamp)?.toDate() || new Date(data.timestamp),
					uid: data.uid || null,
				});
			}
			setRankings(rankingsData);

			// Find user's best record and update best score/time
			const userBestRecord = rankingsData.find((record) => {
				if (auth.currentUser) {
					return record.uid === auth.currentUser.uid;
				}
				return record.name === playerName;
			});

			if (userBestRecord) {
				setBestScore(userBestRecord.score);
				setBestTime(userBestRecord.time);
			} else {
				setBestScore(0);
				setBestTime(0);
			}
		} catch (error) {
			console.error("Error fetching rankings:", error);
		}
	}, [selectedGeneration, playerName, convertToDisplayFormat]);

	const calculateRankings = useCallback(
		async (score: number, totalTimeElapsed: number) => {
			try {
				const rankingsRef = collection(
					db,
					`rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`,
				);
				const q = query(rankingsRef, orderBy("score", "desc"));
				const querySnapshot = await getDocs(q);
				const allRankings = querySnapshot.docs.map((doc) => doc.data());

				// Calculate current ranking
				let currentRank = 1;
				for (const ranking of allRankings) {
					if (
						ranking.score > score ||
						(ranking.score === score && ranking.time <= totalTimeElapsed)
					) {
						currentRank++;
					}
				}
				setUserRanking(currentRank);

				// Calculate best ranking if different from current
				if (bestScore > 0 && bestScore !== score) {
					let bestRank = 1;
					for (const ranking of allRankings) {
						if (
							ranking.score > bestScore ||
							(ranking.score === bestScore && ranking.time <= bestTime)
						) {
							bestRank++;
						}
					}
					setBestRanking(bestRank);
				} else {
					setBestRanking(null);
				}
			} catch (error) {
				console.error("Error calculating rankings:", error);
				setUserRanking(null);
				setBestRanking(null);
			}
		},
		[selectedGeneration, bestScore, bestTime],
	);

	const saveRanking = useCallback(
		async (score: number, totalTimeElapsed: number) => {
			// Check if this is a duplicate call
			const now = Date.now();
			if (lastSaveAttempt.current) {
				const timeSinceLastAttempt = now - lastSaveAttempt.current.timestamp;
				if (
					timeSinceLastAttempt < 5000 && // Within 5 seconds
					lastSaveAttempt.current.score === score &&
					lastSaveAttempt.current.time === totalTimeElapsed
				) {
					console.log("🚫 Duplicate save attempt detected, skipping:", {
						timeSinceLastAttempt,
						lastAttempt: lastSaveAttempt.current,
						currentAttempt: { score, time: totalTimeElapsed }
					});
					return;
				}
			}

			// Update last save attempt
			lastSaveAttempt.current = {
				score,
				time: totalTimeElapsed,
				timestamp: now
			};

			console.log("🎯 Starting saveRanking:", { score, totalTimeElapsed, playerName });
			try {
				const rankingsRef = collection(
					db,
					`rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`,
				);
				console.log("📊 Collection path:", `rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`);

				// Find existing record for the user
				let existingDocRef = null;
				if (auth.currentUser) {
					console.log("🔍 Checking for existing record with UID:", auth.currentUser.uid);
					const userQuery = query(
						rankingsRef,
						where("uid", "==", auth.currentUser.uid),
					);
					const userDocs = await getDocs(userQuery);
					if (!userDocs.empty) {
						existingDocRef = userDocs.docs[0].ref;
						const existingData = userDocs.docs[0].data();
						console.log("📝 Found existing record:", { 
							existingScore: existingData.score, 
							newScore: score,
							existingTime: existingData.time,
							newTime: totalTimeElapsed 
						});
						// Only update if new score is better
						if (existingData.score >= score) {
							console.log("⏭️ Existing score is better, skipping update");
							return;
						}
						console.log("✨ New score is better, will update existing record");
					} else {
						console.log("🆕 No existing record found for UID, will create new");
					}
				} else {
					console.log("🔍 Checking for existing record with name:", playerName);
					const nameQuery = query(rankingsRef, where("name", "==", playerName));
					const nameDocs = await getDocs(nameQuery);
					if (!nameDocs.empty) {
						existingDocRef = nameDocs.docs[0].ref;
						const existingData = nameDocs.docs[0].data();
						console.log("📝 Found existing record:", { 
							existingScore: existingData.score, 
							newScore: score,
							existingTime: existingData.time,
							newTime: totalTimeElapsed 
						});
						// Only update if new score is better
						if (existingData.score >= score) {
							console.log("⏭️ Existing score is better, skipping update");
							return;
						}
						console.log("✨ New score is better, will update existing record");
					} else {
						console.log("🆕 No existing record found for name, will create new");
					}
				}

				// Always create a new timestamp for the new record
				const rankingData = {
					name: playerName,
					score: score,
					time: totalTimeElapsed,
					timestamp: Timestamp.now(), // Always use current timestamp for new records
					uid: auth.currentUser?.uid || null,
				};

				if (existingDocRef) {
					console.log("📤 Updating existing record with data:", rankingData);
					await updateDoc(existingDocRef, rankingData);
					console.log("✅ Successfully updated existing record");
				} else {
					console.log("📤 Creating new record with data:", rankingData);
					await addDoc(rankingsRef, rankingData);
					console.log("✅ Successfully created new record");
				}

				// Update local state
				if (score > bestScore) {
					console.log("🏆 Updating local best score:", { oldBest: bestScore, newBest: score });
					setBestScore(score);
					setBestTime(totalTimeElapsed);
				}

				console.log("🔄 Calculating new rankings...");
				// Calculate rankings after saving
				const q = query(rankingsRef, orderBy("score", "desc"));
				const querySnapshot = await getDocs(q);
				const allRankings = querySnapshot.docs.map((doc) => doc.data());

				// Calculate current ranking
				let currentRank = 1;
				for (const ranking of allRankings) {
					if (
						ranking.score > score ||
						(ranking.score === score && ranking.time <= totalTimeElapsed)
					) {
						currentRank++;
					}
				}
				console.log("📊 New current rank:", currentRank);
				setUserRanking(currentRank);

				// Calculate best ranking if different from current
				if (bestScore > 0 && bestScore !== score) {
					let bestRank = 1;
					for (const ranking of allRankings) {
						if (
							ranking.score > bestScore ||
							(ranking.score === bestScore && ranking.time <= bestTime)
						) {
							bestRank++;
						}
					}
					console.log("🏅 New best rank:", bestRank);
					setBestRanking(bestRank);
				} else {
					setBestRanking(null);
				}

				console.log("🔄 Refreshing rankings display...");
				await fetchRankings();
				console.log("✅ saveRanking completed successfully");
			} catch (error) {
				console.error("❌ Error saving ranking:", error);
			}
		},
		[selectedGeneration, playerName, bestScore, bestTime, fetchRankings],
	);

	// Fetch rankings when game is not active
	useEffect(() => {
		if (!isGameActive) {
			fetchRankings();
		}
	}, [isGameActive, fetchRankings]);

	return {
		rankings,
		bestScore,
		bestTime,
		userRanking,
		bestRanking,
		fetchRankings,
		calculateRankings,
		saveRanking,
		setBestScore,
		setBestTime,
		setUserRanking,
		setBestRanking,
	};
};
