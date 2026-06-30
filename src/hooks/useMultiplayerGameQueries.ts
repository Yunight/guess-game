import type { Pokemon } from "@/components/pokemon-game/types";
import { resolveDisplayScore } from "@/services/multiplayerGameStateLogic";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import {
	useGetAllPokemonNamesQuery,
	useGetPokemonByIdQuery,
} from "@/services/pokemonApi";

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
	opponentName: string;
	hostName: string;
	guestName: string;
	hostPlayerId: string;
	localScore: number;
	opponentScore: number;
	hostScore: number;
	guestScore: number;
	totalCount: number;
	remainingCount: number;
	roundNumber: number;
	roundPointsEarned: number;
	gameState: MultiplayerRoom["gameState"];
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

	const { data: currentPokemon, isFetching: isPokemonLoading } =
		useGetPokemonByIdQuery(
			{ id: currentPokemonId },
			{
				skip: !currentPokemonId || room.status !== "playing",
			},
		);

	const isShiny = currentPokemon?.isShiny ?? false;

	const localPlayerName =
		room.hostPlayer.id === localPlayerId
			? room.hostPlayer.name
			: (room.guestPlayer?.name ?? "");
	const opponentName =
		room.hostPlayer.id === localPlayerId
			? (room.guestPlayer?.name ?? "")
			: room.hostPlayer.name;
	const opponentPlayerId =
		room.hostPlayer.id === localPlayerId
			? room.guestPlayer?.id
			: room.hostPlayer.id;

	const hostName = room.hostPlayer.name;
	const guestName = room.guestPlayer?.name ?? "";
	const hostPlayerId = room.hostPlayer.id;
	const guestPlayerId = room.guestPlayer?.id;

	const resolveScore = (playerId: string | undefined): number => {
		if (!playerId) {
			return 0;
		}
		const firestoreScore = gameState?.scores[playerId] ?? 0;
		return resolveDisplayScore(firestoreScore, optimisticScores[playerId]);
	};

	const totalCount =
		room.selectedGeneration.endId - room.selectedGeneration.startId + 1;
	const remainingCount = gameState
		? gameState.remainingPokemon.length + 1
		: totalCount;

	return {
		apiPokemonNames,
		currentPokemon,
		isPokemonLoading,
		isShiny,
		localPlayerName,
		opponentName,
		hostName,
		guestName,
		hostPlayerId,
		localScore: resolveScore(localPlayerId),
		opponentScore: resolveScore(opponentPlayerId),
		hostScore: resolveScore(hostPlayerId),
		guestScore: resolveScore(guestPlayerId),
		totalCount,
		remainingCount,
		roundNumber: gameState?.roundNumber ?? 0,
		roundPointsEarned: gameState?.roundPointsEarned ?? 0,
		gameState,
	};
};
