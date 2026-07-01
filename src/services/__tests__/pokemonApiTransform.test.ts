import { describe, expect, it } from "vite-plus/test";
import {
	convertTyradexToPokemon,
	extractFlavorTexts,
	formatCryUrl,
	normalizeFlavorText,
	toApiError,
} from "../pokemonApiTransform";

const tyradexPokemon = {
	pokedex_id: 54,
	name: { fr: "Psykokwak", en: "Psyduck" },
	sprites: {
		regular: "https://example.com/psyduck.png",
		shiny: null,
		gmax: null,
	},
};

describe("normalizeFlavorText", () => {
	it("replaces form feed and newline characters", () => {
		expect(normalizeFlavorText("Line1\nLine2\fTab")).toBe("Line1 Line2 Tab");
	});
});

describe("extractFlavorTexts", () => {
	it("extracts french and english flavor text entries", () => {
		const result = extractFlavorTexts([
			{
				flavor_text: "Français",
				language: { name: "fr" },
			},
			{
				flavor_text: "English",
				language: { name: "en" },
			},
		]);

		expect(result).toEqual({ french: "Français", english: "English" });
	});
});

describe("convertTyradexToPokemon", () => {
	it("maps tyradex data to the app pokemon shape", () => {
		const result = convertTyradexToPokemon(tyradexPokemon, {
			random: () => 1,
		});

		expect(result.id).toBe(54);
		expect(result.frenchName).toBe("Psykokwak");
		expect(result.sprites.front_default).toBe(tyradexPokemon.sprites.regular);
		expect(result.isShiny).toBe(false);
	});

	it("respects forced shiny state", () => {
		const result = convertTyradexToPokemon(tyradexPokemon, {
			forcedShinyState: true,
		});

		expect(result.isShiny).toBe(true);
	});
});

describe("formatCryUrl", () => {
	it("joins latest and legacy cry urls", () => {
		expect(
			formatCryUrl({
				latest: "https://latest",
				legacy: "https://legacy",
			}),
		).toBe("https://latest|https://legacy");
	});
});

describe("toApiError", () => {
	it("wraps Error instances", () => {
		expect(toApiError(new Error("boom"))).toEqual({
			status: 500,
			data: "boom",
		});
	});

	it("wraps unknown values", () => {
		expect(toApiError("nope")).toEqual({
			status: 500,
			data: "Unknown error",
		});
	});
});
