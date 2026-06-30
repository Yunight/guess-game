import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vitest";
import {
	parseMultiplayerRoom,
	resolveRoomSnapshot,
} from "@/services/multiplayerRoomService";

const mockTimestamp = Timestamp.fromDate(new Date("2026-01-01T00:00:00Z"));

const validRoomData = {
	status: "waiting",
	hostPlayer: { id: "host-1", name: "Ash" },
	selectedGeneration: { name: "1ère Génération", startId: 1, endId: 151 },
	isHardMode: true,
	winnerId: null,
	createdAt: mockTimestamp,
	expiresAt: mockTimestamp,
};

describe("parseMultiplayerRoom", () => {
	it("accepts host player without uid field", () => {
		const room = parseMultiplayerRoom("abc123", validRoomData);
		expect(room?.hostPlayer.uid).toBeNull();
	});

	it("accepts guest player without uid field", () => {
		const room = parseMultiplayerRoom("abc123", {
			...validRoomData,
			guestPlayer: { id: "guest-1", name: "Misty" },
		});
		expect(room?.guestPlayer?.uid).toBeNull();
	});
});

describe("resolveRoomSnapshot", () => {
	it("returns not_found when document does not exist", () => {
		expect(resolveRoomSnapshot("abc123", false, undefined)).toEqual({
			type: "not_found",
		});
	});

	it("returns invalid when document exists but cannot be parsed", () => {
		expect(resolveRoomSnapshot("abc123", true, { status: "broken" })).toEqual({
			type: "invalid",
		});
	});

	it("returns success when document is valid", () => {
		const result = resolveRoomSnapshot("abc123", true, validRoomData);
		expect(result.type).toBe("success");
		if (result.type === "success") {
			expect(result.room.id).toBe("abc123");
			expect(result.room.hostPlayer.name).toBe("Ash");
		}
	});
});

describe("parseMultiplayerRoom gameState", () => {
	const gameStateBase = {
		currentPokemonId: 25,
		remainingPokemon: [1, 4],
		scores: { "host-1": 2, "guest-1": 1 },
		roundStartedAt: mockTimestamp,
		roundDurationSeconds: 15,
		roundResolved: false,
		roundPointsEarned: 0,
		roundNumber: 1,
	};

	it("accepts gameState when roundWinnerId is absent and normalizes to null", () => {
		const room = parseMultiplayerRoom("abc123", {
			...validRoomData,
			status: "playing",
			guestPlayer: { id: "guest-1", name: "Misty" },
			gameState: gameStateBase,
		});
		expect(room?.gameState?.roundWinnerId).toBeNull();
	});

	it("normalizes numeric scores and filters invalid score entries", () => {
		const room = parseMultiplayerRoom("abc123", {
			...validRoomData,
			status: "playing",
			guestPlayer: { id: "guest-1", name: "Misty" },
			gameState: {
				...gameStateBase,
				scores: { "host-1": 4, "guest-1": "bad", "orphan": 99 },
			},
		});
		expect(room?.gameState?.scores).toEqual({ "host-1": 4, orphan: 99 });
	});
});

describe("resolveRoomSnapshot recovery", () => {
	it("recovers from not_found to success on subsequent snapshot", () => {
		const first = resolveRoomSnapshot("abc123", false, undefined);
		const second = resolveRoomSnapshot("abc123", true, validRoomData);

		expect(first.type).toBe("not_found");
		expect(second.type).toBe("success");
	});
});
