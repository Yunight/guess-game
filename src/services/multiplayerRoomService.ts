import { buildGenerationPokemonIds } from "@/components/pokemon-game/generationPool";
import { pickRandomFromPool } from "@/components/pokemon-game/gamePool";
import { getInitialGuessTime } from "@/hooks/gameTimerLogic";
import {
	Timestamp,
	doc,
	getDoc,
	onSnapshot,
	runTransaction,
	serverTimestamp,
	setDoc,
	type DocumentReference,
	type Transaction,
	type Unsubscribe,
	updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { createRoomPlayerId, generateRoomId } from "./multiplayerPlayerId";
import { applyCorrectGuessToGameState, normalizeScores } from "./multiplayerGameStateLogic";
import {
	applyPoolProgressionInTransaction,
	isPlayingMultiplayerRoom,
	resolveWinnerId,
	type PlayingMultiplayerRoom,
} from "./multiplayerRoomTransactionLogic";
import type {
	MultiplayerGameState,
	MultiplayerGeneration,
	MultiplayerPlayer,
	MultiplayerRoom,
	RoomStatus,
	SubmitGuessResult,
} from "./multiplayerRoomTypes";
import {
	canStartGame,
	isRoomPlayer,
	MAX_MULTIPLAYER_PLAYERS,
	MIN_MULTIPLAYER_PLAYERS,
} from "./multiplayerRoomUtils";
import { resolveMultiplayerRoundPoints } from "./multiplayerRoundScoring";

const COLLECTION = "multiplayerRooms";
const ROOM_TTL_MS = 24 * 60 * 60 * 1000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const normalizePlayer = (value: unknown): MultiplayerPlayer | null => {
	if (!isRecord(value)) {
		return null;
	}
	if (typeof value.id !== "string" || typeof value.name !== "string") {
		return null;
	}
	if (value.uid !== null && value.uid !== undefined && typeof value.uid !== "string") {
		return null;
	}
	return {
		id: value.id,
		name: value.name,
		uid: value.uid ?? null,
	};
};

const normalizePlayers = (value: unknown): MultiplayerPlayer[] | null => {
	if (!Array.isArray(value)) {
		return null;
	}
	const players: MultiplayerPlayer[] = [];
	for (const entry of value) {
		const player = normalizePlayer(entry);
		if (!player) {
			return null;
		}
		players.push(player);
	}
	return players;
};

const parseLegacyPlayers = (data: Record<string, unknown>): MultiplayerPlayer[] | null => {
	const hostPlayer = normalizePlayer(data.hostPlayer);
	if (!hostPlayer) {
		return null;
	}
	const players = [hostPlayer];
	if (data.guestPlayer !== undefined) {
		const guestPlayer = normalizePlayer(data.guestPlayer);
		if (!guestPlayer) {
			return null;
		}
		players.push(guestPlayer);
	}
	return players;
};

const resolveRoomPlayers = (data: Record<string, unknown>): MultiplayerPlayer[] | null => {
	if (data.players !== undefined) {
		return normalizePlayers(data.players);
	}
	return parseLegacyPlayers(data);
};

const isValidGeneration = (value: unknown): value is MultiplayerGeneration => {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.name === "string" &&
		typeof value.startId === "number" &&
		typeof value.endId === "number"
	);
};

const isValidTimestamp = (value: unknown): value is Timestamp =>
	isRecord(value) && typeof value.toMillis === "function";

const isValidGameState = (value: unknown): value is MultiplayerGameState => {
	if (!isRecord(value)) {
		return false;
	}
	if (
		typeof value.currentPokemonId !== "number" ||
		!Array.isArray(value.remainingPokemon) ||
		!isRecord(value.scores) ||
		!isValidTimestamp(value.roundStartedAt) ||
		typeof value.roundDurationSeconds !== "number" ||
		typeof value.roundResolved !== "boolean" ||
		typeof value.roundPointsEarned !== "number" ||
		typeof value.roundNumber !== "number"
	) {
		return false;
	}
	const roundWinnerId = value.roundWinnerId;
	if (roundWinnerId !== null && roundWinnerId !== undefined && typeof roundWinnerId !== "string") {
		return false;
	}
	if (!value.remainingPokemon.every((id) => typeof id === "number")) {
		return false;
	}
	const normalizedScores = normalizeScores(value.scores);
	for (const score of Object.values(normalizedScores)) {
		if (!Number.isFinite(score)) {
			return false;
		}
	}
	return true;
};

