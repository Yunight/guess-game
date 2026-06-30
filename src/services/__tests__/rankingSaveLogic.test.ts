import { describe, expect, it } from "vitest";
import {
	buildRankingPayload,
	extractExistingRankingFromDocs,
	parseExistingRankingData,
	resolveRankingSaveDecision,
	shouldLookupRankingByUid,
	shouldUpdateBestScore,
} from "../rankingSaveLogic";

describe("parseExistingRankingData", () => {
	it("parses valid ranking data", () => {
		expect(parseExistingRankingData({ score: 10, time: 100 })).toEqual({
			score: 10,
			time: 100,
		});
	});

	it("returns null for invalid data", () => {
		expect(parseExistingRankingData(null)).toBeNull();
		expect(parseExistingRankingData({ score: "10", time: 100 })).toBeNull();
	});
});

describe("extractExistingRankingFromDocs", () => {
	it("extracts ranking from the first document", () => {
		const docs = [{ data: () => ({ score: 8, time: 90 }) }];
		expect(extractExistingRankingFromDocs(docs)).toEqual({
			score: 8,
			time: 90,
		});
	});

	it("returns null when no documents exist", () => {
		expect(extractExistingRankingFromDocs([])).toBeNull();
	});
});

describe("resolveRankingSaveDecision", () => {
	it("skips when the new score is not better", () => {
		expect(resolveRankingSaveDecision({ score: 10, time: 100 }, 9, 90)).toBe(
			"skip",
		);
	});

	it("updates when an existing record can be improved", () => {
		expect(resolveRankingSaveDecision({ score: 10, time: 100 }, 11, 100)).toBe(
			"update",
		);
	});

	it("creates when no existing record exists", () => {
		expect(resolveRankingSaveDecision(null, 10, 100)).toBe("create");
	});
});

describe("buildRankingPayload", () => {
	it("builds a ranking payload", () => {
		expect(
			buildRankingPayload({
				playerName: "Ash",
				score: 10,
				totalTimeElapsed: 100,
				uid: "uid-1",
			}),
		).toEqual({
			name: "Ash",
			score: 10,
			time: 100,
			uid: "uid-1",
		});
	});
});

describe("shouldUpdateBestScore", () => {
	it("updates when the new score is higher", () => {
		expect(shouldUpdateBestScore(11, 10)).toBe(true);
		expect(shouldUpdateBestScore(9, 10)).toBe(false);
	});
});

describe("shouldLookupRankingByUid", () => {
	it("returns true for non-empty uids", () => {
		expect(shouldLookupRankingByUid("uid-1")).toBe(true);
	});

	it("returns false for empty or missing uids", () => {
		expect(shouldLookupRankingByUid(null)).toBe(false);
		expect(shouldLookupRankingByUid("")).toBe(false);
	});
});
