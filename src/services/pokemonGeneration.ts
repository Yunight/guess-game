import type { Pokemon } from "@/components/pokemon-game/types";

export const filterPokemonByGeneration = (
	pokemonList: readonly Pokemon[],
	startId: number,
	endId: number,
): Pokemon[] => pokemonList.filter((pokemon) => pokemon.id >= startId && pokemon.id <= endId);

export interface PokemonNamesQueryArg {
	startId: number;
	endId: number;
	maxHypeChain?: number;
}

export const getPokemonNamesCacheKey = (arg: PokemonNamesQueryArg): string =>
	`${arg.startId}_${arg.endId}_${arg.maxHypeChain ?? 0}`;
