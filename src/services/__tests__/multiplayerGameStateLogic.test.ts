import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import {
	applyCorrectGuessToGameState,
	buildNextRoundGameState,
	normalizeScores,
	resolveDisplayScore,
} from "@/services/multiplayerGameStateLogic";
import type { MultiplayerGameState } from "@/services/multiplayerRoomTypes";

const mockTimestamp = Timestamp.fromDate(new Date("2026-01-01T00:00:00Z"));

const baseGameState: MultiplayerGameState = {
	currentPokemonId: 25,
	remainingPokemon: [1, 4, 7],
	scores: { "host-1": 3, "guest-1": 1 },
	roundStartedAt: mockTimestamp,
	roundDurationSeconds: 15,
	roundResolved: false,
	roundWinnerId: null,
	roundPointsEarned: 0,
	roundNumber: 2,
};

describe("normalizeScores", () => {
	it("keeps finite numeric scores and drops invalid entries", () => {
		expect(
			normalizeScores({
				"host-1": 5,
				"guest-1": "2",
				"bad-1": NaN,
				"bad-2": null,
			}),
		).toEqual({ "host-1": 5 });
	});
});

describe("applyCorrectGuessToGameState", () => {
	it("updates scores and marks round resolved for first correct guess", () => {
		const result = applyCorrectGuessToGameState(baseGameState, "guest-1", 2);
		expect(result).toEqual({
			...baseGameState,
			scores: { "host-1": 3, "guest-1": 3 },
			roundResolved: true,
			roundWinnerId: "guest-1",
			roundPointsEarned: 2,
		});
	});

	it("returns null when round is already resolved", () => {
		const resolvedState: MultiplayerGameState = {
			...baseGameState,
			roundResolved: true,
			roundWinnerId: "host-1",
			roundPointsEarned: 3,
		};
		expect(
			applyCorrectGuessToGameState(resolvedState, "guest-1", 2),
		).toBeNull();
	});
});

describe("buildNextRoundGameState", () => {
	it("advances round and resets round resolution fields", () => {
		const resolvedState: MultiplayerGameState = {
			...baseGameState,
			roundResolved: true,
			roundWinnerId: "host-1",
			roundPointsEarned: 3,
		};
		const nextStartedAt = Timestamp.fromDate(new Date("2026-01-02T00:00:00Z"));
		const result = buildNextRoundGameState(
			resolvedState,
			4,
			[1, 7],
			20,
			nextStartedAt,
		);
		expect(result).toEqual({
			...resolvedState,
			currentPokemonId: 4,
			remainingPokemon: [1, 7],
			roundStartedAt: nextStartedAt,
			roundDurationSeconds: 20,
			roundResolved: false,
			roundWinnerId: null,
			roundPointsEarned: 0,
			roundNumber: 3,
		});
	});
});

describe("resolveDisplayScore", () => {
	it("returns the higher of firestore and optimistic scores", () => {
		expect(resolveDisplayScore(2, 5)).toBe(5);
		expect(resolveDisplayScore(5, 2)).toBe(5);
		expect(resolveDisplayScore(3, undefined)).toBe(3);
	});
});
