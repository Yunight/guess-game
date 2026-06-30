import { beforeEach, describe, expect, it, vi, afterEach } from "vitest";
import type { Pokemon } from "../types";
import {
	createGameSessionId,
	persistGameResult,
	runGameResultSave,
	shouldAbortSaveAfterDelay,
	shouldProceedWithGameSave,
	shouldScheduleGameSave,
	shouldInitializeGameSessionId,
	shouldResetGameOverSaveState,
	shouldUpdateFinalTime,
	type GameSaveContext,
} from "../gameOverDialogSave";
const mockSaveGameResult = vi.fn();
const mockGenerateShareableUrl = vi.fn();

vi.mock("../../../services/gameResultsService", () => ({
	gameResultsService: {
		saveGameResult: (...args: unknown[]): Promise<string> =>
			mockSaveGameResult(...args),
		generateShareableUrl: (...args: unknown[]): string =>
			mockGenerateShareableUrl(...args),
	},
}));

const rewardPokemon: Pokemon = {
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
	sprites: { front_default: "", front_shiny: "" },
	cryUrl: "",
};

const readyContext: GameSaveContext = {
	gameOver: true,
	shareableUrl: null,
	isSavingResult: false,
	rewardPokemon: { pokemon: rewardPokemon, isLoading: false },
	isSlotMachineRunning: false,
	gameSessionId: "game_123",
	finalTime: 120,
	totalTimeElapsed: 150,
};

describe("createGameSessionId", () => {
	it("creates a unique game session id", () => {
		const id = createGameSessionId();
		expect(id.startsWith("game_")).toBe(true);
		expect(id.split("_").length).toBeGreaterThanOrEqual(3);
	});
});

describe("shouldInitializeGameSessionId", () => {
	it("returns true when game over without session state", () => {
		expect(shouldInitializeGameSessionId(true, null, null, false)).toBe(true);
	});

	it("returns false when session already exists", () => {
		expect(shouldInitializeGameSessionId(true, "game_1", null, false)).toBe(
			false,
		);
	});
});

describe("shouldResetGameOverSaveState", () => {
	it("returns true when game is not over", () => {
		expect(shouldResetGameOverSaveState(false)).toBe(true);
	});

	it("returns false when game is over", () => {
		expect(shouldResetGameOverSaveState(true)).toBe(false);
	});
});

describe("shouldUpdateFinalTime", () => {
	it("returns true when game over with elapsed time", () => {
		expect(shouldUpdateFinalTime(true, 120)).toBe(true);
	});

	it("returns false when time is zero", () => {
		expect(shouldUpdateFinalTime(true, 0)).toBe(false);
	});
});

describe("shouldScheduleGameSave", () => {
	it("returns true when all save prerequisites are met", () => {
		expect(shouldScheduleGameSave(readyContext)).toBe(true);
	});

	it("returns false when game is not over", () => {
		expect(shouldScheduleGameSave({ ...readyContext, gameOver: false })).toBe(
			false,
		);
	});

	it("returns false when shareable url already exists", () => {
		expect(
			shouldScheduleGameSave({
				...readyContext,
				shareableUrl: "https://example.com/results/abc",
			}),
		).toBe(false);
	});

	it("returns false when reward pokemon is loading", () => {
		expect(
			shouldScheduleGameSave({
				...readyContext,
				rewardPokemon: { pokemon: rewardPokemon, isLoading: true },
			}),
		).toBe(false);
	});

	it("returns false when slot machine is running", () => {
		expect(
			shouldScheduleGameSave({
				...readyContext,
				isSlotMachineRunning: true,
			}),
		).toBe(false);
	});
});

describe("shouldProceedWithGameSave", () => {
	it("returns true when timing data is available", () => {
		expect(shouldProceedWithGameSave(readyContext)).toBe(true);
	});

	it("returns true when only total time elapsed is available", () => {
		expect(
			shouldProceedWithGameSave({
				...readyContext,
				finalTime: 0,
				totalTimeElapsed: 90,
			}),
		).toBe(true);
	});

	it("returns false when no timing data is available", () => {
		expect(
			shouldProceedWithGameSave({
				...readyContext,
				finalTime: 0,
				totalTimeElapsed: 0,
			}),
		).toBe(false);
	});
});

