import { type RefObject, useCallback } from "react";
import {
	buildGenerationPokemonIds,
	pickRandomPokemonId,
} from "@/components/pokemon-game/generationPool";
import type { Generation } from "@/components/pokemon-game/generations";
import { buildGuessSuggestions } from "@/components/pokemon-game/guessSuggestions";
import type { Pokemon } from "@/components/pokemon-game/types";
import { auth } from "@/firebase";
import {
	resolveSuggestionSubmission,
	resolveHighlightedIndex,
	resolveKeyDownAction,
	applyStartGameStateToSetters,
	validateStartGameSession,
	executeStartGameSession,
	executeCorrectAnswerFlow,
	executeSuggestionSubmission,
} from "./pokemonGameHandlerLogic";
import type { useGameState } from "./useGameState";

type GameState = ReturnType<typeof useGameState>["state"];
type GameSetters = ReturnType<typeof useGameState>["setters"];

export interface UsePokemonGameHandlersParams {
	gameState: GameState;
	gameSetters: GameSetters;
	inputRef: RefObject<HTMLInputElement>;
	currentPokemon: Pokemon | undefined;
	isPokemonLoading: boolean;
	apiPokemonNames: readonly Pokemon[];
	playerName: string;
	language: string;
	convertToStoredFormat: (name: string) => string;
	checkNameAvailability: (name: string) => Promise<boolean>;
	playCorrectSound: () => Promise<void>;
	playWrongSound: () => Promise<void>;
	playVictorySound: () => Promise<void>;
	cleanupAllAudio: () => void;
	clearGuessTimer: () => void;
	startGuessTimer: (setter: (value: number) => void) => void;
	startTotalTimer: (setter: (value: number) => void) => void;
	stopAllTimers: () => void;
	saveRanking: (score: number, time: number) => Promise<void>;
	runSlotMachineEffect: (finalId: number, setRewardPokemonId: (id: number) => void) => void;
	resetSlotMachine: () => void;
	setRewardPokemonId: (id: number | null) => void;
}

export interface PokemonGameHandlers {
	handleSuggestionClick: (suggestion: string) => Promise<void>;
	handleGuessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleCorrectAnswer: () => Promise<void>;
	handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	useHint: () => void;
	handleGenerationSelect: (generation: Generation) => void;
	handleQuit: () => void;
	handleRestart: () => void;
	handleBackToMenu: () => void;
	startGame: (isHardMode: boolean) => Promise<void>;
	handleGameOver: () => Promise<void>;
}

