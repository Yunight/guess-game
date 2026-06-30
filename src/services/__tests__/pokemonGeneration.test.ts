import { describe, expect, it } from "vitest";
import type { Pokemon } from "@/components/pokemon-game/types";
import {
	filterPokemonByGeneration,
	getPokemonNamesCacheKey,
} from "../pokemonGeneration";

const pokemonList: Pokemon[] = [
	{ id: 1, frenchName: "A", englishName: "A" },
	{ id: 151, frenchName: "B", englishName: "B" },
	{ id: 152, frenchName: "C", englishName: "C" },
];

describe("filterPokemonByGeneration", () => {
	it("keeps pokemon within the generation range", () => {
		expect(filterPokemonByGeneration(pokemonList, 1, 151)).toEqual([
			pokemonList[0],
			pokemonList[1],
		]);
	});
});

describe("getPokemonNamesCacheKey", () => {
	it("builds a stable cache key", () => {
		expect(
			getPokemonNamesCacheKey({ startId: 1, endId: 151, maxHypeChain: 2 }),
		).toBe("1_151_2");
	});
});
