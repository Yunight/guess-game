import { describe, expect, it } from "vite-plus/test";
import {
	computeNextDisplayState,
	computePokemonDisplayTransition,
	getLocalizedPokemonName,
	getShinyLabel,
	shouldClearAudioOnTransition,
	shouldResetSoundOnPokemonChange,
	shouldResetToLoading,
	shouldUpdateRevealedPokemon,
} from "../pokemonDisplayState";
import type { Pokemon } from "../types";

const basePokemon: Pokemon = {
	id: 25,
	name: "pikachu",
	englishName: "Pikachu",
	frenchName: "Pikachu",
	frenchFlavorText: "",
	englishFlavorText: "",
	isShiny: false,
	isMythical: false,
	isLegendary: false,
	evolutionStage: 1,
	hasEvolution: true,
	evolvesFromSpecies: "pichu",
	sprites: { front_default: "sprite.png", front_shiny: "" },
	cryUrl: "cry.mp3",
};

describe("shouldClearAudioOnTransition", () => {
	it("returns true when loading", () => {
		expect(shouldClearAudioOnTransition(true, 25, 25)).toBe(true);
	});

	it("returns true when pokemon id changes", () => {
		expect(shouldClearAudioOnTransition(false, 26, 25)).toBe(true);
	});

	it("returns false when same pokemon and not loading", () => {
		expect(shouldClearAudioOnTransition(false, 25, 25)).toBe(false);
	});
});

describe("shouldResetToLoading", () => {
	it("returns true when new pokemon differs from both current and displayed", () => {
		expect(shouldResetToLoading(26, 25, 25)).toBe(true);
	});

	it("returns false when new pokemon matches displayed", () => {
		expect(shouldResetToLoading(25, 24, 25)).toBe(false);
	});
});

describe("computeNextDisplayState", () => {
	it("returns revealed when correct", () => {
		expect(computeNextDisplayState(true, 10)).toBe("revealed");
	});

	it("returns revealed when time is up", () => {
		expect(computeNextDisplayState(null, 0)).toBe("revealed");
	});

	it("returns ready otherwise", () => {
		expect(computeNextDisplayState(null, 10)).toBe("ready");
	});
});

describe("shouldUpdateRevealedPokemon", () => {
	it("returns true for revealed state with matching ids", () => {
		expect(shouldUpdateRevealedPokemon("revealed", 25, 25)).toBe(true);
	});

	it("returns false for ready state", () => {
		expect(shouldUpdateRevealedPokemon("ready", 25, 25)).toBe(false);
	});
});

describe("shouldResetSoundOnPokemonChange", () => {
	it("returns true when pokemon id changes", () => {
		expect(shouldResetSoundOnPokemonChange(26, 25)).toBe(true);
	});

	it("returns false when pokemon id is the same", () => {
		expect(shouldResetSoundOnPokemonChange(25, 25)).toBe(false);
	});
});

describe("computePokemonDisplayTransition", () => {
	it("resets to loading when pokemon changes during load", () => {
		const result = computePokemonDisplayTransition({
			currentPokemon: { ...basePokemon, id: 26 },
			isPokemonLoading: true,
			isCorrect: null,
			guessTimeLeft: 10,
			displayState: "ready",
			displayedPokemon: basePokemon,
			currentPokemonId: 25,
		});

		expect(result.displayState).toBe("loading");
		expect(result.displayedPokemon).toBeUndefined();
		expect(result.shouldClearAudio).toBe(true);
		expect(result.shouldResetSoundPlayed).toBe(true);
		expect(result.currentPokemonId).toBe(26);
	});

	it("sets ready state when pokemon is loaded and not revealed", () => {
		const result = computePokemonDisplayTransition({
			currentPokemon: basePokemon,
			isPokemonLoading: false,
			isCorrect: null,
			guessTimeLeft: 10,
			displayState: "loading",
			displayedPokemon: undefined,
			currentPokemonId: 25,
		});

		expect(result.displayState).toBe("ready");
		expect(result.displayedPokemon).toEqual(basePokemon);
	});

	it("updates revealed pokemon data without changing state", () => {
		const updatedPokemon = { ...basePokemon, frenchName: "Pikachu FR" };
		const result = computePokemonDisplayTransition({
			currentPokemon: updatedPokemon,
			isPokemonLoading: false,
			isCorrect: true,
			guessTimeLeft: 5,
			displayState: "revealed",
			displayedPokemon: basePokemon,
			currentPokemonId: 25,
		});

		expect(result.displayState).toBe("revealed");
		expect(result.displayedPokemon).toEqual(updatedPokemon);
	});
});

describe("getLocalizedPokemonName", () => {
	it("returns french name for fr language", () => {
		expect(getLocalizedPokemonName({ ...basePokemon, frenchName: "Pikachu FR" }, "fr")).toBe(
			"Pikachu FR",
		);
	});

	it("returns english name for other languages", () => {
		expect(getLocalizedPokemonName(basePokemon, "en")).toBe("Pikachu");
	});
});

describe("getShinyLabel", () => {
	it("returns french shiny label", () => {
		expect(getShinyLabel("fr")).toBe("✨ CHROMATIQUE");
	});

	it("returns english shiny label", () => {
		expect(getShinyLabel("en")).toBe("✨ SHINY");
	});
});
