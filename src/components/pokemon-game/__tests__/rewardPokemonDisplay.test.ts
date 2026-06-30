import { describe, expect, it } from "vitest";
import {
	getLegendaryBadgeLabel,
	getLocalizedPokemonName,
	getMythicalBadgeLabel,
	getShinyBadgeLabel,
	getYouAreLabel,
} from "../pokemonLabelText";
import {
	isPokemonInGeneration,
	resolveRewardCurrentPokemon,
	shouldShowRewardDisplay,
	shouldShowRewardLabels,
} from "../rewardPokemonDisplayLogic";
import {
	getRewardLocalizedName,
	getRewardSpriteContainerClassName,
	getRewardSpriteStyle,
} from "../rewardPokemonSpriteStyles";
import type { Pokemon } from "../types";

const basePokemon: Pokemon = {
	id: 25,
	name: "pikachu",
	englishName: "Pikachu",
	frenchName: "Pikachu FR",
	frenchFlavorText: "",
	englishFlavorText: "",
	isShiny: false,
	isMythical: false,
	isLegendary: false,
	evolutionStage: 1,
	hasEvolution: true,
	evolvesFromSpecies: "pichu",
	sprites: { front_default: "sprite.png", front_shiny: "" },
	cryUrl: "",
};

describe("staticPokemonDisplay helpers", () => {
	it("returns localized names", () => {
		expect(getLocalizedPokemonName(basePokemon, "fr")).toBe("Pikachu FR");
		expect(getLocalizedPokemonName(basePokemon, "en")).toBe("Pikachu");
	});

	it("returns localized labels", () => {
		expect(getYouAreLabel("fr")).toBe("Tu es ");
		expect(getShinyBadgeLabel("en")).toBe("Shiny ✨");
		expect(getLegendaryBadgeLabel("fr")).toBe("Légendaire");
		expect(getMythicalBadgeLabel("en")).toBe("Mythical");
	});
});

describe("rewardPokemonDisplay helpers", () => {
	it("checks generation range", () => {
		expect(isPokemonInGeneration(basePokemon, { startId: 1, endId: 151 })).toBe(
			true,
		);
		expect(isPokemonInGeneration(basePokemon, { startId: 152, endId: 251 })).toBe(
			false,
		);
	});

	it("resolves current pokemon during slot machine", () => {
		const spinning = { ...basePokemon, id: 1 };
		expect(
			resolveRewardCurrentPokemon(true, spinning, basePokemon),
		).toEqual(spinning);
		expect(resolveRewardCurrentPokemon(false, spinning, basePokemon)).toEqual(
			basePokemon,
		);
	});

	it("determines when to show reward display", () => {
		expect(shouldShowRewardDisplay(undefined, false, undefined)).toBe(false);
		expect(shouldShowRewardDisplay(basePokemon, false, undefined)).toBe(true);
		expect(shouldShowRewardDisplay(undefined, true, undefined)).toBe(true);
	});

	it("determines when to show labels", () => {
		expect(shouldShowRewardLabels(basePokemon, true, basePokemon)).toBe(false);
		expect(shouldShowRewardLabels(basePokemon, false, basePokemon)).toBe(true);
	});
});

describe("rewardPokemonSprite helpers", () => {
	it("returns localized name", () => {
		expect(getRewardLocalizedName(basePokemon, "fr")).toBe("Pikachu FR");
	});

	it("returns slot machine style when running", () => {
		expect(getRewardSpriteStyle(true, false)).toEqual({
			transform: "translateY(-100%)",
			animation: "slideUp 0.03s linear infinite",
			opacity: 1,
			transition: "none",
			scale: "1.3",
		});
	});

	it("hides opacity before reveal", () => {
		expect(getRewardSpriteStyle(false, false).opacity).toBe(0);
	});

	it("includes slide-up class when slot machine is running", () => {
		expect(getRewardSpriteContainerClassName(true)).toContain("animate-slide-up");
	});
});
