import { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { skipToken } from "@reduxjs/toolkit/query";
import { auth } from "../../firebase";
import {
	useGetAllPokemonNamesQuery,
	useGetPokemonByIdQuery,
} from "../../services/pokemonApi";
import { GameOverDialog } from "./GameOverDialog";
import { GameScreen } from "./GameScreen";
import { MenuScreen } from "./MenuScreen";
import { useGameState } from "../../hooks/useGameState";
import { useGameAudio } from "../../hooks/useGameAudio";
import { useGameTimers } from "../../hooks/useGameTimers";
import { usePlayerName } from "../../hooks/usePlayerName";
import { useRankings } from "../../hooks/useRankings";
import type { Generation } from "./types";
import "../../styles/PokemonGame.css";

const GENERATIONS: Generation[] = [
	{ name: "1ère Génération", startId: 1, endId: 151 },
	{ name: "2ème Génération", startId: 152, endId: 251 },
	{ name: "3ème Génération", startId: 252, endId: 386 },
	{ name: "4ème Génération", startId: 387, endId: 493 },
	{ name: "5ème Génération", startId: 494, endId: 649 },
	{ name: "6ème Génération", startId: 650, endId: 721 },
	{ name: "7ème Génération", startId: 722, endId: 809 },
	{ name: "8ème Génération", startId: 810, endId: 905 },
	{ name: "9ème Génération", startId: 906, endId: 1010 },
];

const PokemonGame = () => {
	const { i18n } = useTranslation();
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const savedName = localStorage.getItem("pokemonGamePlayerName");

	// Use our custom hooks
	const {
		state: gameState,
		setters: gameSetters,
	} = useGameState(GENERATIONS[0]);

	const {
		playerName,
		nameError,
		isCheckingName,
		isAuthName,
		handlePlayerNameChange,
		checkNameAvailability,
		convertToStoredFormat,
		convertToDisplayFormat,
	} = usePlayerName({ GENERATIONS });

	const {
		rankings,
		bestScore,
		bestTime,
		userRanking,
		bestRanking,
		calculateRankings,
		fetchRankings,
	} = useRankings({
		selectedGeneration: gameState.selectedGeneration,
		playerName,
		isGameActive: gameState.isGameActive,
	});

	const {
		playCorrectSound,
		playWrongSound,
		playVictorySound,
		cleanupAllAudio,
	} = useGameAudio(
		gameState.isMuted,
		gameState.showHypeTrain,
		gameState.isHardMode,
		gameState.guessTimeLeft
	);

	const handleWrongAnswer = useCallback(() => {
		gameSetters.setIsCorrect(false);
		playWrongSound();
	}, [gameSetters, playWrongSound]);

	const { startGuessTimer, startTotalTimer, stopAllTimers, clearGuessTimer } = useGameTimers(
		gameState.isGameActive,
		gameState.isHardMode,
		gameState.currentPokemon?.isShiny,
		{
			onGuessTimeEnd: handleWrongAnswer,
			onTotalTimeUpdate: (time) => {
				gameSetters.setTotalTimeElapsed(time);
			},
		}
	);

	// Initialize timers when game starts
	useEffect(() => {
		console.log('Timer initialization effect triggered', {
			isGameActive: gameState.isGameActive,
			isHardMode: gameState.isHardMode,
			isShiny: gameState.currentPokemon?.isShiny
		});

		if (gameState.isGameActive) {
			// Reset timer states first
			console.log('Resetting timer states');
			gameSetters.setTotalTimeElapsed(0);
			if (gameState.isHardMode) {
				const initialTime = gameState.currentPokemon?.isShiny ? 10 : 15;
				console.log('Setting initial guess time:', initialTime);
				gameSetters.setGuessTimeLeft(initialTime);
			} else {
				console.log('Setting guess time to infinity (chill mode)');
				gameSetters.setGuessTimeLeft(Number.POSITIVE_INFINITY);
			}

			// Start timers
			console.log('Starting timers');
			startTotalTimer(gameSetters.setTotalTimeElapsed);
			if (gameState.isHardMode) {
				startGuessTimer(gameSetters.setGuessTimeLeft);
			}
		}

		// Only cleanup when component unmounts
		return () => {
			console.log('Timer initialization effect cleanup - unmounting');
			stopAllTimers();
		};
	}, [gameState.isGameActive]); // Only depend on isGameActive

	// Reset guess timer when current Pokemon changes
	useEffect(() => {
		if (!gameState.currentPokemon?.id || !gameState.isGameActive || !gameState.isHardMode) {
			return;
		}

		console.log('Pokemon change effect triggered', {
			pokemonId: gameState.currentPokemon.id,
			isShiny: gameState.currentPokemon.isShiny
		});

		// Reset timer state first
		const initialTime = gameState.currentPokemon.isShiny ? 10 : 15;
		console.log('Setting new guess time for Pokemon:', initialTime);
		gameSetters.setGuessTimeLeft(initialTime);
		// Start new timer
		console.log('Starting new guess timer for Pokemon');
		startGuessTimer(gameSetters.setGuessTimeLeft);
	}, [
		gameState.currentPokemon?.id // Only trigger on ID change
	]);

	// Cleanup timers when game ends
	useEffect(() => {
		if (!gameState.isGameActive) {
			stopAllTimers();
		}
		return () => {
			stopAllTimers();
		};
	}, [gameState.isGameActive, stopAllTimers]);

	// Use Pokemon API queries
	const { data: apiPokemonNames = [] } = useGetAllPokemonNamesQuery(
		{ maxHypeChain: gameState.maxHypeChain },
		{
			refetchOnMountOrArgChange: false,
			refetchOnFocus: false,
			refetchOnReconnect: false,
		}
	);

	const { data: currentPokemon, isLoading: isPokemonLoading } =
		useGetPokemonByIdQuery(
			gameState.currentPokemonId
				? { id: gameState.currentPokemonId, maxHypeChain: gameState.maxHypeChain }
				: skipToken,
			{
				skip: !gameState.currentPokemonId || !gameState.isGameActive,
				refetchOnMountOrArgChange: false,
				refetchOnFocus: false,
				refetchOnReconnect: false,
			}
		);

	// Update currentPokemon in gameState when API data changes
	useEffect(() => {
		if (currentPokemon) {
			gameSetters.setCurrentPokemon(currentPokemon);
		}
	}, [currentPokemon, gameSetters]);

	// Handle click outside suggestions
	useEffect(() => {
		const handleClickOutside = (event: MouseEvent) => {
			if (
				suggestionsRef.current &&
				!suggestionsRef.current.contains(event.target as Node)
			) {
				gameSetters.setSuggestions([]);
			}
		};

		document.addEventListener("mousedown", handleClickOutside);
		return () => document.removeEventListener("mousedown", handleClickOutside);
	}, [gameSetters]);

	const handleSuggestionClick = async (suggestion: string) => {
		if (gameState.guessTimeLeft <= 0 || isPokemonLoading) return;

		gameSetters.setGuess(suggestion);
		gameSetters.setSuggestions([]);

		// Wait for a small delay to ensure Pokemon data is loaded
		await new Promise((resolve) => setTimeout(resolve, 50));

		const normalizedSuggestion = convertToStoredFormat(suggestion);
		const pokemonNameFr = currentPokemon?.frenchName;
		const pokemonNameEn = currentPokemon?.englishName;

		if (!pokemonNameFr || !pokemonNameEn) {
			return;
		}

		const normalizedAnswerFr = convertToStoredFormat(pokemonNameFr);
		const normalizedAnswerEn = convertToStoredFormat(pokemonNameEn);

		if (
			normalizedSuggestion === normalizedAnswerFr ||
			normalizedSuggestion === normalizedAnswerEn ||
			suggestion.toLowerCase() === pokemonNameFr.toLowerCase() ||
			suggestion.toLowerCase() === pokemonNameEn.toLowerCase()
		) {
			handleCorrectAnswer();
		} else {
			gameSetters.setIsCorrect(false);
			await playWrongSound();
		}
	};

	const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		if (gameState.guessTimeLeft <= 0) return;

		const value = e.target.value;
		const capitalizedValue = value.charAt(0).toUpperCase() + value.slice(1);
		gameSetters.setGuess(capitalizedValue);
		gameSetters.setHighlightedIndex(0);

		if (value.length > 0) {
			const normalizedValue = convertToStoredFormat(value);

			const filteredSuggestions = apiPokemonNames
				.filter((pokemon) => {
					if (!pokemon) return false;
					const pokemonNameFr = pokemon.frenchName;
					const pokemonNameEn = pokemon.englishName;
					if (!pokemonNameFr || !pokemonNameEn) return false;

					const normalizedNameFr = convertToStoredFormat(pokemonNameFr);
					const normalizedNameEn = convertToStoredFormat(pokemonNameEn);

					return (
						(normalizedNameFr.includes(normalizedValue) ||
							normalizedNameEn.includes(normalizedValue)) &&
						pokemon.id >= gameState.selectedGeneration.startId &&
						pokemon.id <= gameState.selectedGeneration.endId
					);
				})
				.sort((a, b) => {
					const aNameFr = convertToStoredFormat(a.frenchName);
					const aNameEn = convertToStoredFormat(a.englishName);
					const bNameFr = convertToStoredFormat(b.frenchName);
					const bNameEn = convertToStoredFormat(b.englishName);
					const normalizedValue = convertToStoredFormat(value);

					// Check if names start with the input value
					const aStartsWithFr = aNameFr.startsWith(normalizedValue);
					const aStartsWithEn = aNameEn.startsWith(normalizedValue);
					const bStartsWithFr = bNameFr.startsWith(normalizedValue);
					const bStartsWithEn = bNameEn.startsWith(normalizedValue);

					// If one starts with and the other doesn't, prioritize the one that starts with
					if ((aStartsWithFr || aStartsWithEn) && !(bStartsWithFr || bStartsWithEn)) return -1;
					if (!(aStartsWithFr || aStartsWithEn) && (bStartsWithFr || bStartsWithEn)) return 1;

					// If both or neither start with, check for exact matches
					const aExactMatch = aNameFr === normalizedValue || aNameEn === normalizedValue;
					const bExactMatch = bNameFr === normalizedValue || bNameEn === normalizedValue;

					if (aExactMatch && !bExactMatch) return -1;
					if (!aExactMatch && bExactMatch) return 1;

					// If no exact matches, sort by length
					const aLength = Math.min(a.frenchName.length, a.englishName.length);
					const bLength = Math.min(b.frenchName.length, b.englishName.length);
					return aLength - bLength;
				})
				.map((pokemon) =>
					i18n.language === "fr" ? pokemon.frenchName : pokemon.englishName
				)
				.filter(Boolean)
				.slice(0, 5);

			gameSetters.setSuggestions(filteredSuggestions);
		} else {
			gameSetters.setSuggestions([]);
			gameSetters.setHighlightedIndex(-1);
		}
	};

	const handleCorrectAnswer = async () => {
		if (!currentPokemon) return;

		// Only stop the guess timer in hard mode
		if (gameState.isHardMode) {
			clearGuessTimer();
		}

		gameSetters.setIsCorrect(true);

		// Play correct sound effect
		await playCorrectSound();

		// Award a hint every 5 correct answers
		if ((gameState.score + 1) % 5 === 0) {
			gameSetters.setHintsLeft((prev) => prev + 1);
		}

		// Handle Hype Train logic only in hard mode
		if (gameState.isHardMode && gameState.guessTimeLeft >= 10) {
			gameSetters.setConsecutiveFastAnswers((prev) => {
				const newCount = prev + 1;
				// Start Hype Train when reaching 3 or more
				if (newCount >= 3) {
					gameSetters.setShowHypeTrain(true);
					gameSetters.setMaxHypeChain((prev) => Math.max(prev, newCount));
				}
				return newCount;
			});
		}

		let earnedPoints = 0;

		// Calculate points based on remaining time in Hard mode
		if (gameState.isHardMode) {
			if (currentPokemon?.isShiny) {
				earnedPoints = 5; // Always 5 points for shiny Pokemon
			} else {
				const maxTime = 15;
				const fastTime = 10;
				const mediumTime = 5;

				if (gameState.guessTimeLeft >= fastTime && gameState.guessTimeLeft <= maxTime) {
					earnedPoints = 3;
				} else if (gameState.guessTimeLeft >= mediumTime && gameState.guessTimeLeft < fastTime) {
					earnedPoints = 2;
				} else if (gameState.guessTimeLeft >= 0 && gameState.guessTimeLeft < mediumTime) {
					earnedPoints = 1;
				}
			}

			// Show special effects only if not in Hype Train
			if (!gameState.showHypeTrain) {
				// Show Succès Critique only at 0 seconds
				if (gameState.guessTimeLeft === 0) {
					gameSetters.setShowCriticalSuccess(true);
					gameSetters.setCriticalSuccessCount((prev) => prev + 1);
					setTimeout(() => {
						gameSetters.setShowCriticalSuccess(false);
					}, 2000);
					// Base point only for Succès Critique
					earnedPoints = currentPokemon?.isShiny ? 5 : 1;
				}
				// Show Coup Critique with 20% chance
				else if (Math.random() < 0.2) {
					gameSetters.setShowCriticalHit(true);
					gameSetters.setCriticalHitCount((prev) => prev + 1);
					setTimeout(() => {
						gameSetters.setShowCriticalHit(false);
					}, 2000);
					// Add 1 bonus point for Coup Critique (but keep 5 points for shiny)
					earnedPoints = currentPokemon?.isShiny ? 5 : earnedPoints + 1;
				}
			}
		} else {
			earnedPoints = currentPokemon?.isShiny ? 5 : 1;
		}

		// Always show points earned animation
		gameSetters.setPointsEarned(earnedPoints);
		setTimeout(() => {
			gameSetters.setPointsEarned(0);
		}, 1000);

		gameSetters.setScore((prev) => prev + earnedPoints);

		// Remove the current Pokemon from remainingPokemon
		if (currentPokemon) {
			gameSetters.setRemainingPokemon((prev) =>
				prev.filter((id) => id !== currentPokemon.id)
			);
		}

		// Check if this was the last Pokémon
		const isLastPokemon = gameState.remainingPokemon.length <= 1;

		if (isLastPokemon) {
			setTimeout(() => {
				handleGameOver();
			}, 1500);
		} else {
			// 1. Show the correct answer for 1 second
			await new Promise((resolve) => setTimeout(resolve, 1000));

			// 2. Clear current Pokemon and set loading state
			gameSetters.setCurrentPokemonId(null);
			gameSetters.setIsCorrect(null);
			gameSetters.setGuess("");
			gameSetters.setSuggestions([]);
			gameSetters.setShowHint(false);

			// Wait for states to be cleared
			await new Promise((resolve) => setTimeout(resolve, 50));

			// 3. Wait for loading state to be visible
			await new Promise((resolve) => setTimeout(resolve, 300));

			// 4. Select next Pokemon
			const nextPokemonId =
				gameState.remainingPokemon[
					Math.floor(Math.random() * gameState.remainingPokemon.length)
				];

			// 5. Update remaining pool
			gameSetters.setRemainingPokemon((prev) =>
				prev.filter((id) => id !== nextPokemonId)
			);

			// Wait for remaining pool to update
			await new Promise((resolve) => setTimeout(resolve, 50));

			// 6. Set new Pokemon
			gameSetters.setCurrentPokemonId(nextPokemonId);

			// 7. Reset timer to 15 seconds (we'll let startGuessTimer handle the shiny check)
			if (gameState.isHardMode) {
				startGuessTimer(gameSetters.setGuessTimeLeft);
			}

			// 8. Focus input
			inputRef.current?.focus();
		}
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
		// Handle right arrow for hint regardless of suggestions
		if (e.key === "ArrowRight") {
			e.preventDefault();
			if (gameState.hintsLeft > 0 && currentPokemon) {
				gameSetters.setShowHint(true);
				gameSetters.setHintsLeft((prev) => prev - 1);
			}
			return;
		}

		if (e.key === "Enter") {
			e.preventDefault();
			if (gameState.suggestions.length > 0 && gameState.highlightedIndex >= 0) {
				handleSuggestionClick(gameState.suggestions[gameState.highlightedIndex]);
			} else if (gameState.guess.trim()) {
				handleSuggestionClick(gameState.guess);
			}
			return;
		}

		if (gameState.suggestions.length === 0) {
			return;
		}

		if (e.key === "ArrowDown") {
			e.preventDefault();
			gameSetters.setHighlightedIndex((prevIndex) => {
				const newIndex =
					prevIndex < gameState.suggestions.length - 1 ? prevIndex + 1 : 0;
				return newIndex;
			});
		} else if (e.key === "ArrowUp") {
			e.preventDefault();
			gameSetters.setHighlightedIndex((prevIndex) => {
				const newIndex =
					prevIndex > 0 ? prevIndex - 1 : gameState.suggestions.length - 1;
				return newIndex;
			});
		}
	};

	const useHint = () => {
		if (gameState.hintsLeft > 0 && currentPokemon) {
			gameSetters.setShowHint(true);
			gameSetters.setHintsLeft((prev) => prev - 1);
		}
	};

	// Add effect to handle invalid Pokemon data
	useEffect(() => {
		// Only handle invalid data if we have a currentPokemonId and the game is active
		if (
			gameState.isGameActive &&
			!isPokemonLoading &&
			gameState.currentPokemonId !== null &&
			gameState.remainingPokemon.length > 0 &&
			(currentPokemon === undefined ||
				currentPokemon?.englishName === undefined ||
				currentPokemon?.frenchName === undefined)
		) {
			// Reset the current Pokemon ID to trigger a new fetch
			gameSetters.setCurrentPokemonId(null);
			// Add the ID back to the remaining pool
			gameSetters.setRemainingPokemon((prev) => [
				...prev,
				gameState.currentPokemonId!,
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

	const formatTimeForRanking = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	const formatDate = (timestamp: Date): string => {
		const date = new Date(timestamp);
		const day = String(date.getDate()).padStart(2, "0");
		const month = String(date.getMonth() + 1).padStart(2, "0");
		return `${day}/${month}/${date.getFullYear()}`;
	};

	const handleGenerationSelect = (generation: Generation) => {
		gameSetters.setSelectedGeneration(generation);
		// Reset game state
		gameSetters.setScore(0);
		gameSetters.setGuess("");
		gameSetters.setSuggestions([]);
		gameSetters.setIsCorrect(null);
		gameSetters.setShowHint(false);
	};

	const handleQuit = useCallback(() => {
		// Set timer to 0 to trigger name reveal
		gameSetters.setGuessTimeLeft(0);
		// Set isCorrect to false to show the name
		gameSetters.setIsCorrect(false);
		// Wait a moment to show the name before game over
		setTimeout(() => {
			handleGameOver();
		}, 2000);
	}, [gameSetters]);

	const handleRestart = () => {
		// Clean up all audio first
				cleanupAllAudio();

		// Reset all Pokemon-related states first
		gameSetters.setCurrentPokemonId(null);
		gameSetters.setIsCorrect(null);
		gameSetters.setGuess("");
		gameSetters.setSuggestions([]);
		gameSetters.setShowHint(false);
		gameSetters.setGameOver(false);
		gameSetters.setRewardPokemon({ pokemon: undefined, isLoading: false });
		gameSetters.setPointsEarned(0);
		gameSetters.setShowCriticalSuccess(false);
		gameSetters.setShowCriticalHit(false);
		gameSetters.setShowHypeTrain(false);
		gameSetters.setConsecutiveFastAnswers(0);
		gameSetters.setCriticalHitCount(0);
		gameSetters.setCriticalSuccessCount(0);
		gameSetters.setHyperTrainCount(0);
		gameSetters.setMaxHypeChain(0);

		// Set restarting state to true
		gameSetters.setIsRestarting(true);

		// Start a new game with the same mode immediately
		startGame(gameState.isHardMode);
	};

	const handleBackToMenu = () => {
		// Stop any ongoing timers
		stopAllTimers();

		// Clean up all audio
		cleanupAllAudio();

		// Reset all game states
		gameSetters.setIsGameActive(false);
		gameSetters.setGameOver(false);
		gameSetters.setScore(0);
		gameSetters.setHintsLeft(10);
		gameSetters.setIsCorrect(null);
		gameSetters.setGuess("");
		gameSetters.setSuggestions([]);
		gameSetters.setShowHint(false);
		gameSetters.setConsecutiveFastAnswers(0);
		gameSetters.setShowHypeTrain(false);
		gameSetters.setCriticalHitCount(0);
		gameSetters.setCriticalSuccessCount(0);
		gameSetters.setHyperTrainCount(0);
		gameSetters.setMaxHypeChain(0);
		gameSetters.setTotalTimeElapsed(0);
		gameSetters.setCurrentPokemonId(null);
		gameSetters.setRewardPokemon({ pokemon: undefined, isLoading: false });
		gameSetters.setPointsEarned(0);
		gameSetters.setShowCriticalSuccess(false);
		gameSetters.setShowCriticalHit(false);
	};

	const startGame = async (isHardMode: boolean) => {
		if (!playerName) return;

		const exactName = playerName.trim();
		const savedName = localStorage.getItem("pokemonGamePlayerName");

		// Skip name validation if:
		// 1. User is authenticated OR
		// 2. We're restarting OR
		// 3. The name is the same as the saved name
		const shouldSkipValidation =
			auth.currentUser || gameState.isRestarting || exactName === savedName;

		if (!shouldSkipValidation) {
			const isAvailable = await checkNameAvailability(exactName);
			if (!isAvailable) return;
		}

		// If it's a new user (different from saved name), clean up localStorage
		if (savedName !== exactName) {
			localStorage.clear();
			localStorage.setItem("pokemonGamePlayerName", exactName);
		}

		// Ensure we're in restarting state
		gameSetters.setIsRestarting(true);

		try {
			// Stop any existing timers and clean up audio
			stopAllTimers();
			cleanupAllAudio();

			// Reset all game states
			gameSetters.setIsHardMode(isHardMode);
			gameSetters.setScore(0);
			gameSetters.setHintsLeft(isHardMode ? 0 : Number.POSITIVE_INFINITY);
			gameSetters.setGuessTimeLeft(isHardMode ? 15 : Number.POSITIVE_INFINITY);
			gameSetters.setTotalTimeElapsed(0);
			gameSetters.setGameOver(false);
			gameSetters.setUserRanking(null);
			gameSetters.setHighlightedIndex(-1);
			gameSetters.setConsecutiveFastAnswers(0);
			gameSetters.setShowHypeTrain(false);
			gameSetters.setPointsEarned(0);
			gameSetters.setCurrentPokemonId(null);
			gameSetters.setIsCorrect(null);
			gameSetters.setGuess("");
			gameSetters.setSuggestions([]);
			gameSetters.setShowHint(false);
			gameSetters.setRewardPokemon({
				pokemon: undefined,
				isLoading: true,
			});

			// Initialize Pokémon list for selected generation
			const allPokemonIds = Array.from(
				{
					length:
						gameState.selectedGeneration.endId -
						gameState.selectedGeneration.startId +
						1,
				},
				(_, i) => gameState.selectedGeneration.startId + i
			);

			// Set initial state and wait for it to be updated
			gameSetters.setRemainingPokemon(allPokemonIds);

			// Add a delay to ensure state is updated
			await new Promise((resolve) => setTimeout(resolve, 100));

			// Set game active and start timers
			gameSetters.setIsGameActive(true);
			startTotalTimer(gameSetters.setTotalTimeElapsed);
			if (isHardMode) {
				startGuessTimer(gameSetters.setGuessTimeLeft);
			}

			// Start the game by fetching first Pokemon
			const randomIndex = Math.floor(Math.random() * allPokemonIds.length);
			const firstPokemonId = allPokemonIds[randomIndex];

			// Remove the first Pokémon from the pool before setting it
			gameSetters.setRemainingPokemon((prev) =>
				prev.filter((id) => id !== firstPokemonId)
			);

			// Finally set the current Pokemon ID
			gameSetters.setCurrentPokemonId(firstPokemonId);

			// Focus the input
			if (inputRef.current) {
				inputRef.current.focus();
			}
		} catch (error) {
			console.error("Error starting game:", error);
		} finally {
			gameSetters.setIsRestarting(false);
		}
	};

	// Add effect to handle mute state persistence
	useEffect(() => {
		localStorage.setItem("pokemonGameMuted", JSON.stringify(gameState.isMuted));
	}, [gameState.isMuted]);

	// Add effect to auto-focus when pokemon changes
	useEffect(() => {
		if (gameState.isGameActive && inputRef.current) {
			inputRef.current.focus();
		}
	}, [currentPokemon, gameState.isGameActive]);

	const handleGameOver = useCallback(async () => {
		if (gameState.gameOver) {
			return;
		}

		try {
			// Stop all timers immediately
			stopAllTimers();

			// Show the correct Pokemon first
			gameSetters.setIsCorrect(true);

			// Wait for the reveal animation and give time to see the name
			await new Promise((resolve) => setTimeout(resolve, 3000));

			// Update states
			gameSetters.setIsGameActive(false);
			gameSetters.setGameOver(true);

			// Calculate rankings
			await calculateRankings(gameState.score, gameState.totalTimeElapsed);

			// Set reward Pokemon
			if (currentPokemon) {
				gameSetters.setRewardPokemon({
					pokemon: currentPokemon,
					isLoading: false
				});
			}

			// Clean up any existing audio
		cleanupAllAudio();

			// Play victory sound
			await playVictorySound();
		} catch (error) {
			console.error("Error handling game over:", error);
		}
	}, [
		gameState.gameOver,
		gameState.score,
		gameState.totalTimeElapsed,
		currentPokemon,
		gameSetters,
		stopAllTimers,
		calculateRankings,
		cleanupAllAudio,
		playVictorySound,
	]);

	// Add effect to handle game over conditions
	useEffect(() => {
		if (
			gameState.isGameActive &&
			(gameState.guessTimeLeft <= 0 || gameState.remainingPokemon.length === 0)
		) {
			handleGameOver();
		}
	}, [
		gameState.guessTimeLeft,
		gameState.remainingPokemon.length,
		gameState.isGameActive,
		handleGameOver,
	]);

	return (
		<div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 p-4 flex items-start sm:items-center justify-center font-oswald">
			{gameState.isGameActive ? (
				<GameScreen
					currentPokemon={gameState.isRestarting ? undefined : gameState.currentPokemon}
					isPokemonLoading={gameState.isRestarting || isPokemonLoading}
					isCorrect={gameState.isCorrect}
					score={gameState.score}
					bestScore={bestScore}
					bestTime={bestTime}
					guessTimeLeft={gameState.guessTimeLeft}
					hintsLeft={gameState.hintsLeft}
					guess={gameState.guess}
					handleGuessChange={handleGuessChange}
					handleKeyDown={handleKeyDown}
					suggestions={gameState.suggestions}
					handleSuggestionClick={handleSuggestionClick}
					highlightedIndex={gameState.highlightedIndex}
					showHint={gameState.showHint}
					useHint={useHint}
					inputRef={inputRef}
					suggestionsRef={suggestionsRef}
					formatTime={formatTimeForRanking}
					isMuted={gameState.isMuted}
					setIsMuted={gameSetters.setIsMuted}
					totalTimeElapsed={gameState.totalTimeElapsed}
					onQuit={handleQuit}
					isHardMode={gameState.isHardMode}
					showCriticalSuccess={gameState.showCriticalSuccess}
					showCriticalHit={gameState.showCriticalHit}
					showHypeTrain={gameState.showHypeTrain}
					consecutiveFastAnswers={gameState.consecutiveFastAnswers}
					pointsEarned={gameState.pointsEarned}
					remainingCount={gameState.remainingPokemon.length}
					totalCount={
						gameState.selectedGeneration.endId -
						gameState.selectedGeneration.startId +
						1
					}
				/>
			) : (
				<MenuScreen
					playerName={playerName}
					handlePlayerNameChange={handlePlayerNameChange}
					nameError={nameError}
					selectedGeneration={gameState.selectedGeneration}
					handleGenerationSelect={handleGenerationSelect}
					GENERATIONS={GENERATIONS}
					canStartGame={Boolean(
						(playerName && !nameError && !isCheckingName) ||
							(savedName && playerName === savedName) ||
							(playerName && isAuthName)
					)}
					startGame={startGame}
					score={gameState.score}
					bestScore={bestScore}
					isMuted={gameState.isMuted}
					setIsMuted={gameSetters.setIsMuted}
					rankings={rankings}
					formatTimeForRanking={formatTimeForRanking}
					formatDate={formatDate}
					checkNameAvailability={checkNameAvailability}
				/>
			)}

			<GameOverDialog
				gameOver={gameState.gameOver}
				setGameOver={gameSetters.setGameOver}
				playerName={playerName}
				score={gameState.score}
				bestScore={bestScore}
				bestTime={bestTime}
				userRanking={userRanking}
				bestRanking={bestRanking}
				totalTimeElapsed={gameState.totalTimeElapsed}
				formatTimeForRanking={formatTimeForRanking}
				rewardPokemon={gameState.rewardPokemon}
				remainingPokemon={gameState.remainingPokemon}
				handleRestart={handleRestart}
				handleBackToMenu={handleBackToMenu}
				isMuted={gameState.isMuted}
				criticalHitCount={gameState.criticalHitCount}
				criticalSuccessCount={gameState.criticalSuccessCount}
				hyperTrainCount={gameState.hyperTrainCount}
				maxHypeChain={gameState.maxHypeChain}
				selectedGeneration={gameState.selectedGeneration}
			/>
		</div>
	);
};

export default PokemonGame;
