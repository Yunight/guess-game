import { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { usePokemonGameCore } from "./usePokemonGameCore";
import { usePokemonGameEffects } from "./usePokemonGameEffects";
import { usePokemonGameHandlers } from "./usePokemonGameHandlers";
import { usePokemonGameQueries } from "./usePokemonGameQueries";

export const usePokemonGameController = () => {
	const { i18n } = useTranslation();
	const core = usePokemonGameCore();

	const queries = usePokemonGameQueries({
		gameState: core.gameState,
		gameSetters: core.gameSetters,
		rewardPokemonId: core.rewardPokemonId,
		spinningPokemonId: core.slotMachine.spinningPokemonId,
		isSlotMachineRunning: core.slotMachine.isSlotMachineRunning,
	});

	const handlers = usePokemonGameHandlers({
		gameState: core.gameState,
		gameSetters: core.gameSetters,
		inputRef: core.inputRef,
		currentPokemon: queries.currentPokemon,
		isPokemonLoading: queries.isPokemonLoading,
		apiPokemonNames: queries.apiPokemonNames,
		playerName: core.player.playerName,
		language: i18n.language,
		convertToStoredFormat: core.player.convertToStoredFormat,
		checkNameAvailability: core.player.checkNameAvailability,
		playCorrectSound: core.audio.playCorrectSound,
		playWrongSound: core.audio.playWrongSound,
		playVictorySound: core.audio.playVictorySound,
		cleanupAllAudio: core.audio.cleanupAllAudio,
		clearGuessTimer: core.timers.clearGuessTimer,
		startGuessTimer: core.timers.startGuessTimer,
		startTotalTimer: core.timers.startTotalTimer,
		stopAllTimers: core.timers.stopAllTimers,
		saveRanking: core.rankingsState.saveRanking,
		runSlotMachineEffect: core.slotMachine.runSlotMachineEffect,
		resetSlotMachine: core.slotMachine.resetSlotMachine,
		setRewardPokemonId: core.setRewardPokemonId,
	});

	core.onGuessTimeEndRef.current = () => {
		if (!core.gameState.gameOver && core.gameState.isGameActive) {
			void handlers.handleGameOver();
		}
	};

	usePokemonGameEffects({
		gameState: core.gameState,
		gameSetters: core.gameSetters,
		inputRef: core.inputRef,
		startGuessTimer: core.timers.startGuessTimer,
		startTotalTimer: core.timers.startTotalTimer,
		stopAllTimers: core.timers.stopAllTimers,
	});

	const rewardPokemon = {
		pokemon: queries.rewardPokemonData ?? undefined,
		isLoading: queries.isRewardPokemonLoading || core.slotMachine.isSlotMachineRunning,
	};

	const handleDevCompleteGeneration = useCallback((): void => {
		core.gameSetters.setRemainingPokemon([]);
		void handlers.handleGameOver();
	}, [core.gameSetters, handlers.handleGameOver]);

	const handleDevGameOver = useCallback((): void => {
		void handlers.handleGameOver();
	}, [handlers.handleGameOver]);

	return {
		inputRef: core.inputRef,
		suggestionsRef: core.suggestionsRef,
		savedName: core.savedName,
		gameState: core.gameState,
		gameSetters: core.gameSetters,
		rewardPokemon,
		isSlotMachineRunning: core.slotMachine.isSlotMachineRunning,
		spinningPokemonData: queries.spinningPokemonData,
		playerName: core.player.playerName,
		nameError: core.player.nameError,
		isCheckingName: core.player.isCheckingName,
		isAuthName: core.player.isAuthName,
		handlePlayerNameChange: core.player.handlePlayerNameChange,
		checkNameAvailability: core.player.checkNameAvailability,
		rankings: core.rankingsState.rankings,
		rankingError: core.rankingsState.rankingError,
		bestScore: core.rankingsState.bestScore,
		bestTime: core.rankingsState.bestTime,
		userRanking: core.rankingsState.userRanking,
		bestRanking: core.rankingsState.bestRanking,
		isPokemonLoading: queries.isPokemonLoading,
		handleSuggestionClick: handlers.handleSuggestionClick,
		handleGuessChange: handlers.handleGuessChange,
		handleKeyDown: handlers.handleKeyDown,
		useHint: handlers.useHint,
		handleGenerationSelect: handlers.handleGenerationSelect,
		handleQuit: handlers.handleQuit,
		handleRestart: handlers.handleRestart,
		handleBackToMenu: handlers.handleBackToMenu,
		startGame: handlers.startGame,
		handleDevCompleteGeneration,
		handleDevGameOver,
	};
};
