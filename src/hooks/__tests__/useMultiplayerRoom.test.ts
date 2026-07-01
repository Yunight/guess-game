import { renderHook, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vite-plus/test";
import { useMultiplayerRoom } from "@/hooks/useMultiplayerRoom";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import type { RoomSnapshotResult } from "@/services/multiplayerRoomService";

const mockRoom: MultiplayerRoom = {
	id: "abc123",
	status: "waiting",
	hostPlayer: { id: "host-1", name: "Ash", uid: null },
	selectedGeneration: { name: "1ère Génération", startId: 1, endId: 151 },
	isHardMode: true,
	winnerId: null,
	createdAt: { toMillis: () => 0 } as MultiplayerRoom["createdAt"],
	expiresAt: { toMillis: () => 0 } as MultiplayerRoom["expiresAt"],
};

let snapshotHandler: ((result: RoomSnapshotResult) => void) | undefined;

vi.mock("@/services/multiplayerPlayerId", () => ({
	getStoredRoomPlayerId: (): string => "host-1",
}));

vi.mock("@/services/multiplayerRoomService", () => ({
	createRoom: vi.fn(),
	joinRoom: vi.fn(),
	subscribeToRoom: vi.fn(
		(_roomId: string, onSnapshotResult: (result: RoomSnapshotResult) => void) => {
			snapshotHandler = onSnapshotResult;
			return vi.fn();
		},
	),
}));

describe("useMultiplayerRoom", () => {
	it("clears error when room loads after transient not_found snapshot", async () => {
		const { result } = renderHook(() => useMultiplayerRoom({ roomId: "abc123" }));

		expect(snapshotHandler).toBeDefined();
		snapshotHandler?.({ type: "not_found" });

		await waitFor(() => {
			expect(result.current.error).toBe("multiplayerRoomNotFound");
			expect(result.current.room).toBeNull();
		});

		snapshotHandler?.({ type: "success", room: mockRoom });

		await waitFor(() => {
			expect(result.current.error).toBeNull();
			expect(result.current.room?.id).toBe("abc123");
			expect(result.current.isHost).toBe(true);
		});
	});
});
