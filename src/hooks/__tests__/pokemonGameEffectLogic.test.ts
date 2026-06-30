import type { Pokemon } from "@/components/pokemon-game/types";
import { describe, expect, it } from "vitest";
import {
	shouldApplyHypeTrainBonus,
	shouldRecoverInvalidPokemon,
	shouldResetRewardOnGameClose,
	shouldResetTimersWhenInactive,
	shouldStartGuessTimer,
	shouldStartTotalTimer,
	shouldSyncRewardPokemon,
	shouldTriggerGameOver,
} from "../pokemonGameEffectLogic";

const incompletePokemon: Pokemon = {
	id: 25,
	name: "pikachu",
	englishName: "",
	frenchName: "Pikachu",
	frenchFlavorText: "",
	englishFlavorText: "",
	isShiny: false,
	isMythical: false,
	isLegendary: false,
	evolutionStage: 1,
	hasEvolution: false,
	evolvesFromSpecies: null,
	sprites: { front_default: "", front_shiny: "" },
	cryUrl: "",
};

const completePokemon: Pokemon = {
	...incompletePokemon,
	englishName: "Pikachu",
};

describe("shouldResetTimersWhenInactive", () => {
	it("returns true when inactive with active timers", () => {
		expect(shouldResetTimersWhenInactive(false, 15, 10)).toBe(true);
	});

	it("returns false when inactive with default timers", () => {
		expect(
			shouldResetTimersWhenInactive(false, Number.POSITIVE_INFINITY, 0),
		).toBe(false);
	});
});

describe("shouldStartTotalTimer", () => {
	it("returns true for active game at zero elapsed time", () => {
		expect(shouldStartTotalTimer(true, 0)).toBe(true);
	});
});

describe("shouldStartGuessTimer", () => {
	it("returns true in hard mode with infinite guess time", () => {
		expect(
			shouldStartGuessTimer(true, true, Number.POSITIVE_INFINITY),
		).toBe(true);
	});
});

describe("shouldRecoverInvalidPokemon", () => {
	it("returns true when pokemon data is incomplete", () => {
		expect(
			shouldRecoverInvalidPokemon(true, false, 25, 10, incompletePokemon),
		).toBe(true);
	});

	it("returns false when pokemon data is complete", () => {
		expect(
			shouldRecoverInvalidPokemon(true, false, 25, 10, completePokemon),
		).toBe(false);
	});
});

describe("shouldSyncRewardPokemon", () => {
	it("returns true when game is over and reward data is ready", () => {
		expect(shouldSyncRewardPokemon(true, completePokemon, false)).toBe(true);
	});
});

describe("shouldResetRewardOnGameClose", () => {
	it("returns true when leaving game over with reward", () => {
		expect(shouldResetRewardOnGameClose(false, true)).toBe(true);
	});
});

describe("shouldTriggerGameOver", () => {
	it("returns true when time runs out", () => {
		expect(shouldTriggerGameOver(true, false, 0, 5)).toBe(true);
	});
});

describe("shouldApplyHypeTrainBonus", () => {
	it("returns true when hype train ends", () => {
		expect(shouldApplyHypeTrainBonus(true, true, 5)).toBe(true);
	});
});
