import { resolvePoolAfterCorrectAnswer } from "@/components/pokemon-game/gamePool";
import { getInitialGuessTime } from "@/hooks/gameTimerLogic";
import type { Timestamp } from "firebase/firestore";
import { buildNextRoundGameState } from "./multiplayerGameStateLogic";
import type { MultiplayerGameState, MultiplayerRoom } from "./multiplayerRoomTypes";
import { MIN_MULTIPLAYER_PLAYERS } from "./multiplayerRoomUtils";

export type PlayingMultiplayerRoom = MultiplayerRoom & {
	status: "playing";
	gameState: MultiplayerGameState;
};

export interface RoomTransactionWriter {
	update: (roomRef: unknown, data: Record<string, unknown>) => void;
}

export const resolveWinnerId = (
	scores: Record<string, number>,
	playerIds: readonly string[],
): string | null => {
	if (playerIds.length === 0) {
		return null;
	}

	const ranked = playerIds.map((id) => ({
		id,
		score: scores[id] ?? 0,
	}));
	const maxScore = Math.max(...ranked.map((entry) => entry.score));
	const leaders = ranked.filter((entry) => entry.score === maxScore);
	if (leaders.length !== 1) {
		return null;
	}
	const leader = leaders[0];
	if (!leader) {
		return null;
	}
	return leader.id;
};

export const applyPoolProgressionInTransaction = (
	transaction: RoomTransactionWriter,
	roomRef: unknown,
	room: PlayingMultiplayerRoom,
	isShiny: boolean,
	roundStartedAt: Timestamp,
): void => {
	const poolResult = resolvePoolAfterCorrectAnswer(
		[room.gameState.currentPokemonId, ...room.gameState.remainingPokemon],
		room.gameState.currentPokemonId,
	);

	const playerIds = room.players.map((player) => player.id);

	if (poolResult.type === "game_complete") {
		transaction.update(roomRef, {
			status: "finished",
			winnerId: resolveWinnerId(room.gameState.scores, playerIds),
		});
		return;
	}

	const roundDurationSeconds = getInitialGuessTime(isShiny);

	transaction.update(roomRef, {
		gameState: buildNextRoundGameState(
			room.gameState,
			poolResult.nextPokemonId,
			poolResult.remainingPool,
			roundDurationSeconds,
			roundStartedAt,
		),
	});
};

export const isPlayingMultiplayerRoom = (
	room: MultiplayerRoom,
): room is PlayingMultiplayerRoom =>
	room.status === "playing" &&
	Boolean(room.gameState) &&
	room.players.length >= MIN_MULTIPLAYER_PLAYERS;
