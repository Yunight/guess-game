import { calculateEarnedPoints } from "@/components/pokemon-game/gameScoring";
import { getInitialGuessTime } from "@/hooks/gameTimerLogic";
import { computeGuessTimeLeft } from "@/hooks/multiplayerGameHandlerLogic";
import { Timestamp } from "firebase/firestore";
import type { MultiplayerGameState } from "./multiplayerRoomTypes";

export const resolveMultiplayerRoundScoring = (
	gameState: MultiplayerGameState,
	isShiny: boolean,
	nowMs: number = Timestamp.now().toMillis(),
): ReturnType<typeof calculateEarnedPoints> => {
	const roundDurationSeconds = gameState.roundDurationSeconds;
	const resolvedIsShiny =
		isShiny || roundDurationSeconds === getInitialGuessTime(true);
	const guessTimeLeft = computeGuessTimeLeft(
		gameState.roundStartedAt,
		roundDurationSeconds,
		nowMs,
	);

	return calculateEarnedPoints({
		isHardMode: true,
		guessTimeLeft,
		isShiny: resolvedIsShiny,
		showHypeTrain: false,
		roundDurationSeconds,
		isMultiplayer: true,
	});
};

export const resolveMultiplayerRoundPoints = (
	gameState: MultiplayerGameState,
	isShiny: boolean,
	nowMs: number = Timestamp.now().toMillis(),
): number =>
	resolveMultiplayerRoundScoring(gameState, isShiny, nowMs).earnedPoints;