export const usePokemonGameHandlers = ({
	gameState,
	gameSetters,
	inputRef,
	currentPokemon,
	isPokemonLoading,
	apiPokemonNames,
	playerName,
	language,
	convertToStoredFormat,
	checkNameAvailability,
	playCorrectSound,
	playWrongSound,
	playVictorySound,
	cleanupAllAudio,
	clearGuessTimer,
	startGuessTimer,
	startTotalTimer,
	stopAllTimers,
	saveRanking,
	runSlotMachineEffect,
	resetSlotMachine,
	setRewardPokemonId,
}: UsePokemonGameHandlersParams): PokemonGameHandlers => {
	const handleGameOver = useCallback(async (): Promise<void> => {
		if (gameState.gameOver) {
			console.log("[PokemonGame] Game already over, skipping handleGameOver");
			return;
		}

		try {
			console.log("[PokemonGame] Game over, stopping all timers");
			stopAllTimers();

			gameSetters.setIsCorrect(true);

			await new Promise((resolve) => setTimeout(resolve, 3000));

			gameSetters.setIsGameActive(false);
			gameSetters.setGameOver(true);

			await saveRanking(gameState.score, gameState.totalTimeElapsed);

			cleanupAllAudio();
			await playVictorySound();

			const minId = gameState.selectedGeneration.startId;
			const maxId = gameState.selectedGeneration.endId;
			console.log("[PokemonGame] Selecting reward Pokemon from generation:", {
				minId,
				maxId,
				currentGeneration: gameState.selectedGeneration.name,
			});

			const finalRewardPokemonId = pickRandomPokemonId(
				buildGenerationPokemonIds(minId, maxId).filter((id) => id !== gameState.currentPokemonId),
			);

			if (finalRewardPokemonId === null) {
				return;
			}

			console.log(
				"🎯 FINAL reward Pokemon ID selected:",
				finalRewardPokemonId,
				"for generation:",
				gameState.selectedGeneration.name,
			);

			runSlotMachineEffect(finalRewardPokemonId, setRewardPokemonId);
		} catch (error) {
			console.error("[PokemonGame] Error in handleGameOver:", error);
		}
	}, [
		gameState.gameOver,
		gameState.score,
		gameState.totalTimeElapsed,
		gameState.selectedGeneration,
		gameState.currentPokemonId,
		gameSetters,
		stopAllTimers,
		saveRanking,
		cleanupAllAudio,
		playVictorySound,
		runSlotMachineEffect,
		setRewardPokemonId,
	]);

	const handleCorrectAnswer = useCallback(async (): Promise<void> => {
		if (!currentPokemon) {
			return;
		}

		await executeCorrectAnswerFlow(
			{
				isHardMode: gameState.isHardMode,
				guessTimeLeft: gameState.guessTimeLeft,
				showHypeTrain: gameState.showHypeTrain,
				score: gameState.score,
				consecutiveFastAnswers: gameState.consecutiveFastAnswers,
				remainingPokemon: gameState.remainingPokemon,
				answeredPokemonId: currentPokemon.id,
				isShiny: Boolean(currentPokemon.isShiny),
			},
			gameSetters,
			{
				clearGuessTimer,
				playCorrectSound,
				startGuessTimer,
				focusInput: () => inputRef.current?.focus(),
				delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
				scheduleGameOver: () => {
					setTimeout(() => {
						void handleGameOver();
					}, 1500);
				},
			},
		);
	}, [
		currentPokemon,
		gameState.isHardMode,
		gameState.guessTimeLeft,
		gameState.showHypeTrain,
		gameState.score,
		gameState.consecutiveFastAnswers,
		gameState.remainingPokemon,
		gameSetters,
		clearGuessTimer,
		playCorrectSound,
		startGuessTimer,
		inputRef,
		handleGameOver,
	]);

	const handleSuggestionClick = useCallback(
		async (suggestion: string): Promise<void> => {
			const submission = resolveSuggestionSubmission(
				gameState.guessTimeLeft,
				isPokemonLoading,
				suggestion,
				currentPokemon?.frenchName,
				currentPokemon?.englishName,
				convertToStoredFormat,
			);

			await executeSuggestionSubmission(submission, suggestion, gameSetters, {
				delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
				handleCorrectAnswer,
				playWrongSound,
			});
		},
		[
			gameState.guessTimeLeft,
			isPokemonLoading,
			gameSetters,
			convertToStoredFormat,
			currentPokemon,
			handleCorrectAnswer,
			playWrongSound,
		],
	);

	const handleGuessChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>): void => {
			if (gameState.guessTimeLeft <= 0) {
				return;
			}

			const value = e.target.value;
			const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
			gameSetters.setGuess(capitalizedValue);
			gameSetters.setHighlightedIndex(0);

			if (value.length > 0) {
				const filteredSuggestions = buildGuessSuggestions({
					value,
					pokemonList: apiPokemonNames,
					startId: gameState.selectedGeneration.startId,
					endId: gameState.selectedGeneration.endId,
					language,
					normalizeName: convertToStoredFormat,
				});

				gameSetters.setSuggestions(filteredSuggestions);
			} else {
				gameSetters.setSuggestions([]);
				gameSetters.setHighlightedIndex(-1);
			}
		},
		[
			gameState.guessTimeLeft,
			gameState.selectedGeneration,
			gameSetters,
			apiPokemonNames,
			language,
			convertToStoredFormat,
		],
	);

	const handleKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLInputElement>): void => {
			const action = resolveKeyDownAction(
				e.key,
				gameState.hintsLeft,
				Boolean(currentPokemon),
				gameState.suggestions,
				gameState.highlightedIndex,
				gameState.guess,
			);

			if (action.type === "use_hint") {
				e.preventDefault();
				gameSetters.setShowHint(true);
				gameSetters.setHintsLeft((prev) => prev - 1);
				return;
			}

			if (action.type === "submit") {
				e.preventDefault();
				void handleSuggestionClick(action.suggestion);
				return;
			}

			if (action.type === "navigate") {
				e.preventDefault();
				gameSetters.setHighlightedIndex((prevIndex) =>
					resolveHighlightedIndex(action.direction, prevIndex, gameState.suggestions.length),
				);
			}
		},
		[
			gameState.hintsLeft,
			gameState.suggestions,
			gameState.highlightedIndex,
			gameState.guess,
			currentPokemon,
			gameSetters,
			handleSuggestionClick,
		],
	);

	const useHint = useCallback((): void => {
		if (gameState.hintsLeft > 0 && currentPokemon) {
			gameSetters.setShowHint(true);
			gameSetters.setHintsLeft((prev) => prev - 1);
		}
	}, [gameState.hintsLeft, currentPokemon, gameSetters]);

	const handleGenerationSelect = useCallback(
		(generation: Generation): void => {
			gameSetters.setSelectedGeneration(generation);
			gameSetters.setScore(0);
			gameSetters.setGuess("");
			gameSetters.setSuggestions([]);
			gameSetters.setIsCorrect(null);
			gameSetters.setShowHint(false);
		},
		[gameSetters],
	);

	const handleQuit = useCallback((): void => {
		gameSetters.setGuessTimeLeft(0);
		gameSetters.setIsCorrect(false);
		setTimeout(() => {
			void handleGameOver();
		}, 2000);
	}, [gameSetters, handleGameOver]);

	const resetGameProgress = useCallback((): void => {
		gameSetters.setCurrentPokemonId(null);
		gameSetters.setIsCorrect(null);
		gameSetters.setGuess("");
		gameSetters.setSuggestions([]);
		gameSetters.setShowHint(false);
		gameSetters.setPointsEarned(0);
		gameSetters.setShowCriticalSuccess(false);
		gameSetters.setShowCriticalHit(false);
		gameSetters.setShowHypeTrain(false);
		gameSetters.setConsecutiveFastAnswers(0);
		gameSetters.setCriticalHitCount(0);
		gameSetters.setCriticalSuccessCount(0);
		gameSetters.setHyperTrainCount(0);
		gameSetters.setMaxHypeChain(0);
	}, [gameSetters]);

	const startGame = useCallback(
		async (isHardMode: boolean): Promise<void> => {
			const storedName = localStorage.getItem("pokemonGamePlayerName");
			const canStart = await validateStartGameSession(
				{
					isHardMode,
					selectedGeneration: gameState.selectedGeneration,
					playerName,
					isRestarting: gameState.isRestarting,
					hasAuthUser: Boolean(auth.currentUser),
					storedName,
				},
				{ checkNameAvailability },
			);

			if (!canStart) {
				return;
			}

			await executeStartGameSession(
				{
					isHardMode,
					selectedGeneration: gameState.selectedGeneration,
					playerName,
					isRestarting: gameState.isRestarting,
					hasAuthUser: Boolean(auth.currentUser),
					storedName,
				},
				gameSetters,
				{
					checkNameAvailability,
					stopAllTimers,
					cleanupAllAudio,
					applyStartState: (isHardMode, generation) =>
						applyStartGameStateToSetters(isHardMode, generation, gameSetters),
					startTotalTimer,
					startGuessTimer,
					focusInput: () => inputRef.current?.focus(),
					delay: (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
				},
			);
		},
		[
			playerName,
			gameState.isRestarting,
			gameState.selectedGeneration,
			gameSetters,
			checkNameAvailability,
			stopAllTimers,
			cleanupAllAudio,
			startTotalTimer,
			startGuessTimer,
			inputRef,
		],
	);

	const handleRestart = useCallback((): void => {
		cleanupAllAudio();

		console.log("🔄 RESTART: Resetting reward Pokemon ID to null");
		resetSlotMachine();
		setRewardPokemonId(null);
		gameSetters.setRewardPokemon({
			pokemon: undefined,
			isLoading: false,
		});

		resetGameProgress();
		gameSetters.setGameOver(false);
		gameSetters.setIsRestarting(true);

		void startGame(gameState.isHardMode);
	}, [
		cleanupAllAudio,
		resetSlotMachine,
		setRewardPokemonId,
		gameSetters,
		resetGameProgress,
		startGame,
		gameState.isHardMode,
	]);

	const handleBackToMenu = useCallback((): void => {
		stopAllTimers();
		cleanupAllAudio();

		resetSlotMachine();
		setRewardPokemonId(null);
		gameSetters.setRewardPokemon({
			pokemon: undefined,
			isLoading: false,
		});

		gameSetters.setIsGameActive(false);
		gameSetters.setGameOver(false);
		gameSetters.setScore(0);
		gameSetters.setHintsLeft(10);
		resetGameProgress();
		gameSetters.setTotalTimeElapsed(0);
	}, [
		stopAllTimers,
		cleanupAllAudio,
		resetSlotMachine,
		setRewardPokemonId,
		gameSetters,
		resetGameProgress,
	]);

	return {
		handleSuggestionClick,
		handleGuessChange,
		handleCorrectAnswer,
		handleKeyDown,
		useHint,
		handleGenerationSelect,
		handleQuit,
		handleRestart,
		handleBackToMenu,
		startGame,
		handleGameOver,
	};
};
