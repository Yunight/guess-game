import { useEffect } from "react";
import { applyGameTimerSync } from "./pokemonGameEffectLogic";
import type { useGameState } from "./useGameState";

type GameState = ReturnType<typeof useGameState>["state"];
type GameSetters = ReturnType<typeof useGameState>["setters"];

export interface UseGameTimerEffectsParams {
	gameState: GameState;
	gameSetters: GameSetters;
	startGuessTimer: (setter: (value: number) => void) => void;
	startTotalTimer: (setter: (value: number) => void) => void;
	stopAllTimers: () => void;
}

export const useGameTimerEffects = ({
	gameState,
	gameSetters,
	startGuessTimer,
	startTotalTimer,
	stopAllTimers,
}: UseGameTimerEffectsParams): void => {
	useEffect(() => {
		return applyGameTimerSync(
			{
				isGameActive: gameState.isGameActive,
				isHardMode: gameState.isHardMode,
				guessTimeLeft: gameState.guessTimeLeft,
				totalTimeElapsed: gameState.totalTimeElapsed,
			},
			{
				setGuessTimeLeft: gameSetters.setGuessTimeLeft,
				setTotalTimeElapsed: gameSetters.setTotalTimeElapsed,
			},
			startTotalTimer,
			startGuessTimer,
			stopAllTimers,
		);
	}, [
		gameState.isGameActive,
		gameState.isHardMode,
		gameState.guessTimeLeft,
		gameState.totalTimeElapsed,
		startGuessTimer,
		startTotalTimer,
		stopAllTimers,
		gameSetters.setGuessTimeLeft,
		gameSetters.setTotalTimeElapsed,
	]);
};
