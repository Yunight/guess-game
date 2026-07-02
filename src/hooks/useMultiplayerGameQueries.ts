import type { Pokemon } from "@/components/pokemon-game/types";
import { resolveDisplayScore } from "@/services/multiplayerGameStateLogic";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import {
	buildPlayerScoreEntries,
	type PlayerScoreEntry,
} from "@/services/multiplayerRoomUtils";
import { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } from "@/services/pokemonApi";

interface UseMultiplayerGameQueriesParams {
	room: MultiplayerRoom;
	localPlayerId: string;
	optimisticScores: Record<string, number>;
}

export interface UseMultiplayerGameQueriesResult {
	apiPokemonNames: string[];
	currentPokemon: Pokemon | undefined;
	isPokemonLoading: boolean;
	isShiny: boolean;
	localPlayerName: string;
	playerScores: PlayerScoreEntry[];
	localScore: number;
	roundNumber: number;
	roundPointsEarned: number;
	gameState: MultiplayerRoom["gameState"];
	totalCount: number;
	remainingCount: number;
	playerCount: number;
}

export const useMultiplayerGameQueries = ({
	room,
	localPlayerId,
	optimisticScores,
}: UseMultiplayerGameQueriesParams): UseMultiplayerGameQueriesResult => {
	const gameState = room.gameState;
	const currentPokemonId = gameState?.currentPokemonId ?? 0;

	const { data: apiPokemonNames = [] } = useGetAllPokemonNamesQuery(
		{
			startId: room.selectedGeneration.startId,
			endId: room.selectedGeneration.endId,
		},
		{
			refetchOnMountOrArgChange: false,
			refetchOnFocus: false,
			refetchOnReconnect: false,
		},
	);

	const { data: currentPokemon, isFetching: isPokemonLoading } = useGetPokemonByIdQuery(
		{ id: currentPokemonId },
		{
			skip: !currentPokemonId || room.status !== "playing",
		},
	);

	const isShiny = currentPokemon?.isShiny ?? false;

	const resolveScore = (playerId: string): number => {
		const firestoreScore = gameState?.scores[playerId] ?? 0;
		return resolveDisplayScore(firestoreScore, optimisticScores[playerId]);
	};

	const playerScores = buildPlayerScoreEntries(room, localPlayerId, resolveScore);
	const localPlayer = playerScores.find((player) => player.isLocal);

	const totalCount = room.selectedGeneration.endId - room.selectedGeneration.startId + 1;
	const remainingCount = gameState ? gameState.remainingPokemon.length + 1 : totalCount;

	return {
		apiPokemonNames,
		currentPokemon,
		isPokemonLoading,
		isShiny,
		localPlayerName: localPlayer?.name ?? "",
		playerScores,
		localScore: localPlayer?.score ?? 0,
		totalCount,
		remainingCount,
		playerCount: room.players.length,
		roundNumber: gameState?.roundNumber ?? 0,
		roundPointsEarned: gameState?.roundPointsEarned ?? 0,
		gameState,
	};
};
