import type { Generation } from "@/components/pokemon-game/generations";
import type { Rankings } from "@/components/pokemon-game/types";
import {
	Timestamp,
	addDoc,
	collection,
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
import {
	calculateRankFromEntries,
	getRankingsCollectionPath,
	isDuplicateSaveAttempt,
	mapRankingDocuments,
	RANKINGS_CALCULATION_LIMIT,
	RANKINGS_DISPLAY_LIMIT,
} from "../services/rankingUtils";
import {
	buildRankingPayload,
	extractExistingRankingFromDocs,
	resolveRankingSaveDecision,
	shouldLookupRankingByUid,
	shouldUpdateBestScore,
} from "../services/rankingSaveLogic";

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
	const [rankingError, setRankingError] = useState<string | null>(null);

	const lastSaveAttempt = useRef<{
		score: number;
		time: number;
		timestamp: number;
	} | null>(null);

	const getRankingsCollectionRef = useCallback(() => {
		return collection(
			db,
			getRankingsCollectionPath(
				selectedGeneration.startId,
				selectedGeneration.endId,
			),
		);
	}, [selectedGeneration.endId, selectedGeneration.startId]);

	const fetchRankingsForCalculation = useCallback(async () => {
		const rankingsRef = getRankingsCollectionRef();
		const q = query(
			rankingsRef,
			orderBy("score", "desc"),
			limit(RANKINGS_CALCULATION_LIMIT),
		);
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
			const q = query(
				rankingsRef,
				orderBy("score", "desc"),
				limit(RANKINGS_DISPLAY_LIMIT),
			);
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
				const currentRank = calculateRankFromEntries(
					allRankings,
					score,
					totalTimeElapsed,
				);
				setUserRanking(currentRank);

				if (bestScore > 0 && bestScore !== score) {
					const bestRank = calculateRankFromEntries(
						allRankings,
						bestScore,
						bestTime,
					);
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
		async (score: number, totalTimeElapsed: number) => {
			const now = Date.now();
			if (
				isDuplicateSaveAttempt(lastSaveAttempt.current, score, totalTimeElapsed, now)
			) {
				return;
			}

			lastSaveAttempt.current = {
				score,
				time: totalTimeElapsed,
				timestamp: now,
			};

			try {
				setRankingError(null);
				const rankingsRef = getRankingsCollectionRef();

				let existingDocRef = null;
				let existingRanking = null;

				const uid = auth.currentUser?.uid;

				if (shouldLookupRankingByUid(uid)) {
					const userQuery = query(rankingsRef, where("uid", "==", uid));
					const userDocs = await getDocs(userQuery);
					if (!userDocs.empty) {
						existingDocRef = userDocs.docs[0]?.ref ?? null;
						existingRanking = extractExistingRankingFromDocs(userDocs.docs);
					}
				} else {
					const nameQuery = query(rankingsRef, where("name", "==", playerName));
					const nameDocs = await getDocs(nameQuery);
					if (!nameDocs.empty) {
						existingDocRef = nameDocs.docs[0]?.ref ?? null;
						existingRanking = extractExistingRankingFromDocs(nameDocs.docs);
					}
				}

				const saveDecision = resolveRankingSaveDecision(
					existingRanking,
					score,
					totalTimeElapsed,
				);

				if (saveDecision === "skip") {
					return;
				}

				const rankingData = {
					...buildRankingPayload({
						playerName,
						score,
						totalTimeElapsed,
						uid: auth.currentUser?.uid ?? null,
					}),
					timestamp: Timestamp.now(),
				};

				if (saveDecision === "update" && existingDocRef) {
					await updateDoc(existingDocRef, rankingData);
				} else {
					await addDoc(rankingsRef, rankingData);
				}

				if (shouldUpdateBestScore(score, bestScore)) {
					setBestScore(score);
					setBestTime(totalTimeElapsed);
				}

				await calculateRankings(score, totalTimeElapsed);
				await fetchRankings();
			} catch (error) {
				console.error("Error saving ranking:", error);
				setRankingError("rankingSaveError");
			}
		},
		[
			bestScore,
			calculateRankings,
			fetchRankings,
			getRankingsCollectionRef,
			playerName,
		],
	);

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
