import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vite-plus/test";
import {
	calculateRankFromEntries,
	convertStoredNameToDisplay,
	getRankingsCollectionPath,
	isBetterRankingScore,
	isDuplicateSaveAttempt,
	mapRankingDocuments,
} from "../rankingUtils";

describe("calculateRankFromEntries", () => {
	it("returns rank 1 for the best score", () => {
		const rank = calculateRankFromEntries(
			[
				{ score: 10, time: 100 },
				{ score: 8, time: 90 },
			],
			12,
			120,
		);

		expect(rank).toBe(1);
	});

	it("breaks ties using time", () => {
		const rank = calculateRankFromEntries(
			[
				{ score: 10, time: 100 },
				{ score: 10, time: 80 },
			],
			10,
			90,
		);

		expect(rank).toBe(2);
	});
});

describe("isBetterRankingScore", () => {
	it("prefers higher scores and faster times on ties", () => {
		expect(isBetterRankingScore(11, 100, 10, 100)).toBe(true);
		expect(isBetterRankingScore(10, 90, 10, 100)).toBe(true);
		expect(isBetterRankingScore(9, 50, 10, 100)).toBe(false);
	});
});

describe("getRankingsCollectionPath", () => {
	it("builds the generation collection path", () => {
		expect(getRankingsCollectionPath(1, 151)).toBe("rankings_gen1_151");
	});
});

describe("convertStoredNameToDisplay", () => {
	it("replaces underscores with spaces", () => {
		expect(convertStoredNameToDisplay("Ash_Ketchum")).toBe("Ash Ketchum");
	});
});

describe("isDuplicateSaveAttempt", () => {
	it("returns false when there is no previous attempt", () => {
		expect(isDuplicateSaveAttempt(null, 10, 100, 4000)).toBe(false);
	});

	it("detects duplicate attempts within the window", () => {
		const duplicate = isDuplicateSaveAttempt(
			{ score: 10, time: 100, timestamp: 1000 },
			10,
			100,
			4000,
		);

		expect(duplicate).toBe(true);
	});

	it("allows distinct attempts", () => {
		const duplicate = isDuplicateSaveAttempt(
			{ score: 10, time: 100, timestamp: 1000 },
			11,
			100,
			4000,
		);

		expect(duplicate).toBe(false);
	});
});

describe("mapRankingDocuments", () => {
	it("maps valid ranking documents and converts stored names", () => {
		const timestamp = Timestamp.fromDate(new Date("2026-06-30T08:00:00.000Z"));
		const docs = [
			{
				data: () => ({
					name: "Ash_Ketchum",
					score: 100,
					time: 90,
					timestamp,
					uid: "user-1",
				}),
			},
		];

		expect(mapRankingDocuments(docs)).toEqual([
			{
				name: "Ash Ketchum",
				score: 100,
				time: 90,
				timestamp: timestamp.toDate(),
				uid: "user-1",
			},
		]);
	});

	it("skips invalid documents and defaults uid to null", () => {
		const docs = [
			{
				data: () => ({
					name: "Ash",
					score: "invalid",
					time: 90,
					timestamp: "2026-06-30T08:00:00.000Z",
				}),
			},
			{
				data: () => ({
					name: "Misty",
					score: 80,
					time: 100,
					timestamp: Timestamp.fromDate(new Date("2026-06-30T09:00:00.000Z")),
					uid: 123,
				}),
			},
		];

		expect(mapRankingDocuments(docs)).toEqual([
			{
				name: "Misty",
				score: 80,
				time: 100,
				timestamp: new Date("2026-06-30T09:00:00.000Z"),
				uid: null,
			},
		]);
	});
});
