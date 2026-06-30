import { buildGuessSuggestions } from "@/components/pokemon-game/guessSuggestions";
import type { Pokemon } from "@/components/pokemon-game/types";
import {
	resolveGuessChangeHighlightedIndex,
	resolveSuggestionSubmission,
} from "@/hooks/pokemonGameHandlerLogic";
import { convertToStoredFormat } from "@/hooks/playerNameUtils";
import {
	startGame,
	submitCorrectGuess,
	transferHost,
} from "@/services/multiplayerRoomService";
import { resolveMultiplayerRoundScoring } from "@/services/multiplayerRoundScoring";
import type { MultiplayerGameState, MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import { useCallback, type KeyboardEvent, type RefObject } from "react";
import { useNavigate } from "react-router-dom";
import { computeGuessTimeLeft } from "./multiplayerGameHandlerLogic";
import type {
	MultiplayerGameCoreSetters,
	MultiplayerGameCoreState,
} from "./useMultiplayerGameCore";

const ROUND_TRANSITION_MS = 1000;

interface UseMultiplayerGameHandlersParams {
	room: MultiplayerRoom;
	localPlayerId: string;
	isHost: boolean;
	language: string;
	gameState: MultiplayerGameState | undefined;
	state: MultiplayerGameCoreState;
	setters: MultiplayerGameCoreSetters;
	apiPokemonNames: string[];
	currentPokemon: Pokemon | undefined;
	isPokemonLoading: boolean;
	isShiny: boolean;
	playCorrectSound: () => Promise<void>;
	playWrongSound: () => Promise<void>;
	submitErrorTimeoutRef: RefObject<ReturnType<typeof setTimeout> | null>;
}

export interface UseMultiplayerGameHandlersResult {
	handleGuessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
	handleSuggestionClick: (suggestion: string) => void;
	handleQuit: () => void;
	handleStartGame: () => Promise<void>;
}

export const useMultiplayerGameHandlers = ({
	room,
	localPlayerId,
	isHost,
	language,
	gameState,
	state,
	setters,
	apiPokemonNames,
	currentPokemon,
	isPokemonLoading,
	isShiny,
	playCorrectSound,
	playWrongSound,
	submitErrorTimeoutRef,
}: UseMultiplayerGameHandlersParams): UseMultiplayerGameHandlersResult => {
	const navigate = useNavigate();
	const {
		setGuess,
		setSuggestions,
		setHighlightedIndex,
		setIsCorrect,
		setShowCriticalSuccess,
		setShowCriticalHit,
		setPointsEarned,
		setOptimisticScores,
		setSubmitError,
		setIsStartingGame,
		setStartGameError,
	} = setters;

	const showSubmitError = useCallback(
		(errorKey: string): void => {
			setSubmitError(errorKey);
			if (submitErrorTimeoutRef.current) {
				clearTimeout(submitErrorTimeoutRef.current);
			}
			submitErrorTimeoutRef.current = setTimeout(() => {
				setSubmitError(null);
			}, 2000);
		},
		[setSubmitError, submitErrorTimeoutRef],
	);

	const submitGuess = useCallback(
		async (suggestion: string): Promise<void> => {
			if (!gameState || room.status !== "playing") {
				return;
			}

			const submission = resolveSuggestionSubmission(
				computeGuessTimeLeft(
					gameState.roundStartedAt,
					gameState.roundDurationSeconds,
				),
				isPokemonLoading,
				suggestion,
				currentPokemon?.frenchName,
				currentPokemon?.englishName,
				convertToStoredFormat,
			);

			if (submission.type === "skip") {
				return;
			}

			if (submission.type === "wrong") {
				setIsCorrect(false);
				void playWrongSound();
				setTimeout(() => setIsCorrect(null), 500);
				return;
			}

			const scoring = resolveMultiplayerRoundScoring(gameState, isShiny);

			try {
				const result = await submitCorrectGuess(
					room.id,
					localPlayerId,
					isShiny,
				);

				if (result.type === "won_round") {
					setOptimisticScores((previous) => ({
						...previous,
						...result.scores,
					}));
					void playCorrectSound();
					setIsCorrect(true);
					setShowCriticalSuccess(scoring.showCriticalSuccess);
					setShowCriticalHit(scoring.showCriticalHit);
					setPointsEarned(result.pointsEarned);
					setTimeout(() => {
						setIsCorrect(null);
						setShowCriticalSuccess(false);
						setShowCriticalHit(false);
					}, ROUND_TRANSITION_MS);
					return;
				}

				if (result.type === "already_resolved") {
					showSubmitError("multiGuessTooLate");
				}
			} catch {
				showSubmitError("multiGuessFailed");
			}
		},
		[
			gameState,
			room.status,
			room.id,
			isPokemonLoading,
			currentPokemon,
			isShiny,
			localPlayerId,
			showSubmitError,
			playCorrectSound,
			playWrongSound,
			setIsCorrect,
			setOptimisticScores,
			setShowCriticalSuccess,
			setShowCriticalHit,
			setPointsEarned,
		],
	);

	const handleGuessChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>): void => {
			const value = e.target.value;
			setGuess(value);

			if (value.length === 0) {
				setSuggestions([]);
				setHighlightedIndex(-1);
				return;
			}

			const nextSuggestions = buildGuessSuggestions({
				value,
				pokemonList: apiPokemonNames,
				startId: room.selectedGeneration.startId,
				endId: room.selectedGeneration.endId,
				language,
				normalizeName: convertToStoredFormat,
			});
			setSuggestions(nextSuggestions);
			setHighlightedIndex(
				resolveGuessChangeHighlightedIndex(value.length, nextSuggestions.length),
			);
		},
		[
			apiPokemonNames,
			language,
			room.selectedGeneration,
			setGuess,
			setHighlightedIndex,
			setSuggestions,
		],
	);

	const handleSuggestionClick = useCallback(
		(suggestion: string): void => {
			void submitGuess(suggestion);
		},
		[submitGuess],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>): void => {
			if (e.key === "Enter") {
				e.preventDefault();
				if (state.suggestions.length > 0 && state.highlightedIndex >= 0) {
					const suggestion = state.suggestions[state.highlightedIndex];
					if (suggestion) {
						void submitGuess(suggestion);
					}
					return;
				}
				if (state.guess.trim()) {
					void submitGuess(state.guess.trim());
				}
				return;
			}
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setHighlightedIndex((prev) =>
					state.suggestions.length === 0
						? -1
						: Math.min(prev + 1, state.suggestions.length - 1),
				);
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setHighlightedIndex((prev) => Math.max(prev - 1, -1));
			}
		},
		[
			state.suggestions,
			state.highlightedIndex,
			state.guess,
			submitGuess,
			setHighlightedIndex,
		],
	);

	const handleQuit = useCallback((): void => {
		if (isHost) {
			void transferHost(room.id, localPlayerId);
		}
		navigate("/");
	}, [isHost, room.id, localPlayerId, navigate]);

	const handleStartGame = useCallback(async (): Promise<void> => {
		if (!isHost) {
			return;
		}
		setIsStartingGame(true);
		setStartGameError(null);
		try {
			await startGame(room.id, localPlayerId, false);
		} catch (error: unknown) {
			if (error instanceof Error) {
				setStartGameError(error.message);
			} else {
				setStartGameError("multiplayerStartFailed");
			}
		} finally {
			setIsStartingGame(false);
		}
	}, [isHost, localPlayerId, room.id, setIsStartingGame, setStartGameError]);

	return {
		handleGuessChange,
		handleKeyDown,
		handleSuggestionClick,
		handleQuit,
		handleStartGame,
	};
};
