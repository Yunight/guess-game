import { skipToken } from "@reduxjs/toolkit/query";
import { useEffect } from "react";
import {
	useGetAllPokemonNamesQuery,
	useGetPokemonByIdQuery,
} from "@/services/pokemonApi";
import {
	resolveCurrentPokemonQueryArg,
	resolvePokemonNamesQueryArg,
	resolveRewardPokemonQueryArg,
	resolveSpinningPokemonQueryArg,
	shouldSkipCurrentPokemonQuery,
	shouldSkipRewardPokemonQuery,
	shouldSkipSpinningPokemonQuery,
} from "./pokemonGameQueryLogic";
import type { useGameState } from "./useGameState";

type GameState = ReturnType<typeof useGameState>["state"];
type GameSetters = ReturnType<typeof useGameState>["setters"];

interface UsePokemonGameQueriesParams {
	gameState: GameState;
	gameSetters: GameSetters;
	rewardPokemonId: number | null;
	spinningPokemonId: number | null;
	isSlotMachineRunning: boolean;
}

const syncCurrentPokemonToState = (
	currentPokemon: ReturnType<typeof useGetPokemonByIdQuery>["data"],
	gameSetters: GameSetters,
): void => {
	if (currentPokemon) {
		gameSetters.setCurrentPokemon(currentPokemon);
	}
};

export const usePokemonGameQueries = ({
	gameState,
	gameSetters,
	rewardPokemonId,
	spinningPokemonId,
	isSlotMachineRunning,
}: UsePokemonGameQueriesParams) => {
	const { data: apiPokemonNames = [] } = useGetAllPokemonNamesQuery(
		resolvePokemonNamesQueryArg(gameState),
		{
			refetchOnMountOrArgChange: false,
			refetchOnFocus: false,
			refetchOnReconnect: false,
		},
	);

	const { data: currentPokemon, isLoading: isPokemonLoading } =
		useGetPokemonByIdQuery(resolveCurrentPokemonQueryArg(gameState), {
			skip: shouldSkipCurrentPokemonQuery(
				gameState.currentPokemonId,
				gameState.isGameActive,
			),
			refetchOnMountOrArgChange: false,
			refetchOnFocus: false,
			refetchOnReconnect: false,
		});

	useEffect(() => {
		syncCurrentPokemonToState(currentPokemon, gameSetters);
	}, [currentPokemon, gameSetters]);

	const { data: rewardPokemonData, isLoading: isRewardPokemonLoading } =
		useGetPokemonByIdQuery(
			resolveRewardPokemonQueryArg(rewardPokemonId, gameState.maxHypeChain),
			{
				skip: shouldSkipRewardPokemonQuery(
					rewardPokemonId,
					gameState.gameOver,
				),
			},
		);

	const { data: spinningPokemonData } = useGetPokemonByIdQuery(
		resolveSpinningPokemonQueryArg(
			spinningPokemonId,
			gameState.maxHypeChain,
		),
		{
			skip: shouldSkipSpinningPokemonQuery(
				spinningPokemonId,
				isSlotMachineRunning,
			),
		},
	);

	return {
		apiPokemonNames,
		currentPokemon,
		isPokemonLoading,
		rewardPokemonData,
		isRewardPokemonLoading,
		spinningPokemonData,
	};
};
