import { useState, useCallback, useEffect } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import {
	collection,
	getDocs,
	query,
	orderBy,
	limit,
	Timestamp,
	DocumentData,
} from "firebase/firestore";
import type { Generation, Rankings } from "@/components/pokemon-game/types";

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
					// For authenticated users, match by UID
					return record.uid === auth.currentUser.uid;
				} else {
					// For non-authenticated users, match by name
					return record.name === playerName;
				}
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

	// Fetch rankings when generation changes or game is not active
	useEffect(() => {
		if (!isGameActive) {
			fetchRankings();
		}
	}, [selectedGeneration, isGameActive, fetchRankings]);

	return {
		rankings,
		bestScore,
		bestTime,
		userRanking,
		bestRanking,
		fetchRankings,
		calculateRankings,
		setBestScore,
		setBestTime,
		setUserRanking,
		setBestRanking,
	};
};