const parseGameState = (value: unknown): MultiplayerGameState | undefined => {
	if (!isValidGameState(value)) {
		return undefined;
	}
	return {
		currentPokemonId: value.currentPokemonId,
		remainingPokemon: value.remainingPokemon,
		scores: normalizeScores(value.scores),
		roundStartedAt: value.roundStartedAt,
		roundDurationSeconds: value.roundDurationSeconds,
		roundResolved: value.roundResolved,
		roundWinnerId: value.roundWinnerId ?? null,
		roundPointsEarned: value.roundPointsEarned,
		roundNumber: value.roundNumber,
	};
};

const isValidRoomStatus = (value: unknown): value is RoomStatus =>
	value === "waiting" || value === "playing" || value === "finished";

const resolveHostPlayerId = (
	data: Record<string, unknown>,
	players: MultiplayerPlayer[],
): string | null => {
	if (typeof data.hostPlayerId === "string") {
		return data.hostPlayerId;
	}
	const hostPlayer = normalizePlayer(data.hostPlayer);
	if (hostPlayer) {
		return hostPlayer.id;
	}
	const firstPlayer = players[0];
	if (!firstPlayer) {
		return null;
	}
	return firstPlayer.id;
};

export const parseMultiplayerRoom = (roomId: string, data: unknown): MultiplayerRoom | null => {
	if (!isRecord(data)) {
		return null;
	}
	const players = resolveRoomPlayers(data);
	const hostPlayerId = players ? resolveHostPlayerId(data, players) : null;
	if (
		!players ||
		players.length === 0 ||
		!hostPlayerId ||
		!isValidRoomStatus(data.status) ||
		!isValidGeneration(data.selectedGeneration) ||
		data.isHardMode !== true ||
		(data.winnerId !== null && data.winnerId !== undefined && typeof data.winnerId !== "string") ||
		!isValidTimestamp(data.createdAt) ||
		!isValidTimestamp(data.expiresAt)
	) {
		return null;
	}
	const gameState = data.gameState !== undefined ? parseGameState(data.gameState) : undefined;
	if (data.gameState !== undefined && !gameState) {
		return null;
	}
	return {
		id: roomId,
		status: data.status,
		players,
		hostPlayerId,
		selectedGeneration: data.selectedGeneration,
		isHardMode: true,
		gameState,
		winnerId: data.winnerId ?? null,
		createdAt: data.createdAt,
		expiresAt: data.expiresAt,
	};
};

export type RoomSnapshotResult =
	| { type: "success"; room: MultiplayerRoom }
	| { type: "not_found" }
	| { type: "invalid" };

export const resolveRoomSnapshot = (
	roomId: string,
	exists: boolean,
	data: unknown,
): RoomSnapshotResult => {
	if (!exists) {
		return { type: "not_found" };
	}
	const room = parseMultiplayerRoom(roomId, data);
	if (!room) {
		if (import.meta.env.DEV) {
			console.error("Failed to parse multiplayer room", roomId, data);
		}
		return { type: "invalid" };
	}
	return { type: "success", room };
};

const buildInitialScores = (playerIds: readonly string[]): Record<string, number> =>
	Object.fromEntries(playerIds.map((playerId) => [playerId, 0]));

const getRoomDocumentRef = (roomId: string): DocumentReference => doc(db, COLLECTION, roomId);

const loadRoomDocument = async (roomId: string): Promise<MultiplayerRoom | null> => {
	const roomSnap = await getDoc(getRoomDocumentRef(roomId));
	if (!roomSnap.exists()) {
		return null;
	}
	return parseMultiplayerRoom(roomId, roomSnap.data());
};

const loadRoomInTransaction = async (
	transaction: Transaction,
	roomRef: DocumentReference,
	roomId: string,
): Promise<MultiplayerRoom | null> => {
	const roomSnap = await transaction.get(roomRef);
	if (!roomSnap.exists()) {
		return null;
	}
	return parseMultiplayerRoom(roomId, roomSnap.data());
};

const toPlayingRoom = (room: MultiplayerRoom): PlayingMultiplayerRoom | null => {
	if (!isPlayingMultiplayerRoom(room)) {
		return null;
	}
	return room;
};

