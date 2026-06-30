import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import type { Pokemon } from "../types";
import {
	buildShareText,
	copyTextToClipboard,
	getShareUrl,
	shareGameResult,
} from "../gameOverDialogShare";

const t = (key: string, options?: Record<string, string | number>): string => {
	if (options) {
		return `${key}:${JSON.stringify(options)}`;
	}
	return key;
};

const basePokemon: Pokemon = {
	id: 150,
	name: "mewtwo",
	englishName: "mewtwo",
	frenchName: "mewtwo",
	frenchFlavorText: "",
	englishFlavorText: "",
	isShiny: false,
	isMythical: false,
	isLegendary: true,
	evolutionStage: 1,
	hasEvolution: false,
	evolvesFromSpecies: null,
	sprites: { front_default: "", front_shiny: "" },
	cryUrl: "",
};

const baseShareParams = {
	playerName: "Ash",
	score: 500,
	totalTimeElapsed: 125,
	userRanking: null as number | null,
	remainingPokemon: [1, 2] as readonly number[],
	maxHypeChain: 0,
	criticalHitCount: 0,
	criticalSuccessCount: 0,
	hyperTrainCount: 0,
	rewardPokemon: undefined as Pokemon | undefined,
	selectedGeneration: { name: "Generation 1" },
	shareableUrl: null as string | null,
	language: "en",
	t,
	formatTimeForRanking: (seconds: number): string => `${seconds}s`,
};

describe("getShareUrl", () => {
	it("returns shareable url when provided", () => {
		expect(getShareUrl("https://guess.example/results/abc")).toBe(
			"https://guess.example/results/abc",
		);
	});

	it("returns default url when shareable url is null", () => {
		expect(getShareUrl(null)).toBe(
			"https://pokemon-guesser-game.vercel.app/",
		);
	});
});

describe("buildShareText", () => {
	it("includes player name, score, time, and generation", () => {
		const result = buildShareText(baseShareParams);

		expect(result).toContain("Ash");
		expect(result).toContain("score: 500");
		expect(result).toContain("time: 125s");
		expect(result).toContain("Generation 1");
		expect(result).toContain("https://pokemon-guesser-game.vercel.app/");
		expect(result).toContain("#PokemonGuesserGame");
	});

	it("includes ranking when user ranking is set", () => {
		const result = buildShareText({
			...baseShareParams,
			userRanking: 3,
		});

		expect(result).toContain("myRank # 3!");
	});

	it("includes reward pokemon line in english", () => {
		const result = buildShareText({
			...baseShareParams,
			rewardPokemon: { ...basePokemon, englishName: "pikachu" },
		});

		expect(result).toContain("I am Pikachu");
	});

	it("includes reward pokemon line in french", () => {
		const result = buildShareText({
			...baseShareParams,
			language: "fr",
			rewardPokemon: { ...basePokemon, frenchName: "pikachu" },
		});

		expect(result).toContain("Je suis un Pikachu");
	});

	it("uses shareable url with view result label when provided", () => {
		const shareableUrl = "https://guess.example/results/xyz";
		const result = buildShareText({
			...baseShareParams,
			shareableUrl,
		});

		expect(result).toContain(`viewMyResult ${shareableUrl}`);
	});

	it("uses clickbait message from score threshold", () => {
		const result = buildShareText({
			...baseShareParams,
			score: 2500,
		});

		expect(result).toContain('shareMsg2500:{"gen":"Generation 1"}');
	});
});

describe("copyTextToClipboard", () => {
	beforeEach(() => {
		Object.defineProperty(navigator, "clipboard", {
			value: { writeText: vi.fn() },
			configurable: true,
		});
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns true when clipboard write succeeds", async () => {
		vi.mocked(navigator.clipboard.writeText).mockResolvedValue();

		const result = await copyTextToClipboard("https://example.com");

		expect(result).toBe(true);
	});

	it("falls back to execCommand when clipboard API fails", async () => {
		vi.mocked(navigator.clipboard.writeText).mockRejectedValue(
			new Error("denied"),
		);
		document.execCommand = vi.fn().mockReturnValue(true);

		const result = await copyTextToClipboard("https://example.com");

		expect(result).toBe(true);
		expect(document.execCommand).toHaveBeenCalledWith("copy");
	});
});

describe("shareGameResult", () => {
	const originalShare = navigator.share;
	const originalOpen = window.open;

	beforeEach(() => {
		window.open = vi.fn();
	});

	afterEach(() => {
		Object.defineProperty(navigator, "share", {
			value: originalShare,
			configurable: true,
		});
		window.open = originalOpen;
		vi.restoreAllMocks();
	});

	it("uses navigator.share when available", async () => {
		const share = vi.fn().mockResolvedValue(undefined);
		Object.defineProperty(navigator, "share", {
			value: share,
			configurable: true,
		});

		await shareGameResult("text", "https://example.com");

		expect(share).toHaveBeenCalledWith({
			text: "text",
			url: "https://example.com",
		});
	});

	it("opens twitter share when navigator.share is unavailable", async () => {
		Object.defineProperty(navigator, "share", {
			value: undefined,
			configurable: true,
		});

		await shareGameResult("hello", "https://example.com");

		expect(window.open).toHaveBeenCalled();
	});
});
