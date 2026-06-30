import { describe, expect, it, vi } from "vitest";
import {
	executeRankingSave,
	lookupExistingRanking,
} from "../rankingSaveLogic";

const createMockDeps = () => {
	const docs = [{ ref: { id: "doc-1" }, data: () => ({ score: 10, time: 100 }) }];
	return {
		query: vi.fn(),
		where: vi.fn(),
		getDocs: vi.fn().mockResolvedValue({ empty: false, docs }),
		addDoc: vi.fn().mockResolvedValue({}),
		updateDoc: vi.fn().mockResolvedValue(undefined),
		createTimestamp: vi.fn().mockReturnValue("timestamp"),
	};
};

describe("lookupExistingRanking", () => {
	it("looks up by uid when uid is provided", async () => {
		const deps = createMockDeps();
		const rankingsRef = { id: "rankings" };

		const result = await lookupExistingRanking(
			rankingsRef as never,
			"Ash",
			"uid-1",
			deps,
		);

		expect(result.existingRanking).toEqual({ score: 10, time: 100 });
		expect(deps.where).toHaveBeenCalledWith("uid", "==", "uid-1");
	});

	it("looks up by name when uid is missing", async () => {
		const deps = createMockDeps();
		const rankingsRef = { id: "rankings" };

		await lookupExistingRanking(rankingsRef as never, "Ash", null, deps);

		expect(deps.where).toHaveBeenCalledWith("name", "==", "Ash");
	});
});

describe("executeRankingSave", () => {
	it("creates a new ranking when no existing record exists", async () => {
		const deps = {
			...createMockDeps(),
			getDocs: vi.fn().mockResolvedValue({ empty: true, docs: [] }),
		};
		const onBestScoreUpdate = vi.fn();
		const onAfterSave = vi.fn().mockResolvedValue(undefined);
		const onError = vi.fn();

		await executeRankingSave(
			{
				score: 20,
				totalTimeElapsed: 90,
				playerName: "Ash",
				bestScore: 10,
				uid: null,
			},
			{ id: "rankings" } as never,
			deps,
			{ onBestScoreUpdate, onAfterSave, onError },
		);

		expect(deps.addDoc).toHaveBeenCalled();
		expect(onBestScoreUpdate).toHaveBeenCalledWith(20, 90);
		expect(onAfterSave).toHaveBeenCalled();
		expect(onError).not.toHaveBeenCalled();
	});

	it("skips save when existing score is better", async () => {
		const deps = createMockDeps();
		const onAfterSave = vi.fn();

		await executeRankingSave(
			{
				score: 5,
				totalTimeElapsed: 200,
				playerName: "Ash",
				bestScore: 10,
				uid: "uid-1",
			},
			{ id: "rankings" } as never,
			deps,
			{
				onBestScoreUpdate: vi.fn(),
				onAfterSave,
				onError: vi.fn(),
			},
		);

		expect(deps.addDoc).not.toHaveBeenCalled();
		expect(deps.updateDoc).not.toHaveBeenCalled();
		expect(onAfterSave).not.toHaveBeenCalled();
	});
});
