import { describe, expect, it } from "vitest";
import {
	buildExpirationDate,
	countSavesToday,
	extractTimestampMs,
	GameResultValidationError,
	getResultExpirationDays,
	isDailyGlobalLimitReached,
	isDailyUserLimitReached,
	isExceptionalScore,
	validateGameResultInput,
} from "../gameResultsValidation";

describe("validateGameResultInput", () => {
	it("accepts valid payloads", () => {
		expect(() =>
			validateGameResultInput({
				playerName: "Ash",
				score: 100,
				remainingPokemonCount: 3,
				userRanking: 5,
			}),
		).not.toThrow();
	});

	it("rejects invalid player names and scores", () => {
		expect(() =>
			validateGameResultInput({
				playerName: "",
				score: 100,
				remainingPokemonCount: 0,
				userRanking: null,
			}),
		).toThrow(GameResultValidationError);

		expect(() =>
			validateGameResultInput({
				playerName: "Ash",
				score: 10001,
				remainingPokemonCount: 0,
				userRanking: null,
			}),
		).toThrow(GameResultValidationError);

		expect(() =>
			validateGameResultInput({
				playerName: "A".repeat(51),
				score: 100,
				remainingPokemonCount: 0,
				userRanking: null,
			}),
		).toThrow(GameResultValidationError);

		expect(() =>
			validateGameResultInput({
				playerName: "Ash",
				score: -1,
				remainingPokemonCount: 0,
				userRanking: null,
			}),
		).toThrow(GameResultValidationError);
	});
});

describe("isExceptionalScore", () => {
	it("detects exceptional results", () => {
		expect(
			isExceptionalScore({
				playerName: "Ash",
				score: 1000,
				remainingPokemonCount: 5,
				userRanking: 20,
			}),
		).toBe(true);

		expect(
			isExceptionalScore({
				playerName: "Ash",
				score: 10,
				remainingPokemonCount: 0,
				userRanking: 20,
			}),
		).toBe(true);

		expect(
			isExceptionalScore({
				playerName: "Ash",
				score: 10,
				remainingPokemonCount: 5,
				userRanking: 10,
			}),
		).toBe(true);
	});

	it("returns false for regular scores", () => {
		expect(
			isExceptionalScore({
				playerName: "Ash",
				score: 100,
				remainingPokemonCount: 5,
				userRanking: 20,
			}),
		).toBe(false);
	});
});

describe("buildExpirationDate", () => {
	it("uses 90 days for exceptional scores", () => {
		const now = new Date("2026-01-01T12:00:00Z");
		const input = {
			playerName: "Ash",
			score: 1000,
			remainingPokemonCount: 5,
			userRanking: null,
		};
		const expiration = buildExpirationDate(input, now);

		expect(getResultExpirationDays(input)).toBe(90);
		const dayDiff = Math.round(
			(expiration.getTime() - now.getTime()) / (24 * 60 * 60 * 1000),
		);
		expect(dayDiff).toBe(90);
	});

	it("uses 30 days for regular scores", () => {
		const now = new Date("2026-01-01T12:00:00Z");
		const input = {
			playerName: "Ash",
			score: 100,
			remainingPokemonCount: 5,
			userRanking: null,
		};

		expect(getResultExpirationDays(input)).toBe(30);
		expect(
			Math.round(
				(buildExpirationDate(input, now).getTime() - now.getTime()) /
					(24 * 60 * 60 * 1000),
			),
		).toBe(30);
	});
});

describe("countSavesToday", () => {
	it("counts only timestamps from the current day", () => {
		const now = new Date("2026-06-30T15:00:00.000Z");
		const todayMorning = new Date("2026-06-30T08:00:00.000Z").getTime();
		const yesterday = new Date("2026-06-29T20:00:00.000Z").getTime();

		expect(countSavesToday([todayMorning, yesterday], now.getTime())).toBe(1);
		expect(isDailyUserLimitReached([todayMorning], 1, now.getTime())).toBe(true);
		expect(isDailyGlobalLimitReached([todayMorning], 1, now.getTime())).toBe(
			true,
		);
	});
});

describe("extractTimestampMs", () => {
	it("extracts timestamps from supported values", () => {
		const date = new Date("2026-06-30T08:00:00.000Z");
		expect(extractTimestampMs(date)).toBe(date.getTime());
		expect(
			extractTimestampMs({ toDate: (): Date => date }),
		).toBe(date.getTime());
		expect(extractTimestampMs(date.getTime())).toBe(date.getTime());
	});

	it("returns null for unsupported values", () => {
		expect(extractTimestampMs(null)).toBeNull();
		expect(extractTimestampMs("2026-06-30")).toBeNull();
		expect(extractTimestampMs({ toDate: (): string => "invalid" })).toBeNull();
	});
});
