import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vite-plus/test";
import {
	resolveMultiplayerRoundPoints,
	resolveMultiplayerRoundScoring,
} from "@/services/multiplayerRoundScoring";
import type { MultiplayerGameState } from "@/services/multiplayerRoomTypes";

const mockNow = new Date("2026-06-30T12:00:00Z").getTime();

const baseGameState: MultiplayerGameState = {
	currentPokemonId: 25,
	remainingPokemon: [1, 4],
	scores: { "host-1": 0, "guest-1": 0 },
	roundStartedAt: Timestamp.fromMillis(mockNow),
	roundDurationSeconds: 15,
	roundResolved: false,
	roundWinnerId: null,
	roundPointsEarned: 0,
	roundNumber: 1,
};

describe("resolveMultiplayerRoundScoring", () => {
	it("never awards zero points when the client clock is behind the server", () => {
		const futureStart = Timestamp.fromMillis(mockNow + 32_000);
		const gameState: MultiplayerGameState = {
			...baseGameState,
			roundStartedAt: futureStart,
		};

		expect(resolveMultiplayerRoundPoints(gameState, false, mockNow)).toBe(3);
	});

	it("awards shiny points for shiny rounds", () => {
		const gameState: MultiplayerGameState = {
			...baseGameState,
			roundDurationSeconds: 10,
		};

		expect(resolveMultiplayerRoundScoring(gameState, true, mockNow).earnedPoints).toBe(5);
	});

	it("disables random critical hit bonuses", () => {
		expect(resolveMultiplayerRoundScoring(baseGameState, false, mockNow)).toEqual({
			earnedPoints: 3,
			showCriticalSuccess: false,
			showCriticalHit: false,
		});
	});
});
