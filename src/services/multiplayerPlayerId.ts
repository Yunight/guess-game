const ROOM_PLAYER_ID_PREFIX = "multiplayerRoomPlayer_";

export const getStoredRoomPlayerId = (roomId: string): string | null => {
	try {
		return sessionStorage.getItem(`${ROOM_PLAYER_ID_PREFIX}${roomId}`);
	} catch {
		return null;
	}
};

const storeRoomPlayerId = (roomId: string, playerId: string): void => {
	try {
		sessionStorage.setItem(`${ROOM_PLAYER_ID_PREFIX}${roomId}`, playerId);
	} catch {
		return;
	}
};

export const createRoomPlayerId = (roomId: string): string => {
	const existingId = getStoredRoomPlayerId(roomId);
	if (existingId) {
		return existingId;
	}
	const playerId = crypto.randomUUID();
	storeRoomPlayerId(roomId, playerId);
	return playerId;
};

export const generateRoomId = (): string => crypto.randomUUID().replace(/-/g, "").slice(0, 8);
