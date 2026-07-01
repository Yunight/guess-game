import { describe, expect, it } from "vite-plus/test";
import type { Pokemon } from "../types";
import {
	formatGameOverTime,
	getClickbaitMessage,
	getGenerationName,
	getLocalizedPokemonName,
	getShinyLabel,
} from "../gameOverDialogMessages";

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

const baseClickbaitParams = {
	score: 10,
	remainingPokemon: [1, 2],
	userRanking: null as number | null,
	maxHypeChain: 0,
	criticalHitCount: 0,
	criticalSuccessCount: 0,
	hyperTrainCount: 0,
	rewardPokemon: undefined as Pokemon | undefined,
	selectedGeneration: { name: "Generation 1" },
	language: "en",
	t,
};

describe("getGenerationName", () => {
	it("returns english generation label", () => {
		expect(getGenerationName({ name: "Generation 3" }, "en")).toBe("Generation 3");
	});

	it("returns french generation label", () => {
		expect(getGenerationName({ name: "Generation 3" }, "fr")).toBe("3ère Génération");
	});

	it("defaults to generation 1 when no number is present", () => {
		expect(getGenerationName({ name: "Unknown" }, "en")).toBe("Generation 1");
	});
});

describe("formatGameOverTime", () => {
	it("formats seconds as mm:ss", () => {
		expect(formatGameOverTime(125)).toBe("2:05");
	});

	it("returns 0:00 for invalid values", () => {
		expect(formatGameOverTime(Number.NaN)).toBe("0:00");
		expect(formatGameOverTime("invalid" as unknown as number)).toBe("0:00");
	});
});

describe("getLocalizedPokemonName", () => {
	it("returns empty string when pokemon is undefined", () => {
		expect(getLocalizedPokemonName(undefined, "en")).toBe("");
	});

	it("returns capitalized english name", () => {
		expect(getLocalizedPokemonName({ ...basePokemon, englishName: "pikachu" }, "en")).toBe(
			"Pikachu",
		);
	});

	it("returns capitalized french name", () => {
		expect(getLocalizedPokemonName({ ...basePokemon, frenchName: "pikachu" }, "fr")).toBe(
			"Pikachu",
		);
	});
});

describe("getShinyLabel", () => {
	it("returns empty string for non-shiny pokemon", () => {
		expect(getShinyLabel(basePokemon, "en")).toBe("");
	});

	it("returns english shiny label", () => {
		expect(getShinyLabel({ ...basePokemon, isShiny: true }, "en")).toBe("✨ SHINY ✨");
	});

	it("returns french shiny label", () => {
		expect(getShinyLabel({ ...basePokemon, isShiny: true }, "fr")).toBe("✨ CHROMATIQUE ✨");
	});
});

describe("getClickbaitMessage", () => {
	it("returns all pokemon message when none remain", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				remainingPokemon: [],
			}),
		).toBe('shareMsgAllPokemon:{"gen":"Generation 1"}');
	});

	it("returns score threshold message for high scores", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				score: 2500,
			}),
		).toBe('shareMsg2500:{"gen":"Generation 1"}');
	});

	it("returns score threshold message for mid scores", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				score: 500,
			}),
		).toBe('shareMsg500:{"gen":"Generation 1"}');
	});

	it("returns champion message for rank 1", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				score: 10,
				userRanking: 1,
			}),
		).toBe('shareMsgChampion:{"gen":"Generation 1"}');
	});

	it("returns top 3 message for rank 2", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				score: 10,
				userRanking: 2,
			}),
		).toBe('shareMsgTop3:{"gen":"Generation 1"}');
	});

	it("returns top 10 message for rank 8", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				score: 10,
				userRanking: 8,
			}),
		).toBe('shareMsgTop10:{"gen":"Generation 1"}');
	});

	it("returns hype legend message for long chains", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				maxHypeChain: 12,
			}),
		).toBe('shareMsgHypeLegend:{"gen":"Generation 1","count":12}');
	});

	it("returns hype message for medium chains", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				maxHypeChain: 6,
			}),
		).toBe('shareMsgHype:{"gen":"Generation 1","count":6}');
	});

	it("returns critical hit message", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				criticalHitCount: 3,
			}),
		).toBe('shareMsgCriticalHit:{"gen":"Generation 1"}');
	});

	it("returns critical success message", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				criticalSuccessCount: 2,
			}),
		).toBe('shareMsgCriticalSuccess:{"gen":"Generation 1"}');
	});

	it("returns hype train message", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				hyperTrainCount: 3,
			}),
		).toBe('shareMsgHypeTrain:{"gen":"Generation 1"}');
	});

	it("returns legendary message", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				rewardPokemon: { ...basePokemon, isLegendary: true, frenchName: "mew" },
			}),
		).toBe('shareMsgLegendary:{"gen":"Generation 1","pokemon":"mew"}');
	});

	it("returns mythical message", () => {
		expect(
			getClickbaitMessage({
				...baseClickbaitParams,
				rewardPokemon: {
					...basePokemon,
					isLegendary: false,
					isMythical: true,
					frenchName: "mew",
				},
			}),
		).toBe('shareMsgMythical:{"gen":"Generation 1","pokemon":"mew"}');
	});

	it("returns default message when no special conditions match", () => {
		expect(getClickbaitMessage(baseClickbaitParams)).toBe('shareMsgDefault:{"gen":"Generation 1"}');
	});
});
