import type { Timestamp } from "firebase/firestore";

export type RoomStatus = "waiting" | "playing" | "finished";

export interface MultiplayerPlayer {
	id: string;
	name: string;
	uid: string | null;
}

export interface MultiplayerGeneration {
	name: string;
	startId: number;
	endId: number;
}

export interface MultiplayerGameState {
	currentPokemonId: number;
	remainingPokemon: number[];
	scores: Record<string, number>;
	roundStartedAt: Timestamp;
	roundDurationSeconds: number;
	roundResolved: boolean;
	roundWinnerId: string | null;
	roundPointsEarned: number;
	roundNumber: number;
}

export interface MultiplayerRoom {
	id: string;
	status: RoomStatus;
	hostPlayer: MultiplayerPlayer;
	guestPlayer?: MultiplayerPlayer;
	selectedGeneration: MultiplayerGeneration;
	isHardMode: true;
	gameState?: MultiplayerGameState;
	winnerId: string | null;
	createdAt: Timestamp;
	expiresAt: Timestamp;
}

export type SubmitGuessResult =
	| { type: "won_round"; pointsEarned: number; scores: Record<string, number> }
	| { type: "already_resolved" }
	| { type: "room_not_playing" };