describe("shouldAbortSaveAfterDelay", () => {
	it("returns true when reward pokemon is missing", () => {
		expect(
			shouldAbortSaveAfterDelay(
				{ pokemon: undefined, isLoading: false },
				false,
			),
		).toBe(true);
	});

	it("returns true when reward pokemon is still loading", () => {
		expect(
			shouldAbortSaveAfterDelay(
				{ pokemon: rewardPokemon, isLoading: true },
				false,
			),
		).toBe(true);
	});

	it("returns true when slot machine is running", () => {
		expect(
			shouldAbortSaveAfterDelay(
				{ pokemon: rewardPokemon, isLoading: false },
				true,
			),
		).toBe(true);
	});

	it("returns false when save can proceed", () => {
		expect(
			shouldAbortSaveAfterDelay(
				{ pokemon: rewardPokemon, isLoading: false },
				false,
			),
		).toBe(false);
	});
});

describe("persistGameResult", () => {
	beforeEach(() => {
		mockSaveGameResult.mockReset();
		mockGenerateShareableUrl.mockReset();
		mockSaveGameResult.mockResolvedValue("result-id");
		mockGenerateShareableUrl.mockReturnValue(
			"https://example.com/results/result-id?t=123",
		);
	});

	it("persists game result and returns shareable url", async () => {
		const url = await persistGameResult({
			playerName: "Ash",
			score: 500,
			finalTime: 0,
			totalTimeElapsed: 120,
			userRanking: 3,
			selectedGeneration: { name: "gen1", startId: 1, endId: 151 },
			rewardPokemon,
			remainingPokemon: [1, 2],
			criticalHitCount: 1,
			criticalSuccessCount: 2,
			hyperTrainCount: 3,
			maxHypeChain: 4,
			gameSessionId: "game_123",
		});

		expect(mockSaveGameResult).toHaveBeenCalledWith(
			expect.objectContaining({
				playerName: "Ash",
				score: 500,
				totalTimeElapsed: 120,
				gameMode: "gen1_game_123",
			}),
		);
		expect(mockGenerateShareableUrl).toHaveBeenCalledWith("result-id");
		expect(url).toBe("https://example.com/results/result-id?t=123");
	});

	it("uses final time when it is greater than zero", async () => {
		await persistGameResult({
			playerName: "Ash",
			score: 500,
			finalTime: 90,
			totalTimeElapsed: 120,
			userRanking: null,
			selectedGeneration: { name: "gen1", startId: 1, endId: 151 },
			rewardPokemon,
			remainingPokemon: [],
			criticalHitCount: 0,
			criticalSuccessCount: 0,
			hyperTrainCount: 0,
			maxHypeChain: 0,
			gameSessionId: "game_123",
		});

		expect(mockSaveGameResult).toHaveBeenCalledWith(
			expect.objectContaining({
				totalTimeElapsed: 90,
			}),
		);
	});
});

describe("runGameResultSave", () => {
	beforeEach(() => {
		vi.useFakeTimers();
		mockSaveGameResult.mockResolvedValue("result-id");
		mockGenerateShareableUrl.mockReturnValue(
			"https://example.com/results/result-id",
		);
	});

	afterEach(() => {
		vi.useRealTimers();
	});

	it("persists the game result after the settle delay", async () => {
		const setIsSavingResult = vi.fn();
		const setShareableUrl = vi.fn();

		const promise = runGameResultSave({
			saveContext: readyContext,
			gameSessionId: "game_123",
			playerName: "Ash",
			score: 500,
			finalTime: 120,
			totalTimeElapsed: 150,
			userRanking: null,
			selectedGeneration: { name: "gen1", startId: 1, endId: 151 },
			rewardPokemon: readyContext.rewardPokemon,
			remainingPokemon: [],
			criticalHitCount: 0,
			criticalSuccessCount: 0,
			hyperTrainCount: 0,
			maxHypeChain: 0,
			isSlotMachineRunning: false,
			setIsSavingResult,
			setShareableUrl,
		});

		await vi.advanceTimersByTimeAsync(300);
		await promise;

		expect(setIsSavingResult).toHaveBeenCalledWith(true);
		expect(setShareableUrl).toHaveBeenCalledWith(
			"https://example.com/results/result-id",
		);
	});
});
