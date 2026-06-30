import { type RefObject, useEffect } from "react";
import type { Pokemon } from "@/components/pokemon-game/types";
import {
	shouldApplyHypeTrainBonus,
	shouldRecoverInvalidPokemon,
	shouldResetRewardOnGameClose,
	shouldSyncRewardPokemon,
	shouldTriggerGameOver,
} from "./pokemonGameEffectLogic";
import { useGameTimerEffects } from "./useGameTimerEffects";
import type { useGameState } from "./useGameState";

type GameState = ReturnType<typeof useGameState>["state"];
type GameSetters = ReturnType<typeof useGameState>["setters"];

export interface UsePokemonGameEffectsParams {
	gameState: GameState;
	gameSetters: GameSetters;
	inputRef: RefObject<HTMLInputElement>;
	suggestionsRef: RefObject<HTMLDivElement>;
	currentPokemon: Pokemon | undefined;
	isPokemonLoading: boolean;
	rewardPokemonId: number | null;
	setRewardPokemonId: (id: number | null) => void;
	rewardPokemonData: Pokemon | undefined;
	isRewardPokemonLoading: boolean;
	isSlotMachineRunning: boolean;
	resetSlotMachine: () => void;
	handleGameOver: () => Promise<void>;
	startGuessTimer: (setter: (value: number) => void) => void;
	startTotalTimer: (setter: (value: number) => void) => void;
	stopAllTimers: () => void;
}

export const usePokemonGameEffects = ({
	gameState,
	gameSetters,
	inputRef,
	suggestionsRef,
	currentPokemon,
	isPokemonLoading,
	rewardPokemonId,
	setRewardPokemonId,
	rewardPokemonData,
	isRewardPokemonLoading,
	isSlotMachineRunning,
	resetSlotMachine,
	handleGameOver,
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
		const handleClickOutside = (event: MouseEvent): void => {
			if (
				suggestionsRef.current &&
				event.target instanceof Node &&
				!suggestionsRef.current.contains(event.target)
			) {
				gameSetters.setSuggestions([]);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);

		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [gameSetters, suggestionsRef]);

	useEffect(() => {
		if (
			shouldRecoverInvalidPokemon(
				gameState.isGameActive,
				isPokemonLoading,
				gameState.currentPokemonId,
				gameState.remainingPokemon.length,
				currentPokemon,
			)
		) {
			gameSetters.setCurrentPokemonId(null);

			gameSetters.setRemainingPokemon((prev) => [
				...prev,
				gameState.currentPokemonId ?? 0,
			]);
		}
	}, [
		currentPokemon,
		gameState.currentPokemonId,
		gameState.isGameActive,
		isPokemonLoading,
		gameState.remainingPokemon.length,
		gameSetters,
	]);

	useEffect(() => {
		localStorage.setItem("pokemonGameMuted", JSON.stringify(gameState.isMuted));
	}, [gameState.isMuted]);

	useEffect(() => {
		if (gameState.isGameActive && inputRef.current) {
			inputRef.current.focus();
		}
	}, [gameState.isGameActive, inputRef]);

	useEffect(() => {
		if (rewardPokemonId && gameState.gameOver) {
			console.log("📡 Fetching reward Pokemon data for ID:", rewardPokemonId, {
				isLoading: isRewardPokemonLoading,
				hasData: Boolean(rewardPokemonData),
				pokemonName: rewardPokemonData?.englishName,
			});
		}
	}, [
		rewardPokemonId,
		gameState.gameOver,
		isRewardPokemonLoading,
		rewardPokemonData,
	]);

	useEffect(() => {
		if (shouldResetRewardOnGameClose(gameState.gameOver, Boolean(gameState.rewardPokemon.pokemon))) {
			resetSlotMachine();

			setRewardPokemonId(null);

			gameSetters.setRewardPokemon({
				pokemon: undefined,
				isLoading: false,
			});

			return;
		}

		if (shouldSyncRewardPokemon(gameState.gameOver, rewardPokemonData, isSlotMachineRunning) && rewardPokemonData) {
			console.log("🎯 Reward Pokemon data loaded:", {
				id: rewardPokemonData.id,
				englishName: rewardPokemonData.englishName,
				frenchName: rewardPokemonData.frenchName,
				isSlotMachineRunning,
			});

			gameSetters.setRewardPokemon({
				pokemon: rewardPokemonData,
				isLoading: false,
			});
		}
	}, [
		rewardPokemonData,
		gameState.gameOver,
		gameState.rewardPokemon,
		isSlotMachineRunning,
		gameSetters,
		resetSlotMachine,
		setRewardPokemonId,
	]);

	useEffect(() => {
		if (
			shouldTriggerGameOver(
				gameState.isGameActive,
				gameState.gameOver,
				gameState.guessTimeLeft,
				gameState.remainingPokemon.length,
			)
		) {
			void handleGameOver();
		}
	}, [
		gameState.guessTimeLeft,
		gameState.remainingPokemon.length,
		gameState.isGameActive,
		gameState.gameOver,
		handleGameOver,
	]);

	useEffect(() => {
		if (
			shouldApplyHypeTrainBonus(
				gameState.isHardMode,
				gameState.showHypeTrain,
				gameState.guessTimeLeft,
			)
		) {
			gameSetters.setShowHypeTrain(false);

			gameSetters.setScore((prev) => prev + gameState.consecutiveFastAnswers);

			gameSetters.setConsecutiveFastAnswers(0);
		}
	}, [
		gameState.isHardMode,
		gameState.showHypeTrain,
		gameState.guessTimeLeft,
		gameState.consecutiveFastAnswers,
		gameSetters,
	]);
};
