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
	where,
} from "firebase/firestore";
import { useCallback, useEffect, useState } from "react";
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
			try {
				const rankingsRef = collection(
					db,
					`rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`,
				);

				// Check if this is a better score than the user's previous best
				let shouldSave = true;
				if (auth.currentUser) {
					const userQuery = query(
						rankingsRef,
						where("uid", "==", auth.currentUser.uid),
					);
					const userDocs = await getDocs(userQuery);
					if (!userDocs.empty) {
						const bestUserScore = Math.max(
							...userDocs.docs.map((doc) => doc.data().score),
						);
						shouldSave = score > bestUserScore;
					}
				} else {
					const nameQuery = query(rankingsRef, where("name", "==", playerName));
					const nameDocs = await getDocs(nameQuery);
					if (!nameDocs.empty) {
						const bestNameScore = Math.max(
							...nameDocs.docs.map((doc) => doc.data().score),
						);
						shouldSave = score > bestNameScore;
					}
				}

				if (shouldSave) {
					// Delete previous records for this user
					if (auth.currentUser) {
						const userDocs = await getDocs(
							query(rankingsRef, where("uid", "==", auth.currentUser.uid))
						);
						for (const doc of userDocs.docs) {
							await deleteDoc(doc.ref);
						}
					} else {
						const nameDocs = await getDocs(
							query(rankingsRef, where("name", "==", playerName))
						);
						for (const doc of nameDocs.docs) {
							await deleteDoc(doc.ref);
						}
					}

					// Save new record
					await addDoc(rankingsRef, {
						name: playerName,
						score: score,
						time: totalTimeElapsed,
						timestamp: Timestamp.now(),
						uid: auth.currentUser?.uid || null,
					});

					// Update local state
					if (score > bestScore) {
						setBestScore(score);
						setBestTime(totalTimeElapsed);
					}

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

					// Refresh rankings display
					await fetchRankings();
				}
			} catch (error) {
				console.error("Error saving ranking:", error);
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
