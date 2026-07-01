import { beforeEach, describe, expect, it, vi } from "vite-plus/test";
import { GameResultValidationError } from "../gameResultsValidation";

const mockGetDocs = vi.fn();
const mockGetDoc = vi.fn();
const mockSetDoc = vi.fn();
const mockDeleteDoc = vi.fn();
const mockDoc = vi.fn();
const mockCollection = vi.fn();
const mockQuery = vi.fn();
const mockWhere = vi.fn();
const mockOrderBy = vi.fn();
const mockLimit = vi.fn();
const mockServerTimestamp = vi.fn(() => ({ type: "serverTimestamp" }));

vi.mock("firebase/firestore", () => ({
	collection: (...args: unknown[]): unknown => mockCollection(...args),
	doc: (...args: unknown[]): unknown => mockDoc(...args),
	getDoc: (...args: unknown[]): unknown => mockGetDoc(...args),
	getDocs: (...args: unknown[]): unknown => mockGetDocs(...args),
	setDoc: (...args: unknown[]): unknown => mockSetDoc(...args),
	deleteDoc: (...args: unknown[]): unknown => mockDeleteDoc(...args),
	query: (...args: unknown[]): unknown => mockQuery(...args),
	where: (...args: unknown[]): unknown => mockWhere(...args),
	orderBy: (...args: unknown[]): unknown => mockOrderBy(...args),
	limit: (...args: unknown[]): unknown => mockLimit(...args),
	serverTimestamp: (): unknown => mockServerTimestamp(),
}));

vi.mock("../../firebase", () => ({
	db: { name: "mock-db" },
}));

import { gameResultsService } from "../gameResultsService";

const baseResultData = {
	playerName: "Ash",
	score: 500,
	totalTimeElapsed: 120,
	userRanking: 3,
	selectedGeneration: { name: "gen1", startId: 1, endId: 151 },
	rewardPokemon: null,
	remainingPokemon: [1, 2],
	criticalHitCount: 0,
	criticalSuccessCount: 0,
	hyperTrainCount: 0,
	maxHypeChain: 0,
	gameMode: "gen1_game_123",
};

describe("gameResultsService.saveGameResult", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDoc.mockImplementation((_db, _collection, id?: string) => ({
			id: id ?? "generated-id",
		}));
		mockGetDocs.mockResolvedValue({ docs: [] });
		mockGetDoc.mockResolvedValue({ exists: () => false });
		mockSetDoc.mockResolvedValue(undefined);
	});

	it("saves a valid game result and returns the result id", async () => {
		const resultId = await gameResultsService.saveGameResult(baseResultData);

		expect(resultId).toBe("generated-id");
		expect(mockSetDoc).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				playerName: "Ash",
				score: 500,
				isShared: false,
				viewCount: 0,
			}),
		);
	});

	it("throws validation errors for invalid input", async () => {
		await expect(
			gameResultsService.saveGameResult({
				...baseResultData,
				playerName: "",
			}),
		).rejects.toThrow(GameResultValidationError);
	});

	it("throws when daily user save limit is reached", async () => {
		const today = Date.now();
		mockGetDocs.mockResolvedValueOnce({
			docs: Array.from({ length: 20 }, () => ({
				data: () => ({ createdAt: today }),
			})),
		});

		await expect(gameResultsService.saveGameResult(baseResultData)).rejects.toThrow(
			"Daily user save limit exceeded",
		);
	});

	it("throws when daily global save limit is reached", async () => {
		const today = Date.now();
		mockGetDocs.mockResolvedValueOnce({ docs: [] }).mockResolvedValueOnce({
			docs: Array.from({ length: 1000 }, () => ({
				data: () => ({ createdAt: today }),
			})),
		});

		await expect(gameResultsService.saveGameResult(baseResultData)).rejects.toThrow(
			"Daily global save limit exceeded",
		);
	});

	it("uses a unique id when generated id already exists", async () => {
		mockGetDoc.mockResolvedValue({ exists: () => true });

		const resultId = await gameResultsService.saveGameResult(baseResultData);

		expect(resultId.startsWith("generated-id_")).toBe(true);
	});
});

