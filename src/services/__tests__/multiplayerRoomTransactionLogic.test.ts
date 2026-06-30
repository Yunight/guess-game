import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import {
	applyPoolProgressionInTransaction,
	resolveWinnerId,
	type PlayingMultiplayerRoom,
	type RoomTransactionWriter,
} from "@/services/multiplayerRoomTransactionLogic";

const mockTimestamp = Timestamp.fromDate(new Date("2026-01-01T00:00:00Z"));

const buildPlayingRoom = (
	overrides: Partial<PlayingMultiplayerRoom["gameState"]> = {},
): PlayingMultiplayerRoom => ({
	id: "room-1",
	status: "playing",
	hostPlayer: { id: "host-1", name: "Ash", uid: null },
	guestPlayer: { id: "guest-1", name: "Misty", uid: null },
	selectedGeneration: { name: "Gen 1", startId: 1, endId: 151 },
	isHardMode: true,
	winnerId: null,
	createdAt: mockTimestamp,
	expiresAt: mockTimestamp,
	gameState: {
		currentPokemonId: 25,
		remainingPokemon: [1, 4],
		scores: { "host-1": 3, "guest-1": 1 },
		roundStartedAt: mockTimestamp,
		roundDurationSeconds: 15,
		roundResolved: true,
		roundWinnerId: "host-1",
		roundPointsEarned: 3,
		roundNumber: 2,
		...overrides,
	},
});

const captureTransaction = (): {
	writer: RoomTransactionWriter;
	updates: Array<Record<string, unknown>>;
} => {
	const updates: Array<Record<string, unknown>> = [];
	return {
		writer: {
			update: (_roomRef, data) => {
				updates.push(data);
			},
		},
		updates,
	};
};

describe("resolveWinnerId", () => {
	it("returns host when host leads", () => {
		expect(resolveWinnerId({ "host-1": 5, "guest-1": 2 }, "host-1", "guest-1")).toBe(
			"host-1",
		);
	});

	it("returns null on tie", () => {
		expect(resolveWinnerId({ "host-1": 3, "guest-1": 3 }, "host-1", "guest-1")).toBeNull();
	});
});

describe("applyPoolProgressionInTransaction", () => {
	it("finishes the game when the pool is empty after the current pokemon", () => {
		const room = buildPlayingRoom({
			currentPokemonId: 25,
			remainingPokemon: [],
		});
		const { writer, updates } = captureTransaction();

		applyPoolProgressionInTransaction(
			writer,
			"room-ref",
			room,
			false,
			mockTimestamp,
		);

		expect(updates).toEqual([
			{
				status: "finished",
				winnerId: "host-1",
			},
		]);
	});

	it("advances to the next round when pokemon remain", () => {
		const room = buildPlayingRoom({
			currentPokemonId: 25,
			remainingPokemon: [1, 4, 7],
			roundNumber: 3,
		});
		const { writer, updates } = captureTransaction();

		applyPoolProgressionInTransaction(
			writer,
			"room-ref",
			room,
			false,
			mockTimestamp,
		);

		expect(updates).toHaveLength(1);
		const gameStateUpdate = updates[0]?.gameState;
		if (!gameStateUpdate || typeof gameStateUpdate !== "object") {
			throw new Error("Expected gameState update");
		}
		expect(gameStateUpdate).toMatchObject({
			roundNumber: 4,
			roundResolved: false,
			roundWinnerId: null,
			roundPointsEarned: 0,
			roundDurationSeconds: 15,
		});
		expect(typeof (gameStateUpdate as { currentPokemonId: number }).currentPokemonId).toBe(
			"number",
		);
	});
});
