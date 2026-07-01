import type { Timestamp } from "firebase/firestore";
import type { MultiplayerGameState } from "./multiplayerRoomTypes";

export const normalizeScores = (scores: Record<string, unknown>): Record<string, number> => {
	const normalized: Record<string, number> = {};
	for (const [playerId, score] of Object.entries(scores)) {
		if (typeof score === "number" && Number.isFinite(score)) {
			normalized[playerId] = score;
		}
	}
	return normalized;
};

export const applyCorrectGuessToGameState = (
	gameState: MultiplayerGameState,
	playerId: string,
	pointsEarned: number,
): MultiplayerGameState | null => {
	if (gameState.roundResolved) {
		return null;
	}
	const currentScore = gameState.scores[playerId] ?? 0;
	return {
		...gameState,
		scores: {
			...gameState.scores,
			[playerId]: currentScore + pointsEarned,
		},
		roundResolved: true,
		roundWinnerId: playerId,
		roundPointsEarned: pointsEarned,
	};
};

export const buildNextRoundGameState = (
	gameState: MultiplayerGameState,
	nextPokemonId: number,
	remainingPool: number[],
	roundDurationSeconds: number,
	roundStartedAt: Timestamp,
): MultiplayerGameState => ({
	...gameState,
	currentPokemonId: nextPokemonId,
	remainingPokemon: remainingPool,
	roundStartedAt,
	roundDurationSeconds,
	roundResolved: false,
	roundWinnerId: null,
	roundPointsEarned: 0,
	roundNumber: gameState.roundNumber + 1,
});

export const resolveDisplayScore = (
	firestoreScore: number,
	optimisticScore: number | undefined,
): number => Math.max(firestoreScore, optimisticScore ?? 0);
