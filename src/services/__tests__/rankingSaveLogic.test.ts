import { describe, expect, it, vi } from "vite-plus/test";
import { executeRankingSave, lookupExistingRanking } from "../rankingSaveLogic";

const createMockDeps = () => {
	const docs = [{ ref: { id: "doc-1" }, data: () => ({ score: 10, time: 100 }) }];
	const existingDocRef = { id: "uid-1" };
	return {
		doc: vi.fn().mockReturnValue(existingDocRef),
		getDoc: vi.fn().mockResolvedValue({
			exists: () => true,
			data: () => ({ score: 10, time: 100 }),
			ref: existingDocRef,
		}),
		query: vi.fn(),
		where: vi.fn(),
		getDocs: vi.fn().mockResolvedValue({ empty: false, docs }),
		addDoc: vi.fn().mockResolvedValue({}),
		setDoc: vi.fn().mockResolvedValue(undefined),
		updateDoc: vi.fn().mockResolvedValue(undefined),
		createTimestamp: vi.fn().mockReturnValue("timestamp"),
	};
};

describe("lookupExistingRanking", () => {
	it("looks up by uid document id when uid is provided", async () => {
		const deps = createMockDeps();
		const rankingsRef = { id: "rankings" };

		const result = await lookupExistingRanking(rankingsRef as never, "Ash", "uid-1", deps);

		expect(result.existingRanking).toEqual({ score: 10, time: 100 });
		expect(deps.doc).toHaveBeenCalledWith(rankingsRef, "uid-1");
		expect(deps.getDoc).toHaveBeenCalled();
		expect(deps.where).not.toHaveBeenCalled();
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
			getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
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

	it("creates authenticated rankings with uid document id", async () => {
		const deps = {
			...createMockDeps(),
			getDoc: vi.fn().mockResolvedValue({ exists: () => false }),
		};

		await executeRankingSave(
			{
				score: 20,
				totalTimeElapsed: 90,
				playerName: "Ash",
				bestScore: 10,
				uid: "uid-1",
			},
			{ id: "rankings" } as never,
			deps,
			{
				onBestScoreUpdate: vi.fn(),
				onAfterSave: vi.fn().mockResolvedValue(undefined),
				onError: vi.fn(),
			},
		);

		expect(deps.setDoc).toHaveBeenCalled();
		expect(deps.addDoc).not.toHaveBeenCalled();
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
		expect(deps.setDoc).not.toHaveBeenCalled();
		expect(onAfterSave).not.toHaveBeenCalled();
	});
});
