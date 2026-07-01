import { resolvePoolAfterCorrectAnswer } from "@/components/pokemon-game/gamePool";
import { getInitialGuessTime } from "@/hooks/gameTimerLogic";
import type { Timestamp } from "firebase/firestore";
import { buildNextRoundGameState } from "./multiplayerGameStateLogic";
import type {
	MultiplayerGameState,
	MultiplayerPlayer,
	MultiplayerRoom,
} from "./multiplayerRoomTypes";

export type PlayingMultiplayerRoom = MultiplayerRoom & {
	status: "playing";
	gameState: MultiplayerGameState;
	guestPlayer: MultiplayerPlayer;
};

export interface RoomTransactionWriter {
	update: (roomRef: unknown, data: Record<string, unknown>) => void;
}

export const resolveWinnerId = (
	scores: Record<string, number>,
	hostPlayerId: string,
	guestPlayerId: string,
): string | null => {
	const hostScore = scores[hostPlayerId] ?? 0;
	const guestScore = scores[guestPlayerId] ?? 0;
	if (hostScore > guestScore) {
		return hostPlayerId;
	}
	if (guestScore > hostScore) {
		return guestPlayerId;
	}
	return null;
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

	if (poolResult.type === "game_complete") {
		transaction.update(roomRef, {
			status: "finished",
			winnerId: resolveWinnerId(room.gameState.scores, room.hostPlayer.id, room.guestPlayer.id),
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
