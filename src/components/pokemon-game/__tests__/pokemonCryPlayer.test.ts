import { afterEach, beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { clearPokemonCryCache, playPokemonCry } from "../pokemonCryPlayer";
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
	cryUrl: "https://example.com/cry.mp3",
};

class MockAudio {
	public src = "";
	public preload = "auto";
	public pause = vi.fn();
	public play = vi.fn().mockResolvedValue(undefined);
	public addEventListener = vi.fn();
	public removeEventListener = vi.fn();
	public currentTime = 0;

	public set oncanplaythrough(handler: (() => void) | null) {
		if (handler) {
			handler();
		}
	}
}

const isHtmlAudioElement = (value: unknown): value is HTMLAudioElement => {
	return (
		typeof value === "object" &&
		value !== null &&
		"play" in value &&
		typeof value.play === "function"
	);
};

describe("playPokemonCry", () => {
	beforeEach(() => {
		vi.stubGlobal("Audio", MockAudio);
	});

	afterEach(() => {
		clearPokemonCryCache();
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("does nothing when muted", async () => {
		const audioRef = { current: null };
		const soundPlayedRef = { current: false };
		const currentPokemonIdRef = { current: 25 };

		await playPokemonCry({
			pokemon: basePokemon,
			isMuted: true,
			currentPokemonIdRef,
			audioRef,
			soundPlayedRef,
		});

		expect(soundPlayedRef.current).toBe(false);
		expect(audioRef.current).toBeNull();
	});

	it("plays cry when not muted and pokemon matches", async () => {
		const audioRef = { current: null };
		const soundPlayedRef = { current: false };
		const currentPokemonIdRef = { current: 25 };

		await playPokemonCry({
			pokemon: basePokemon,
			isMuted: false,
			currentPokemonIdRef,
			audioRef,
			soundPlayedRef,
		});

		expect(soundPlayedRef.current).toBe(true);
		expect(isHtmlAudioElement(audioRef.current)).toBe(true);
	});

	it("does not play when pokemon id changed during load", async () => {
		const audioRef = { current: null };
		const soundPlayedRef = { current: false };
		const currentPokemonIdRef = { current: 26 };

		await playPokemonCry({
			pokemon: basePokemon,
			isMuted: false,
			currentPokemonIdRef,
			audioRef,
			soundPlayedRef,
		});

		expect(soundPlayedRef.current).toBe(false);
	});
});

describe("clearPokemonCryCache", () => {
	it("clears cached audio elements without throwing", () => {
		vi.stubGlobal("Audio", MockAudio);

		expect(() => clearPokemonCryCache()).not.toThrow();

		vi.unstubAllGlobals();
	});
});
