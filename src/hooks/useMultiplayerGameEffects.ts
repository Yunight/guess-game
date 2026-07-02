import type { Pokemon } from "@/components/pokemon-game/types";
import { advanceRound, resolveTimeout, syncRoundDuration } from "@/services/multiplayerRoomService";
import type { MultiplayerGameState, MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import { useEffect } from "react";
import { computeGuessTimeLeft, shouldScheduleAdvanceRound } from "./multiplayerGameHandlerLogic";
import type { MultiplayerGameCoreRefs, MultiplayerGameCoreSetters } from "./useMultiplayerGameCore";

const ROUND_TRANSITION_MS = 1000;

interface UseMultiplayerGameEffectsParams {
	room: MultiplayerRoom;
	localPlayerId: string;
	isHost: boolean;
	gameState: MultiplayerGameState | undefined;
	isShiny: boolean;
	currentPokemon: Pokemon | undefined;
	roundNumber: number;
	setters: MultiplayerGameCoreSetters;
	refs: MultiplayerGameCoreRefs;
}

export const useMultiplayerGameEffects = ({
	room,
	localPlayerId,
	isHost,
	gameState,
	isShiny,
	currentPokemon,
	roundNumber,
	setters,
	refs,
}: UseMultiplayerGameEffectsParams): void => {
	const {
		setGuessTimeLeft,
		setTotalTimeElapsed,
		setGuess,
		setSuggestions,
		setHighlightedIndex,
		setIsCorrect,
		setShowCriticalSuccess,
		setShowCriticalHit,
		setPointsEarned,
	} = setters;

	const {
		advanceTimeoutRef,
		lastProcessedRoundRef,
		advanceScheduledForRoundRef,
		gameStartTimeRef,
	} = refs;

	useEffect(() => {
		if (room.status === "playing" && gameStartTimeRef.current === null) {
			gameStartTimeRef.current = Date.now();
		}
	}, [room.status, gameStartTimeRef]);

	useEffect(() => {
		if (room.status !== "playing") {
			return;
		}
		const interval = setInterval(() => {
			if (gameStartTimeRef.current !== null) {
				setTotalTimeElapsed(Math.floor((Date.now() - gameStartTimeRef.current) / 1000));
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [room.status, gameStartTimeRef, setTotalTimeElapsed]);

	useEffect(() => {
		if (!gameState || room.status !== "playing") {
			return;
		}
		const tick = (): void => {
			const timeLeft = computeGuessTimeLeft(
				gameState.roundStartedAt,
				gameState.roundDurationSeconds,
			);
			setGuessTimeLeft(timeLeft);
			if (isHost && !gameState.roundResolved && timeLeft <= 0) {
				void resolveTimeout(room.id, localPlayerId, isShiny);
			}
		};
		tick();
		const interval = setInterval(tick, 200);
		return () => clearInterval(interval);
	}, [gameState, room.status, room.id, isHost, localPlayerId, isShiny, setGuessTimeLeft]);

	useEffect(() => {
		if (room.status !== "playing") {
			return;
		}
		void roundNumber;
		setGuess("");
		setSuggestions([]);
		setHighlightedIndex(-1);
		setIsCorrect(null);
		setShowCriticalSuccess(false);
		setShowCriticalHit(false);
		setPointsEarned(0);
	}, [
		roundNumber,
		room.status,
		setGuess,
		setSuggestions,
		setHighlightedIndex,
		setIsCorrect,
		setShowCriticalSuccess,
		setShowCriticalHit,
		setPointsEarned,
	]);

	useEffect(() => {
		if (!isHost || !gameState || room.status !== "playing" || !currentPokemon) {
			return;
		}
		if (gameState.currentPokemonId !== currentPokemon.id) {
			return;
		}
		void syncRoundDuration(room.id, localPlayerId, gameState.roundNumber, currentPokemon.isShiny);
	}, [isHost, gameState, room.status, room.id, localPlayerId, currentPokemon]);

	useEffect(() => {
		if (!gameState || room.status !== "playing") {
			return;
		}

		if (!gameState.roundResolved) {
			lastProcessedRoundRef.current = Math.max(
				lastProcessedRoundRef.current,
				gameState.roundNumber - 1,
			);
			advanceScheduledForRoundRef.current = 0;
			return;
		}

		if (
			!shouldScheduleAdvanceRound(
				lastProcessedRoundRef.current,
				gameState.roundNumber,
				gameState.roundResolved,
			)
		) {
			return;
		}

		if (advanceScheduledForRoundRef.current === gameState.roundNumber) {
			return;
		}

		advanceScheduledForRoundRef.current = gameState.roundNumber;

		if (advanceTimeoutRef.current) {
			clearTimeout(advanceTimeoutRef.current);
		}

		const resolvedRoundNumber = gameState.roundNumber;

		advanceTimeoutRef.current = setTimeout(() => {
			void advanceRound(room.id, localPlayerId, isShiny)
				.then(() => {
					lastProcessedRoundRef.current = resolvedRoundNumber;
				})
				.finally(() => {
					if (advanceScheduledForRoundRef.current === resolvedRoundNumber) {
						advanceScheduledForRoundRef.current = 0;
					}
				});
		}, ROUND_TRANSITION_MS);

		return () => {
			if (advanceTimeoutRef.current) {
				clearTimeout(advanceTimeoutRef.current);
			}
		};
	}, [
		gameState,
		room.status,
		room.id,
		localPlayerId,
		isShiny,
		advanceTimeoutRef,
		lastProcessedRoundRef,
		advanceScheduledForRoundRef,
	]);

};
