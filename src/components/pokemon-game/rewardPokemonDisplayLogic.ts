import type { Pokemon } from "./types";

export interface GenerationRange {
	startId: number;
	endId: number;
}

export const isPokemonInGeneration = (
	pokemon: Pokemon,
	generation: GenerationRange,
): boolean => {
	return pokemon.id >= generation.startId && pokemon.id <= generation.endId;
};

export const resolveRewardCurrentPokemon = (
	isSlotMachineRunning: boolean,
	spinningPokemon: Pokemon | undefined,
	pokemon: Pokemon | undefined,
): Pokemon | undefined => {
	return isSlotMachineRunning ? spinningPokemon : pokemon;
};

export const shouldShowRewardDisplay = (
	pokemon: Pokemon | undefined,
	isLoading: boolean,
	spinningPokemon: Pokemon | undefined,
): boolean => {
	return Boolean(pokemon || isLoading || spinningPokemon);
};

export const shouldShowRewardLabels = (
	pokemon: Pokemon | undefined,
	isSlotMachineRunning: boolean,
	previousPokemon: Pokemon | undefined,
): pokemon is Pokemon => {
	return Boolean(
		pokemon && !isSlotMachineRunning && pokemon === previousPokemon,
	);
};
