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
	buildStartGameState,
	pickFirstPokemonFromPool,
	resolveCorrectAnswerHypeEffect,
	resolveCorrectAnswerScoring,
	resolveHighlightedIndex,
	resolveKeyDownAction,
	resolveSuggestionSubmission,
	shouldAwardHintOnCorrectAnswer,
	shouldSkipNameValidation,
	shouldUpdateStoredPlayerName,
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
	runSlotMachineEffect: (
		finalId: number,
		setRewardPokemonId: (id: number) => void,
	) => void;
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
				buildGenerationPokemonIds(minId, maxId).filter(
					(id) => id !== gameState.currentPokemonId,
				),
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

		if (gameState.isHardMode) {
			clearGuessTimer();
		}

		gameSetters.setIsCorrect(true);
		await playCorrectSound();

		if (shouldAwardHintOnCorrectAnswer(gameState.score)) {
			gameSetters.setHintsLeft((prev) => prev + 1);
		}

		const hypeEffect = resolveCorrectAnswerHypeEffect(
			gameState.isHardMode,
			gameState.guessTimeLeft,
			gameState.showHypeTrain,
			gameState.consecutiveFastAnswers,
		);

		if (hypeEffect.type === "increment_fast_answers") {
			gameSetters.setConsecutiveFastAnswers(hypeEffect.newCount);
			if (hypeEffect.shouldShowHypeTrain) {
				gameSetters.setShowHypeTrain(true);
				gameSetters.setMaxHypeChain((prevMax) =>
					Math.max(prevMax, hypeEffect.newCount),
				);
			}
		} else if (hypeEffect.type === "break_hype_train") {
			gameSetters.setShowHypeTrain(false);
			gameSetters.setScore((prev) => prev + hypeEffect.bonusScore);
			gameSetters.setConsecutiveFastAnswers(0);
		}

		const { scoringResult, poolResult } = resolveCorrectAnswerScoring({
			isHardMode: gameState.isHardMode,
			guessTimeLeft: gameState.guessTimeLeft,
			isShiny: Boolean(currentPokemon.isShiny),
			showHypeTrain: gameState.showHypeTrain,
			remainingPokemon: gameState.remainingPokemon,
			answeredPokemonId: currentPokemon.id,
		});

		if (scoringResult.showCriticalSuccess) {
			gameSetters.setShowCriticalSuccess(true);
			gameSetters.setCriticalSuccessCount((prev) => prev + 1);
			setTimeout(() => {
				gameSetters.setShowCriticalSuccess(false);
			}, 2000);
		}

		if (scoringResult.showCriticalHit) {
			gameSetters.setShowCriticalHit(true);
			gameSetters.setCriticalHitCount((prev) => prev + 1);
			setTimeout(() => {
				gameSetters.setShowCriticalHit(false);
			}, 2000);
		}

		gameSetters.setPointsEarned(scoringResult.earnedPoints);
		setTimeout(() => {
			gameSetters.setPointsEarned(0);
		}, 1000);

		gameSetters.setScore((prev) => prev + scoringResult.earnedPoints);

		if (poolResult.type === "game_complete") {
			gameSetters.setRemainingPokemon([]);
			setTimeout(() => {
				void handleGameOver();
			}, 1500);
			return;
		}

		gameSetters.setRemainingPokemon(poolResult.remainingPool);

		await new Promise((resolve) => setTimeout(resolve, 1000));

		gameSetters.setCurrentPokemonId(null);
		gameSetters.setIsCorrect(null);
		gameSetters.setGuess("");
		gameSetters.setSuggestions([]);
		gameSetters.setShowHint(false);

		await new Promise((resolve) => setTimeout(resolve, 50));
		await new Promise((resolve) => setTimeout(resolve, 300));

		gameSetters.setCurrentPokemonId(poolResult.nextPokemonId);

		if (gameState.isHardMode) {
			startGuessTimer(gameSetters.setGuessTimeLeft);
		}

		inputRef.current?.focus();
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

			if (submission.type === "skip") {
				return;
			}

			gameSetters.setGuess(suggestion);
			gameSetters.setSuggestions([]);

			await new Promise((resolve) => setTimeout(resolve, 50));

			if (submission.type === "correct") {
				await handleCorrectAnswer();
			} else {
				gameSetters.setIsCorrect(false);
				await playWrongSound();
			}
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
					resolveHighlightedIndex(
						action.direction,
						prevIndex,
						gameState.suggestions.length,
					),
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
			if (!playerName) {
				return;
			}

			const exactName = playerName.trim();
			const storedName = localStorage.getItem("pokemonGamePlayerName");

			const shouldSkipValidation = shouldSkipNameValidation(
				Boolean(auth.currentUser),
				gameState.isRestarting,
				exactName,
				storedName,
			);

			if (!shouldSkipValidation) {
				const isAvailable = await checkNameAvailability(exactName);
				if (!isAvailable) {
					return;
				}
			}

			if (shouldUpdateStoredPlayerName(exactName, storedName)) {
				localStorage.clear();
				localStorage.setItem("pokemonGamePlayerName", exactName);
			}

			gameSetters.setIsRestarting(true);

			try {
				stopAllTimers();
				cleanupAllAudio();

				const startState = buildStartGameState(isHardMode);
				gameSetters.setIsHardMode(startState.isHardMode);
				gameSetters.setScore(startState.score);
				gameSetters.setHintsLeft(startState.hintsLeft);
				gameSetters.setGuessTimeLeft(startState.guessTimeLeft);
				gameSetters.setTotalTimeElapsed(startState.totalTimeElapsed);
				gameSetters.setGameOver(startState.gameOver);
				gameSetters.setUserRanking(startState.userRanking);
				gameSetters.setHighlightedIndex(startState.highlightedIndex);
				gameSetters.setConsecutiveFastAnswers(startState.consecutiveFastAnswers);
				gameSetters.setShowHypeTrain(startState.showHypeTrain);
				gameSetters.setPointsEarned(startState.pointsEarned);
				gameSetters.setCurrentPokemonId(startState.currentPokemonId);
				gameSetters.setIsCorrect(startState.isCorrect);
				gameSetters.setGuess(startState.guess);
				gameSetters.setSuggestions([...startState.suggestions]);
				gameSetters.setShowHint(startState.showHint);
				gameSetters.setRewardPokemon({
					pokemon: undefined,
					isLoading: false,
				});

				const allPokemonIds = buildGenerationPokemonIds(
					gameState.selectedGeneration.startId,
					gameState.selectedGeneration.endId,
				);

				gameSetters.setRemainingPokemon(allPokemonIds);

				await new Promise((resolve) => setTimeout(resolve, 100));

				gameSetters.setIsGameActive(true);
				startTotalTimer(gameSetters.setTotalTimeElapsed);
				if (isHardMode) {
					startGuessTimer(gameSetters.setGuessTimeLeft);
				}

				const { firstPokemonId, remainingPokemon } =
					pickFirstPokemonFromPool(allPokemonIds);

				if (firstPokemonId === null) {
					return;
				}

				gameSetters.setRemainingPokemon([...remainingPokemon]);
				gameSetters.setCurrentPokemonId(firstPokemonId);

				inputRef.current?.focus();
			} catch (error) {
				console.error("Error starting game:", error);
			} finally {
				gameSetters.setIsRestarting(false);
			}
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
