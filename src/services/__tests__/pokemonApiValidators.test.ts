import { describe, expect, it } from "vitest";
import {
	isPokemonCries,
	isPokemonSpecies,
	isTyradexPokemon,
	parseTyradexPokemon,
	parseTyradexPokemonList,
} from "../pokemonApiValidators";

const validTyradexPokemon = {
	pokedex_id: 25,
	name: { fr: "Pikachu", en: "Pikachu" },
	sprites: {
		regular: "https://example.com/regular.png",
		shiny: "https://example.com/shiny.png",
		gmax: null,
	},
};

describe("isTyradexPokemon", () => {
	it("accepts a valid pokemon payload", () => {
		expect(isTyradexPokemon(validTyradexPokemon)).toBe(true);
	});

	it("rejects invalid payloads", () => {
		expect(isTyradexPokemon(null)).toBe(false);
		expect(isTyradexPokemon({ ...validTyradexPokemon, pokedex_id: "25" })).toBe(
			false,
		);
		expect(
			isTyradexPokemon({
				...validTyradexPokemon,
				sprites: { regular: 123 },
			}),
		).toBe(false);
	});
});

describe("parseTyradexPokemonList", () => {
	it("parses a valid list", () => {
		expect(parseTyradexPokemonList([validTyradexPokemon])).toEqual([
			validTyradexPokemon,
		]);
	});

	it("throws for invalid list payloads", () => {
		expect(() => parseTyradexPokemonList({})).toThrow(
			"Invalid Tyradex response: expected an array",
		);
		expect(() => parseTyradexPokemonList([{ invalid: true }])).toThrow(
			"Invalid Tyradex pokemon entry in list response",
		);
	});
});

describe("parseTyradexPokemon", () => {
	it("parses a valid pokemon", () => {
		expect(parseTyradexPokemon(validTyradexPokemon)).toEqual(validTyradexPokemon);
	});

	it("throws for invalid pokemon payloads", () => {
		expect(() => parseTyradexPokemon(null)).toThrow(
			"Invalid Tyradex pokemon response",
		);
	});
});

describe("pokeapi validators", () => {
	it("validates cries and species payloads", () => {
		expect(
			isPokemonCries({ latest: "https://a", legacy: "https://b" }),
		).toBe(true);
		expect(
			isPokemonSpecies({
				flavor_text_entries: [
					{
						flavor_text: "Test",
						language: { name: "fr" },
						version: { name: "red" },
					},
				],
			}),
		).toBe(true);
	});
});
