import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredRoomPlayerId } from "@/services/multiplayerPlayerId";
import {
	createRoom,
	joinRoom,
	subscribeToRoom,
	type RoomSnapshotResult,
} from "@/services/multiplayerRoomService";
import type { MultiplayerGeneration } from "@/services/multiplayerRoomTypes";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";

interface UseMultiplayerRoomParams {
	roomId: string | undefined;
}

interface UseMultiplayerRoomResult {
	room: MultiplayerRoom | null;
	isLoading: boolean;
	error: string | null;
	localPlayerId: string | null;
	isHost: boolean;
	isGuest: boolean;
	isJoined: boolean;
	localPlayerName: string | null;
	opponentName: string | null;
	createMultiplayerRoom: (
		playerName: string,
		generation: MultiplayerGeneration,
	) => Promise<string>;
	joinMultiplayerRoom: (playerName: string) => Promise<void>;
}

export const useMultiplayerRoom = ({
	roomId,
}: UseMultiplayerRoomParams): UseMultiplayerRoomResult => {
	const [room, setRoom] = useState<MultiplayerRoom | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);

	const localPlayerId = roomId ? getStoredRoomPlayerId(roomId) : null;

	useEffect(() => {
		if (!roomId) {
			setRoom(null);
			setIsLoading(false);
			return;
		}

		setIsLoading(true);
		const handleSnapshot = (result: RoomSnapshotResult): void => {
			setIsLoading(false);
			if (result.type === "success") {
				setRoom(result.room);
				setError(null);
				return;
			}
			setRoom(null);
			setError(
				result.type === "not_found"
					? "multiplayerRoomNotFound"
					: "multiplayerRoomInvalid",
			);
		};

		const unsubscribe = subscribeToRoom(
			roomId,
			handleSnapshot,
			(subscriptionError) => {
				setError(subscriptionError.message);
				setIsLoading(false);
			},
		);

		return unsubscribe;
	}, [roomId]);

	const isHost = useMemo(
		() =>
			Boolean(
				room && localPlayerId && room.hostPlayer.id === localPlayerId,
			),
		[room, localPlayerId],
	);

	const isGuest = useMemo(
		() =>
			Boolean(
				room &&
					localPlayerId &&
					room.guestPlayer?.id === localPlayerId,
			),
		[room, localPlayerId],
	);

	const isJoined = isHost || isGuest;

	const localPlayerName = useMemo((): string | null => {
		if (!room || !localPlayerId) {
			return null;
		}
		if (room.hostPlayer.id === localPlayerId) {
			return room.hostPlayer.name;
		}
		if (room.guestPlayer?.id === localPlayerId) {
			return room.guestPlayer.name;
		}
		return null;
	}, [room, localPlayerId]);

	const opponentName = useMemo((): string | null => {
		if (!room || !localPlayerId) {
			return null;
		}
		if (room.hostPlayer.id === localPlayerId) {
			return room.guestPlayer?.name ?? null;
		}
		if (room.guestPlayer?.id === localPlayerId) {
			return room.hostPlayer.name;
		}
		return null;
	}, [room, localPlayerId]);

	const createMultiplayerRoom = useCallback(
		async (
			playerName: string,
			generation: MultiplayerGeneration,
		): Promise<string> => createRoom(playerName, generation),
		[],
	);

	const joinMultiplayerRoom = useCallback(
		async (playerName: string): Promise<void> => {
			if (!roomId) {
				throw new Error("room_id_missing");
			}
			await joinRoom(roomId, playerName);
		},
		[roomId],
	);

	return {
		room,
		isLoading,
		error,
		localPlayerId,
		isHost,
		isGuest,
		isJoined,
		localPlayerName,
		opponentName,
		createMultiplayerRoom,
		joinMultiplayerRoom,
	};
};
