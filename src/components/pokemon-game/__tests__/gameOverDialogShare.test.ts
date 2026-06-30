import { describe, expect, it } from "vitest";
import type { Pokemon } from "../types";
import { buildShareText, getShareUrl } from "../gameOverDialogShare";

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
