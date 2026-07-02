import type { Generation } from "@/components/pokemon-game/generations";
import type { Rankings } from "@/components/pokemon-game/types";
import {
	Timestamp,
	addDoc,
	collection,
	doc,
	getDoc,
	getDocs,
	limit,
	orderBy,
	query,
	setDoc,
	updateDoc,
	where,
} from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { auth } from "../firebase";
import { db } from "../firebase";
import { executeRankingSave } from "../services/rankingSaveLogic";
import {
	calculateRankFromEntries,
	getRankingsCollectionPath,
	isDuplicateSaveAttempt,
	mapRankingDocuments,
	RANKINGS_CALCULATION_LIMIT,
	RANKINGS_DISPLAY_LIMIT,
} from "../services/rankingUtils";

interface UseRankingsProps {
	selectedGeneration: Generation;
	playerName: string;
}

export const useRankings = ({ selectedGeneration, playerName }: UseRankingsProps) => {
	const [rankings, setRankings] = useState<Rankings[]>([]);
	const [bestScore, setBestScore] = useState(0);
	const [bestTime, setBestTime] = useState(0);
	const [userRanking, setUserRanking] = useState<number | null>(null);
	const [bestRanking, setBestRanking] = useState<number | null>(null);
	const [rankingError, setRankingError] = useState<string | null>(null);

	const lastSaveAttempt = useRef<{
		score: number;
		time: number;
		timestamp: number;
	} | null>(null);

	const getRankingsCollectionRef = useCallback(() => {
		return collection(
			db,
			getRankingsCollectionPath(selectedGeneration.startId, selectedGeneration.endId),
		);
	}, [selectedGeneration.endId, selectedGeneration.startId]);

	const fetchRankingsForCalculation = useCallback(async () => {
		const rankingsRef = getRankingsCollectionRef();
		const q = query(rankingsRef, orderBy("score", "desc"), limit(RANKINGS_CALCULATION_LIMIT));
		const querySnapshot = await getDocs(q);
		return querySnapshot.docs.map((docSnap) => docSnap.data());
	}, [getRankingsCollectionRef]);

	const updateUserBestFromRankings = useCallback(
		(rankingsData: Rankings[]) => {
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
		},
		[playerName],
	);

	const fetchRankings = useCallback(async () => {
		try {
			setRankingError(null);
			const rankingsRef = getRankingsCollectionRef();
			const q = query(rankingsRef, orderBy("score", "desc"), limit(RANKINGS_DISPLAY_LIMIT));
			const querySnapshot = await getDocs(q);
			const rankingsData = mapRankingDocuments(querySnapshot.docs);
			setRankings(rankingsData);
			updateUserBestFromRankings(rankingsData);
		} catch (error) {
			console.error("Error fetching rankings:", error);
			setRankingError("rankingFetchError");
		}
	}, [getRankingsCollectionRef, updateUserBestFromRankings]);

	const calculateRankings = useCallback(
		async (score: number, totalTimeElapsed: number) => {
			try {
				setRankingError(null);
				const allRankings = await fetchRankingsForCalculation();
				const currentRank = calculateRankFromEntries(allRankings, score, totalTimeElapsed);
				setUserRanking(currentRank);

				if (bestScore > 0 && bestScore !== score) {
					const bestRank = calculateRankFromEntries(allRankings, bestScore, bestTime);
					setBestRanking(bestRank);
				} else {
					setBestRanking(null);
				}
			} catch (error) {
				console.error("Error calculating rankings:", error);
				setRankingError("rankingFetchError");
				setUserRanking(null);
				setBestRanking(null);
			}
		},
		[bestScore, bestTime, fetchRankingsForCalculation],
	);

	const saveRanking = useCallback(
		async (score: number, totalTimeElapsed: number): Promise<void> => {
			const now = Date.now();
			if (isDuplicateSaveAttempt(lastSaveAttempt.current, score, totalTimeElapsed, now)) {
				return;
			}

			lastSaveAttempt.current = {
				score,
				time: totalTimeElapsed,
				timestamp: now,
			};

			setRankingError(null);
			await executeRankingSave(
				{
					score,
					totalTimeElapsed,
					playerName,
					bestScore,
					uid: auth.currentUser?.uid ?? null,
				},
				getRankingsCollectionRef(),
				{
					doc,
					getDoc,
					query,
					where,
					getDocs,
					addDoc,
					setDoc,
					updateDoc,
					createTimestamp: () => Timestamp.now(),
				},
				{
					onBestScoreUpdate: (newScore, newTime) => {
						setBestScore(newScore);
						setBestTime(newTime);
					},
					onAfterSave: async () => {
						await calculateRankings(score, totalTimeElapsed);
						await fetchRankings();
					},
					onError: () => {
						setRankingError("rankingSaveError");
					},
				},
			);
		},
		[bestScore, calculateRankings, fetchRankings, getRankingsCollectionRef, playerName],
	);

	useEffect(() => {
		void fetchRankings();
	}, [fetchRankings]);

	return {
		rankings,
		bestScore,
		bestTime,
		userRanking,
		bestRanking,
		rankingError,
		clearRankingError: () => setRankingError(null),
		fetchRankings,
		calculateRankings,
		saveRanking,
		setBestScore,
		setBestTime,
		setUserRanking,
		setBestRanking,
	};
};
