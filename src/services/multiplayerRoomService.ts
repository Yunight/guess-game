import { buildGenerationPokemonIds } from "@/components/pokemon-game/generationPool";
import {
	pickRandomFromPool,
	resolvePoolAfterCorrectAnswer,
} from "@/components/pokemon-game/gamePool";
import { getInitialGuessTime } from "@/hooks/gameTimerLogic";
import {
	Timestamp,
	doc,
	getDoc,
	onSnapshot,
	runTransaction,
	serverTimestamp,
	setDoc,
	type Unsubscribe,
	updateDoc,
} from "firebase/firestore";
import { auth, db } from "../firebase";
import { createRoomPlayerId, generateRoomId } from "./multiplayerPlayerId";
import {
	applyCorrectGuessToGameState,
	buildNextRoundGameState,
	normalizeScores,
} from "./multiplayerGameStateLogic";
import { resolveMultiplayerRoundPoints } from "./multiplayerRoundScoring";
import type {
	MultiplayerGameState,
	MultiplayerGeneration,
	MultiplayerPlayer,
	MultiplayerRoom,
	RoomStatus,
	SubmitGuessResult,
} from "./multiplayerRoomTypes";

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
	if (
		value.uid !== null &&
		value.uid !== undefined &&
		typeof value.uid !== "string"
	) {
		return null;
	}
	return {
		id: value.id,
		name: value.name,
		uid: value.uid ?? null,
	};
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
	if (
		roundWinnerId !== null &&
		roundWinnerId !== undefined &&
		typeof roundWinnerId !== "string"
	) {
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

export const parseMultiplayerRoom = (
	roomId: string,
	data: unknown,
): MultiplayerRoom | null => {
	if (!isRecord(data)) {
		return null;
	}
	const hostPlayer = normalizePlayer(data.hostPlayer);
	if (
		!isValidRoomStatus(data.status) ||
		!hostPlayer ||
		!isValidGeneration(data.selectedGeneration) ||
		data.isHardMode !== true ||
		(data.winnerId !== null &&
			data.winnerId !== undefined &&
			typeof data.winnerId !== "string") ||
		!isValidTimestamp(data.createdAt) ||
		!isValidTimestamp(data.expiresAt)
	) {
		return null;
	}
	let guestPlayer: MultiplayerPlayer | undefined;
	if (data.guestPlayer !== undefined) {
		const parsedGuest = normalizePlayer(data.guestPlayer);
		if (!parsedGuest) {
			return null;
		}
		guestPlayer = parsedGuest;
	}
	const gameState =
		data.gameState !== undefined ? parseGameState(data.gameState) : undefined;
	if (data.gameState !== undefined && !gameState) {
		return null;
	}
	return {
		id: roomId,
		status: data.status,
		hostPlayer,
		guestPlayer,
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

const buildInitialScores = (
	hostPlayerId: string,
	guestPlayerId: string,
): Record<string, number> => ({
	[hostPlayerId]: 0,
	[guestPlayerId]: 0,
});

const resolveWinnerId = (
	scores: Record<string, number>,
	hostPlayerId: string,
	guestPlayerId: string,
): string | null => {
	const hostScore = scores[hostPlayerId] ?? 0;
	const guestScore = scores[guestPlayerId] ?? 0;
	if (hostScore > guestScore) {
		return hostPlayerId;
	}
	if (guestScore > hostScore) {
		return guestPlayerId;
	}
	return null;
};

export const createRoom = async (
	playerName: string,
	selectedGeneration: MultiplayerGeneration,
): Promise<string> => {
	const roomId = generateRoomId();
	const playerId = createRoomPlayerId(roomId);
	const uid = auth.currentUser?.uid ?? null;
	const expiresAt = Timestamp.fromDate(new Date(Date.now() + ROOM_TTL_MS));

	await setDoc(doc(db, COLLECTION, roomId), {
		status: "waiting",
		hostPlayer: { id: playerId, name: playerName.trim(), uid },
		selectedGeneration,
		isHardMode: true,
		winnerId: null,
		createdAt: serverTimestamp(),
		expiresAt,
	});
	return roomId;
};

export const joinRoom = async (
	roomId: string,
	playerName: string,
): Promise<void> => {
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
		if (room.hostPlayer.id === playerId) {
			return;
		}
		if (room.guestPlayer?.id === playerId) {
			return;
		}
		if (room.guestPlayer) {
			throw new Error("room_full");
		}
		transaction.update(roomRef, {
			guestPlayer: { id: playerId, name: playerName.trim(), uid },
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
			onSnapshotResult(
				resolveRoomSnapshot(roomId, snapshot.exists(), snapshot.data()),
			);
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
	if (!room || room.hostPlayer.id !== hostPlayerId) {
		throw new Error("not_host");
	}
	if (!room.guestPlayer) {
		throw new Error("guest_missing");
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

	const gameState: Omit<MultiplayerGameState, "roundStartedAt"> & {
		roundStartedAt: ReturnType<typeof serverTimestamp>;
	} = {
		currentPokemonId: firstPokemonId,
		remainingPokemon,
		scores: buildInitialScores(room.hostPlayer.id, room.guestPlayer.id),
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
		const roomSnap = await transaction.get(roomRef);
		if (!roomSnap.exists()) {
			return { type: "room_not_playing" };
		}
		const room = parseMultiplayerRoom(roomId, roomSnap.data());
		if (room?.status !== "playing" || !room.gameState) {
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

		const updatedGameState = applyCorrectGuessToGameState(
			room.gameState,
			playerId,
			pointsEarned,
		);
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

const isRoomPlayer = (
	room: MultiplayerRoom,
	playerId: string,
): boolean =>
	room.hostPlayer.id === playerId ||
	room.guestPlayer?.id === playerId;

export const advanceRound = async (
	roomId: string,
	callerPlayerId: string,
	isShiny: boolean,
): Promise<void> => {
	const roomRef = doc(db, COLLECTION, roomId);

	await runTransaction(db, async (transaction) => {
		const roomSnap = await transaction.get(roomRef);
		if (!roomSnap.exists()) {
			throw new Error("room_not_found");
		}
		const room = parseMultiplayerRoom(roomId, roomSnap.data());
		if (!room || !isRoomPlayer(room, callerPlayerId)) {
			throw new Error("not_room_player");
		}
		if (room.status !== "playing" || !room.gameState || !room.guestPlayer) {
			throw new Error("room_not_playing");
		}
		if (!room.gameState.roundResolved) {
			throw new Error("round_not_resolved");
		}

		const poolResult = resolvePoolAfterCorrectAnswer(
			[
				room.gameState.currentPokemonId,
				...room.gameState.remainingPokemon,
			],
			room.gameState.currentPokemonId,
		);

		if (poolResult.type === "game_complete") {
			transaction.update(roomRef, {
				status: "finished",
				winnerId: resolveWinnerId(
					room.gameState.scores,
					room.hostPlayer.id,
					room.guestPlayer.id,
				),
			});
			return;
		}

		const roundDurationSeconds = getInitialGuessTime(isShiny);
		const nextRoundStartedAt = serverTimestamp();

		transaction.update(roomRef, {
			gameState: buildNextRoundGameState(
				room.gameState,
				poolResult.nextPokemonId,
				poolResult.remainingPool,
				roundDurationSeconds,
				nextRoundStartedAt as Timestamp,
			),
		});
	});
};

export const resolveTimeout = async (
	roomId: string,
	hostPlayerId: string,
	isShiny: boolean,
): Promise<void> => {
	const roomRef = doc(db, COLLECTION, roomId);

	await runTransaction(db, async (transaction) => {
		const roomSnap = await transaction.get(roomRef);
		if (!roomSnap.exists()) {
			return;
		}
		const room = parseMultiplayerRoom(roomId, roomSnap.data());
		if (
			!room ||
			room.hostPlayer.id !== hostPlayerId ||
			room.status !== "playing" ||
			!room.gameState ||
			!room.guestPlayer
		) {
			return;
		}
		if (room.gameState.roundResolved) {
			return;
		}

		const poolResult = resolvePoolAfterCorrectAnswer(
			[
				room.gameState.currentPokemonId,
				...room.gameState.remainingPokemon,
			],
			room.gameState.currentPokemonId,
		);

		if (poolResult.type === "game_complete") {
			transaction.update(roomRef, {
				status: "finished",
				winnerId: resolveWinnerId(
					room.gameState.scores,
					room.hostPlayer.id,
					room.guestPlayer.id,
				),
			});
			return;
		}

		const roundDurationSeconds = getInitialGuessTime(isShiny);
		const nextRoundStartedAt = serverTimestamp();

		transaction.update(roomRef, {
			gameState: buildNextRoundGameState(
				room.gameState,
				poolResult.nextPokemonId,
				poolResult.remainingPool,
				roundDurationSeconds,
				nextRoundStartedAt as Timestamp,
			),
		});
	});
};

export const transferHost = async (
	roomId: string,
	leavingHostId: string,
): Promise<void> => {
	const roomRef = doc(db, COLLECTION, roomId);
	const roomSnap = await getDoc(roomRef);
	if (!roomSnap.exists()) {
		return;
	}
	const room = parseMultiplayerRoom(roomId, roomSnap.data());
	if (!room || room.hostPlayer.id !== leavingHostId || !room.guestPlayer) {
		return;
	}

	if (room.status === "playing") {
		await updateDoc(roomRef, {
			status: "finished",
			winnerId: resolveWinnerId(
				room.gameState?.scores ?? {},
				room.hostPlayer.id,
				room.guestPlayer.id,
			),
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
	const roomRef = doc(db, COLLECTION, roomId);
	const roomSnap = await getDoc(roomRef);
	if (!roomSnap.exists()) {
		return;
	}
	const room = parseMultiplayerRoom(roomId, roomSnap.data());
	if (
		!room ||
		room.hostPlayer.id !== hostPlayerId ||
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
	await updateDoc(roomRef, {
		"gameState.roundDurationSeconds": expectedDuration,
	});
};

export const getMultiplayerShareUrl = (roomId: string): string =>
	`${window.location.origin}/multi/${roomId}`;