export const createRoom = async (
	playerName: string,
	selectedGeneration: MultiplayerGeneration,
): Promise<string> => {
	const roomId = generateRoomId();
	const playerId = createRoomPlayerId(roomId);
	const uid = auth.currentUser?.uid ?? null;
	const expiresAt = Timestamp.fromDate(new Date(Date.now() + ROOM_TTL_MS));
	const hostPlayer = { id: playerId, name: playerName.trim(), uid };

	await setDoc(doc(db, COLLECTION, roomId), {
		status: "waiting",
		players: [hostPlayer],
		hostPlayerId: playerId,
		selectedGeneration,
		isHardMode: true,
		winnerId: null,
		createdAt: serverTimestamp(),
		expiresAt,
	});
	return roomId;
};

export const joinRoom = async (roomId: string, playerName: string): Promise<void> => {
	const playerId = createRoomPlayerId(roomId);
	const uid = auth.currentUser?.uid ?? null;
	const roomRef = doc(db, COLLECTION, roomId);

	await runTransaction(db, async (transaction) => {
		const roomSnap = await transaction.get(roomRef);
		if (!roomSnap.exists()) {
			throw new Error("room_not_found");
		}
		const room = parseMultiplayerRoom(roomId, roomSnap.data());
		if (!room) {
			throw new Error("room_invalid");
		}
		if (room.status !== "waiting") {
			throw new Error("room_not_waiting");
		}
		if (room.players.some((player) => player.id === playerId)) {
			return;
		}
		if (room.players.length >= MAX_MULTIPLAYER_PLAYERS) {
			throw new Error("room_full");
		}
		transaction.update(roomRef, {
			players: [...room.players, { id: playerId, name: playerName.trim(), uid }],
		});
	});
};

export const subscribeToRoom = (
	roomId: string,
	onSnapshotResult: (result: RoomSnapshotResult) => void,
	onError: (error: Error) => void,
): Unsubscribe =>
	onSnapshot(
		doc(db, COLLECTION, roomId),
		(snapshot) => {
			onSnapshotResult(resolveRoomSnapshot(roomId, snapshot.exists(), snapshot.data()));
		},
		(error) => {
			if (error instanceof Error) {
				onError(error);
				return;
			}
			onError(new Error("room_subscription_failed"));
		},
	);

export const startGame = async (
	roomId: string,
	hostPlayerId: string,
	isShiny: boolean,
): Promise<void> => {
	const roomRef = doc(db, COLLECTION, roomId);
	const roomSnap = await getDoc(roomRef);
	if (!roomSnap.exists()) {
		throw new Error("room_not_found");
	}
	const room = parseMultiplayerRoom(roomId, roomSnap.data());
	if (!room || room.hostPlayerId !== hostPlayerId) {
		throw new Error("not_host");
	}
	if (!canStartGame(room)) {
		throw new Error("not_enough_players");
	}
	if (room.status !== "waiting") {
		throw new Error("room_not_waiting");
	}

	const pool = buildGenerationPokemonIds(
		room.selectedGeneration.startId,
		room.selectedGeneration.endId,
	);
	const firstPokemonId = pickRandomFromPool(pool);
	if (firstPokemonId === null) {
		throw new Error("empty_pool");
	}

	const remainingPokemon = pool.filter((id) => id !== firstPokemonId);
	const roundDurationSeconds = getInitialGuessTime(isShiny);
	const playerIds = room.players.map((player) => player.id);

	const gameState: Omit<MultiplayerGameState, "roundStartedAt"> & {
		roundStartedAt: ReturnType<typeof serverTimestamp>;
	} = {
		currentPokemonId: firstPokemonId,
		remainingPokemon,
		scores: buildInitialScores(playerIds),
		roundStartedAt: serverTimestamp(),
		roundDurationSeconds,
		roundResolved: false,
		roundWinnerId: null,
		roundPointsEarned: 0,
		roundNumber: 1,
	};

	await updateDoc(roomRef, {
		status: "playing",
		gameState,
	});
};

