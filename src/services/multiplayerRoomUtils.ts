import type { MultiplayerPlayer, MultiplayerRoom } from "./multiplayerRoomTypes";

export const MAX_MULTIPLAYER_PLAYERS = 4 as const;
export const MIN_MULTIPLAYER_PLAYERS = 2 as const;

export const isRoomPlayer = (room: MultiplayerRoom, playerId: string): boolean =>
	room.players.some((player) => player.id === playerId);

export const isRoomFull = (room: MultiplayerRoom): boolean =>
	room.players.length >= MAX_MULTIPLAYER_PLAYERS;

export const canStartGame = (room: MultiplayerRoom): boolean =>
	room.players.length >= MIN_MULTIPLAYER_PLAYERS;

export const getPlayerById = (
	room: MultiplayerRoom,
	playerId: string,
): MultiplayerPlayer | undefined => room.players.find((player) => player.id === playerId);

export interface PlayerScoreEntry {
	id: string;
	name: string;
	score: number;
	isLocal: boolean;
	slotIndex: number;
}

export const buildPlayerScoreEntries = (
	room: MultiplayerRoom,
	localPlayerId: string,
	resolveScore: (playerId: string) => number,
): PlayerScoreEntry[] =>
	room.players.map((player, slotIndex) => ({
		id: player.id,
		name: player.name,
		score: resolveScore(player.id),
		isLocal: player.id === localPlayerId,
		slotIndex,
	}));
