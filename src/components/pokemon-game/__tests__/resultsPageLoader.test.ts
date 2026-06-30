import { describe, expect, it, vi } from "vitest";
import type { GameResult } from "@/services/gameResultsService";
import {
	computeRemainingPokemon,
	computeTotalPokemonInGeneration,
	formatResultsPageTime,
	loadGameResult,
} from "../resultsPageLoader";

const mockGameResult = {
	id: "result-1",
	playerName: "Ash",
	score: 100,
	totalTimeElapsed: 125,
	selectedGeneration: { name: "Generation 1", startId: 1, endId: 151 },
	remainingPokemon: [1, 2, 3],
	userRanking: 5,
	criticalHitCount: 2,
	criticalSuccessCount: 0,
	hyperTrainCount: 0,
	maxHypeChain: 3,
	rewardPokemon: null,
	gameMode: "normal",
	createdAt: { seconds: 0, nanoseconds: 0 },
} satisfies GameResult;

describe("loadGameResult", () => {
	it("returns missingId when resultId is undefined", async () => {
		await expect(
			loadGameResult(undefined, vi.fn()),
		).resolves.toEqual({ status: "missingId" });
	});

	it("returns success when result is found", async () => {
		const getGameResult = vi.fn().mockResolvedValue(mockGameResult);
		await expect(loadGameResult("result-1", getGameResult)).resolves.toEqual({
			status: "success",
			result: mockGameResult,
		});
	});

	it("returns notFound when result is null", async () => {
		const getGameResult = vi.fn().mockResolvedValue(null);
		await expect(loadGameResult("result-1", getGameResult)).resolves.toEqual({
			status: "notFound",
		});
	});

	it("returns error when fetch throws", async () => {
		const getGameResult = vi.fn().mockRejectedValue(new Error("network"));
		await expect(loadGameResult("result-1", getGameResult)).resolves.toEqual({
			status: "error",
		});
	});
});

describe("formatResultsPageTime", () => {
	it("formats seconds as mm:ss", () => {
		expect(formatResultsPageTime(125)).toBe("2:05");
	});

	it("pads single digit seconds", () => {
		expect(formatResultsPageTime(61)).toBe("1:01");
	});
});

describe("computeRemainingPokemon", () => {
	it("uses debug value when set", () => {
		expect(computeRemainingPokemon(10, 50)).toBe(10);
	});

	it("uses remaining pokemon length when debug is null", () => {
		expect(computeRemainingPokemon(null, 50)).toBe(50);
	});
});

describe("computeTotalPokemonInGeneration", () => {
	it("computes inclusive range count", () => {
		expect(computeTotalPokemonInGeneration(1, 151)).toBe(151);
	});
});