export const submitCorrectGuess = async (
	roomId: string,
	playerId: string,
	isShiny: boolean,
): Promise<SubmitGuessResult> => {
	const roomRef = doc(db, COLLECTION, roomId);

	return runTransaction(db, async (transaction) => {
		const room = await loadRoomInTransaction(transaction, roomRef, roomId);
		if (!room) {
			return { type: "room_not_playing" };
		}
		if (room.status !== "playing" || !room.gameState) {
			return { type: "room_not_playing" };
		}
		if (room.gameState.roundResolved) {
			return { type: "already_resolved" };
		}

		const pointsEarned = resolveMultiplayerRoundPoints(
			room.gameState,
			isShiny,
			Timestamp.now().toMillis(),
		);

		const updatedGameState = applyCorrectGuessToGameState(room.gameState, playerId, pointsEarned);
		if (!updatedGameState) {
			return { type: "already_resolved" };
		}

		transaction.update(roomRef, {
			gameState: updatedGameState,
		});

		return {
			type: "won_round",
			pointsEarned,
			scores: updatedGameState.scores,
		};
	});
};

type PoolProgressionResolution = { type: "skip" } | { type: "apply"; room: PlayingMultiplayerRoom };

const runPoolProgressionTransaction = async (
	roomId: string,
	resolvePlayingRoom: (room: MultiplayerRoom) => PoolProgressionResolution,
	isShiny: boolean,
	onMissingDocument: () => void,
): Promise<void> => {
	const roomRef = getRoomDocumentRef(roomId);

	await runTransaction(db, async (transaction) => {
		const room = await loadRoomInTransaction(transaction, roomRef, roomId);
		if (!room) {
			onMissingDocument();
			return;
		}

		const resolution = resolvePlayingRoom(room);
		if (resolution.type === "skip") {
			return;
		}

		applyPoolProgressionInTransaction(
			transaction,
			roomRef,
			resolution.room,
			isShiny,
			serverTimestamp() as Timestamp,
		);
	});
};

export const advanceRound = async (
	roomId: string,
	callerPlayerId: string,
	isShiny: boolean,
): Promise<void> => {
	await runPoolProgressionTransaction(
		roomId,
		(room) => {
			if (!isRoomPlayer(room, callerPlayerId)) {
				throw new Error("not_room_player");
			}
			const playingRoom = toPlayingRoom(room);
			if (!playingRoom) {
				throw new Error("room_not_playing");
			}
			if (!playingRoom.gameState.roundResolved) {
				throw new Error("round_not_resolved");
			}
			return { type: "apply", room: playingRoom };
		},
		isShiny,
		() => {
			throw new Error("room_not_found");
		},
	);
};

export const resolveTimeout = async (
	roomId: string,
	hostPlayerId: string,
	isShiny: boolean,
): Promise<void> => {
	await runPoolProgressionTransaction(
		roomId,
		(room) => {
			if (
				room.hostPlayerId !== hostPlayerId ||
				room.status !== "playing" ||
				!room.gameState ||
				room.players.length < MIN_MULTIPLAYER_PLAYERS ||
				room.gameState.roundResolved
			) {
				return { type: "skip" };
			}

			const playingRoom = toPlayingRoom(room);
			if (!playingRoom) {
				return { type: "skip" };
			}

			return { type: "apply", room: playingRoom };
		},
		isShiny,
		() => undefined,
	);
};

export const transferHost = async (roomId: string, leavingHostId: string): Promise<void> => {
	const room = await loadRoomDocument(roomId);
	if (!room || room.hostPlayerId !== leavingHostId) {
		return;
	}

	const roomRef = getRoomDocumentRef(roomId);
	if (room.status === "playing") {
		const playerIds = room.players.map((player) => player.id);
		await updateDoc(roomRef, {
			status: "finished",
			winnerId: resolveWinnerId(room.gameState?.scores ?? {}, playerIds),
		});
		return;
	}

	await updateDoc(roomRef, {
		status: "finished",
	});
};

export const syncRoundDuration = async (
	roomId: string,
	hostPlayerId: string,
	roundNumber: number,
	isShiny: boolean,
): Promise<void> => {
	const room = await loadRoomDocument(roomId);
	if (
		!room ||
		room.hostPlayerId !== hostPlayerId ||
		room.status !== "playing" ||
		!room.gameState
	) {
		return;
	}
	if (room.gameState.roundNumber !== roundNumber || room.gameState.roundResolved) {
		return;
	}
	const expectedDuration = getInitialGuessTime(isShiny);
	if (room.gameState.roundDurationSeconds === expectedDuration) {
		return;
	}
	await updateDoc(getRoomDocumentRef(roomId), {
		"gameState.roundDurationSeconds": expectedDuration,
	});
};

export const getMultiplayerShareUrl = (roomId: string): string =>
	`${window.location.origin}/multi/${roomId}`;
