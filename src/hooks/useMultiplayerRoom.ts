import { useCallback, useEffect, useMemo, useState } from "react";
import { getStoredRoomPlayerId } from "@/services/multiplayerPlayerId";
import {
	createRoom,
	joinRoom,
	subscribeToRoom,
	type RoomSnapshotResult,
} from "@/services/multiplayerRoomService";
import type { MultiplayerGeneration, MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import {
	canStartGame,
	getPlayerById,
	isRoomFull,
	isRoomPlayer,
} from "@/services/multiplayerRoomUtils";

interface UseMultiplayerRoomParams {
	roomId: string | undefined;
}

interface UseMultiplayerRoomResult {
	room: MultiplayerRoom | null;
	isLoading: boolean;
	error: string | null;
	localPlayerId: string | null;
	isHost: boolean;
	isJoined: boolean;
	localPlayerName: string | null;
	playerCount: number;
	canStart: boolean;
	isRoomFull: boolean;
	createMultiplayerRoom: (playerName: string, generation: MultiplayerGeneration) => Promise<string>;
	joinMultiplayerRoom: (playerName: string) => Promise<void>;
}

interface RoomSubscriptionState {
	roomId: string;
	room: MultiplayerRoom | null;
	isLoading: boolean;
	error: string | null;
}

export const useMultiplayerRoom = ({
	roomId,
}: UseMultiplayerRoomParams): UseMultiplayerRoomResult => {
	const [subscriptionState, setSubscriptionState] = useState<RoomSubscriptionState | null>(null);

	const localPlayerId = roomId ? getStoredRoomPlayerId(roomId) : null;

	const isCurrentRoomSubscription = subscriptionState?.roomId === roomId;

	useEffect(() => {
		if (!roomId) {
			return;
		}

		const handleSnapshot = (result: RoomSnapshotResult): void => {
			setSubscriptionState({
				roomId,
				isLoading: false,
				room: result.type === "success" ? result.room : null,
				error:
					result.type === "success"
						? null
						: result.type === "not_found"
							? "multiplayerRoomNotFound"
							: "multiplayerRoomInvalid",
			});
		};

		const unsubscribe = subscribeToRoom(roomId, handleSnapshot, (subscriptionError) => {
			setSubscriptionState({
				roomId,
				isLoading: false,
				room: null,
				error: subscriptionError.message,
			});
		});

		return unsubscribe;
	}, [roomId]);

	const room = roomId && isCurrentRoomSubscription ? subscriptionState.room : null;
	const isLoading = Boolean(roomId && (!isCurrentRoomSubscription || subscriptionState.isLoading));
	const error = roomId && isCurrentRoomSubscription ? subscriptionState.error : null;

	const isHost = useMemo(
		() => Boolean(room && localPlayerId && room.hostPlayerId === localPlayerId),
		[room, localPlayerId],
	);

	const isJoined = useMemo(
		() => Boolean(room && localPlayerId && isRoomPlayer(room, localPlayerId)),
		[room, localPlayerId],
	);

	const localPlayerName = useMemo((): string | null => {
		if (!room || !localPlayerId) {
			return null;
		}
		return getPlayerById(room, localPlayerId)?.name ?? null;
	}, [room, localPlayerId]);

	const playerCount = room?.players.length ?? 0;
	const canStart = room ? canStartGame(room) : false;
	const roomIsFull = room ? isRoomFull(room) : false;

	const createMultiplayerRoom = useCallback(
		async (playerName: string, generation: MultiplayerGeneration): Promise<string> =>
			createRoom(playerName, generation),
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
		isJoined,
		localPlayerName,
		playerCount,
		canStart,
		isRoomFull: roomIsFull,
		createMultiplayerRoom,
		joinMultiplayerRoom,
	};
};
