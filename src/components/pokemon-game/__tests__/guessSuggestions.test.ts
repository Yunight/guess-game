import { describe, expect, it } from "vitest";
import type { Pokemon } from "../types";
import { buildGuessSuggestions } from "../guessSuggestions";

const pokemonList: Pokemon[] = [
	{
		id: 1,
		name: "bulbasaur",
		frenchName: "Bulbizarre",
		englishName: "Bulbasaur",
		frenchFlavorText: "",
		englishFlavorText: "",
		isShiny: false,
		isMythical: false,
		isLegendary: false,
		evolutionStage: 1,
		hasEvolution: true,
		evolvesFromSpecies: null,
		sprites: { front_default: "", front_shiny: "" },
		cryUrl: "",
	},
	{
		id: 2,
		name: "ivysaur",
		frenchName: "Herbizarre",
		englishName: "Ivysaur",
		frenchFlavorText: "",
		englishFlavorText: "",
		isShiny: false,
		isMythical: false,
		isLegendary: false,
		evolutionStage: 2,
		hasEvolution: true,
		evolvesFromSpecies: "bulbasaur",
		sprites: { front_default: "", front_shiny: "" },
		cryUrl: "",
	},
	{
		id: 3,
		name: "venusaur",
		frenchName: "Florizarre",
		englishName: "Venusaur",
		frenchFlavorText: "",
		englishFlavorText: "",
		isShiny: false,
		isMythical: false,
		isLegendary: false,
		evolutionStage: 3,
		hasEvolution: false,
		evolvesFromSpecies: "ivysaur",
		sprites: { front_default: "", front_shiny: "" },
		cryUrl: "",
	},
	{
		id: 152,
		name: "chikorita",
		frenchName: "Germignon",
		englishName: "Chikorita",
		frenchFlavorText: "",
		englishFlavorText: "",
		isShiny: false,
		isMythical: false,
		isLegendary: false,
		evolutionStage: 1,
		hasEvolution: true,
		evolvesFromSpecies: null,
		sprites: { front_default: "", front_shiny: "" },
		cryUrl: "",
	},
	{
		id: 10,
		name: "caterpie",
		frenchName: "Chenipan",
		englishName: "Caterpie",
		frenchFlavorText: "",
		englishFlavorText: "",
		isShiny: false,
		isMythical: false,
		isLegendary: false,
		evolutionStage: 1,
		hasEvolution: true,
		evolvesFromSpecies: null,
		sprites: { front_default: "", front_shiny: "" },
		cryUrl: "",
	},
	{
		id: 11,
		name: "metapod",
		frenchName: "Chrysacier",
		englishName: "Metapod",
		frenchFlavorText: "",
		englishFlavorText: "",
		isShiny: false,
		isMythical: false,
		isLegendary: false,
		evolutionStage: 2,
		hasEvolution: true,
		evolvesFromSpecies: "caterpie",
		sprites: { front_default: "", front_shiny: "" },
		cryUrl: "",
	},
	{
		id: 12,
		name: "butterfree",
		frenchName: "Papilusion",
		englishName: "Butterfree",
		frenchFlavorText: "",
		englishFlavorText: "",
		isShiny: false,
		isMythical: false,
		isLegendary: false,
		evolutionStage: 3,
		hasEvolution: false,
		evolvesFromSpecies: "metapod",
		sprites: { front_default: "", front_shiny: "" },
		cryUrl: "",
	},
];

const normalizeName = (name: string): string => name.toLowerCase();

describe("buildGuessSuggestions", () => {
	it("returns empty suggestions for empty input", () => {
		expect(
			buildGuessSuggestions({
				value: "",
				pokemonList,
				startId: 1,
				endId: 151,
				language: "en",
				normalizeName,
			}),
		).toEqual([]);
	});

	it("filters by generation and prefers prefix matches", () => {
		expect(
			buildGuessSuggestions({
				value: "bul",
				pokemonList,
				startId: 1,
				endId: 151,
				language: "en",
				normalizeName,
			}),
		).toEqual(["Bulbasaur"]);
	});

	it("returns french names when language is fr", () => {
		expect(
			buildGuessSuggestions({
				value: "herb",
				pokemonList,
				startId: 1,
				endId: 151,
				language: "fr",
				normalizeName,
			}),
		).toEqual(["Herbizarre"]);
	});

	it("excludes pokemon outside the selected generation", () => {
		expect(
			buildGuessSuggestions({
				value: "germ",
				pokemonList,
				startId: 1,
				endId: 151,
				language: "en",
				normalizeName,
			}),
		).toEqual([]);
	});

	it("skips pokemon missing localized names", () => {
		expect(
			buildGuessSuggestions({
				value: "missing",
				pokemonList: [
					{
						...pokemonList[0],
						frenchName: "",
						englishName: "",
					},
				],
				startId: 1,
				endId: 151,
				language: "en",
				normalizeName,
			}),
		).toEqual([]);
	});

	it("supports substring matches that are not prefixes", () => {
		expect(
			buildGuessSuggestions({
				value: "saur",
				pokemonList,
				startId: 1,
				endId: 151,
				language: "en",
				normalizeName,
			}),
		).toEqual(["Bulbasaur", "Ivysaur", "Venusaur"]);
	});

	it("ranks prefix matches ahead of substring matches", () => {
		expect(
			buildGuessSuggestions({
				value: "free",
				pokemonList,
				startId: 1,
				endId: 151,
				language: "en",
				normalizeName,
			}),
		).toEqual(["Butterfree"]);
	});

	it("ranks exact matches ahead of partial matches", () => {
		expect(
			buildGuessSuggestions({
				value: "metapod",
				pokemonList,
				startId: 1,
				endId: 151,
				language: "en",
				normalizeName,
			}),
		).toEqual(["Metapod"]);
	});

	it("limits suggestions to five results", () => {
		const manyMatches = Array.from({ length: 8 }, (_, index) => ({
			...pokemonList[0],
			id: index + 1,
			englishName: `Matchmon${index}`,
			frenchName: `Matchmon${index}`,
		}));

		expect(
			buildGuessSuggestions({
				value: "match",
				pokemonList: manyMatches,
				startId: 1,
				endId: 151,
				language: "en",
				normalizeName,
			}),
		).toHaveLength(5);
	});
});