describe("gameResultsService.getGameResult", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDoc.mockReturnValue({ id: "result-id" });
		mockDeleteDoc.mockResolvedValue(undefined);
	});

	it("returns null when result does not exist", async () => {
		mockGetDoc.mockResolvedValue({ exists: () => false });

		await expect(gameResultsService.getGameResult("missing")).resolves.toBeNull();
	});

	it("returns result when document exists and is not expired", async () => {
		const futureDate = new Date(Date.now() + 60_000);
		mockGetDoc.mockResolvedValue({
			exists: () => true,
			data: () => ({
				id: "result-id",
				playerName: "Ash",
				score: 500,
				expiresAt: { toDate: () => futureDate },
				viewCount: 0,
			}),
		});

		const result = await gameResultsService.getGameResult("result-id");

		expect(result?.playerName).toBe("Ash");
	});

	it("deletes and returns null for expired results", async () => {
		const pastDate = new Date(Date.now() - 60_000);
		mockGetDoc.mockResolvedValue({
			exists: () => true,
			data: () => ({
				id: "result-id",
				playerName: "Ash",
				expiresAt: { toDate: () => pastDate },
			}),
		});

		await expect(gameResultsService.getGameResult("result-id")).resolves.toBeNull();
		expect(mockDeleteDoc).toHaveBeenCalled();
	});
});

describe("gameResultsService.incrementViewCount", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		mockDoc.mockReturnValue({ id: "result-id" });
		mockSetDoc.mockResolvedValue(undefined);
	});

	it("increments view count for existing results", async () => {
		mockGetDoc.mockResolvedValue({
			exists: () => true,
			data: () => ({ viewCount: 2, playerName: "Ash" }),
		});

		await gameResultsService.incrementViewCount("result-id");

		expect(mockSetDoc).toHaveBeenCalledWith(
			expect.anything(),
			expect.objectContaining({
				viewCount: 3,
				isShared: true,
			}),
			{ merge: true },
		);
	});

	it("does not increment when view limit is reached", async () => {
		mockGetDoc.mockResolvedValue({
			exists: () => true,
			data: () => ({ viewCount: 10000 }),
		});

		await gameResultsService.incrementViewCount("result-id");

		expect(mockSetDoc).not.toHaveBeenCalled();
	});
});

describe("gameResultsService.cleanupExpiredResults", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("deletes expired documents and returns deleted count", async () => {
		mockGetDocs.mockResolvedValue({
			docs: [{ ref: "doc-1" }, { ref: "doc-2" }],
		});
		mockDeleteDoc.mockResolvedValue(undefined);

		await expect(gameResultsService.cleanupExpiredResults()).resolves.toBe(2);
	});
});

describe("gameResultsService.getPopularResults", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("returns popular shared results", async () => {
		mockGetDocs.mockResolvedValue({
			docs: [{ data: () => ({ id: "a", score: 1000 }) }, { data: () => ({ id: "b", score: 900 }) }],
		});

		await expect(gameResultsService.getPopularResults(2)).resolves.toEqual([
			{ id: "a", score: 1000 },
			{ id: "b", score: 900 },
		]);
	});

	it("returns empty array on query failure", async () => {
		mockGetDocs.mockRejectedValue(new Error("firestore down"));

		await expect(gameResultsService.getPopularResults()).resolves.toEqual([]);
	});
});

describe("gameResultsService.generateShareableUrl", () => {
	it("builds a shareable results url", () => {
		vi.stubGlobal("location", { origin: "https://guess.example" });

		const url = gameResultsService.generateShareableUrl("abc123");

		expect(url.startsWith("https://guess.example/results/abc123?t=")).toBe(true);

		vi.unstubAllGlobals();
	});
});
