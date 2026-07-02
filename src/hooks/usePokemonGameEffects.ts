import { type RefObject, useEffect } from "react";
import { writeMutedPreference } from "@/utils/gamePreferencesStorage";
import { useGameTimerEffects } from "./useGameTimerEffects";
import type { useGameState } from "./useGameState";

type GameState = ReturnType<typeof useGameState>["state"];
type GameSetters = ReturnType<typeof useGameState>["setters"];

export interface UsePokemonGameEffectsParams {
	gameState: GameState;
	gameSetters: GameSetters;
	inputRef: RefObject<HTMLInputElement>;
	startGuessTimer: (setter: (value: number) => void) => void;
	startTotalTimer: (setter: (value: number) => void) => void;
	stopAllTimers: () => void;
}

export const usePokemonGameEffects = ({
	gameState,
	gameSetters,
	inputRef,
	startGuessTimer,
	startTotalTimer,
	stopAllTimers,
}: UsePokemonGameEffectsParams): void => {
	useGameTimerEffects({
		gameState,
		gameSetters,
		startGuessTimer,
		startTotalTimer,
		stopAllTimers,
	});

	useEffect(() => {
		writeMutedPreference(gameState.isMuted);
	}, [gameState.isMuted]);

	useEffect(() => {
		if (gameState.isGameActive && inputRef.current) {
			inputRef.current.focus();
		}
	}, [gameState.isGameActive, inputRef]);

};
