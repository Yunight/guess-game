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
	private _src = "";
	public preload = "auto";
	public pause = vi.fn();
	public play = vi.fn().mockResolvedValue(undefined);
	public currentTime = 0;
	private onCanPlayHandler: (() => void) | null = null;
	private onCanPlayThroughHandler: (() => void) | null = null;
	private onLoadedDataHandler: (() => void) | null = null;
	private onErrorHandler: (() => void) | null = null;

	public get src(): string {
		return this._src;
	}

	public set src(value: string) {
		this._src = value;
		if (!value) {
			return;
		}

		setTimeout(() => {
			if (value.includes("hang")) {
				return;
			}

			if (value.includes("error")) {
				this.onErrorHandler?.();
				return;
			}

			this.onCanPlayHandler?.();
			this.onCanPlayThroughHandler?.();
			this.onLoadedDataHandler?.();
		}, 0);
	}

	public set oncanplay(handler: (() => void) | null) {
		this.onCanPlayHandler = handler;
	}

	public set oncanplaythrough(handler: (() => void) | null) {
		this.onCanPlayThroughHandler = handler;
	}

	public set onloadeddata(handler: (() => void) | null) {
		this.onLoadedDataHandler = handler;
	}

	public set onerror(handler: (() => void) | null) {
		this.onErrorHandler = handler;
	}

	public set onended(handler: (() => void) | null) {
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
		vi.useRealTimers();
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

	it("falls back to showdown cry when cryUrl is empty on non-iOS", async () => {
		const audioRef = { current: null };
		const soundPlayedRef = { current: false };
		const currentPokemonIdRef = { current: 25 };
		const pokemonWithoutCryUrl = { ...basePokemon, cryUrl: "" };

		await expect(
			playPokemonCry({
				pokemon: pokemonWithoutCryUrl,
				isMuted: false,
				currentPokemonIdRef,
				audioRef,
				soundPlayedRef,
			}),
		).resolves.toBeUndefined();
		expect(soundPlayedRef.current).toBe(true);
		expect(isHtmlAudioElement(audioRef.current)).toBe(true);
	});

	it("falls back to next URL when first preload hangs", async () => {
		vi.useFakeTimers();
		const audioRef = { current: null };
		const soundPlayedRef = { current: false };
		const currentPokemonIdRef = { current: 25 };
		const hangingPokemon = {
			...basePokemon,
			cryUrl: "https://example.com/hang.mp3|https://example.com/ok.mp3",
		};

		const playPromise = playPokemonCry({
			pokemon: hangingPokemon,
			isMuted: false,
			currentPokemonIdRef,
			audioRef,
			soundPlayedRef,
		});

		await vi.advanceTimersByTimeAsync(4100);
		await playPromise;

		expect(soundPlayedRef.current).toBe(true);
		expect(isHtmlAudioElement(audioRef.current)).toBe(true);
	});

	it("handles play() rejection without throwing", async () => {
		const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => undefined);
		class RejectingAudio extends MockAudio {
			public play = vi.fn().mockRejectedValue(
				Object.assign(new Error("Autoplay blocked"), { name: "NotAllowedError" }),
			);
		}
		vi.stubGlobal("Audio", RejectingAudio);
		const audioRef = { current: null };
		const soundPlayedRef = { current: false };
		const currentPokemonIdRef = { current: 25 };

		await expect(
			playPokemonCry({
				pokemon: basePokemon,
				isMuted: false,
				currentPokemonIdRef,
				audioRef,
				soundPlayedRef,
			}),
		).resolves.toBeUndefined();

		expect(soundPlayedRef.current).toBe(false);
		expect(warnSpy).toHaveBeenCalled();
	});
});

describe("clearPokemonCryCache", () => {
	it("clears cached audio elements without throwing", () => {
		vi.stubGlobal("Audio", MockAudio);

		expect(() => clearPokemonCryCache()).not.toThrow();

		vi.unstubAllGlobals();
	});
});
