import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import type { useGetPokemonByIdQuery } from "@/services/pokemonApi";
import type { KeyboardEvent, RefObject } from "react";
import { useTranslation } from "react-i18next";
import { useMultiplayerGameCore } from "./useMultiplayerGameCore";
import { useMultiplayerGameEffects } from "./useMultiplayerGameEffects";
import { useMultiplayerGameHandlers } from "./useMultiplayerGameHandlers";
import { useMultiplayerGameQueries } from "./useMultiplayerGameQueries";

interface UseMultiplayerGameControllerParams {
	room: MultiplayerRoom;
	localPlayerId: string;
	isHost: boolean;
}

interface UseMultiplayerGameControllerResult {
	guess: string;
	suggestions: string[];
	highlightedIndex: number;
	isCorrect: boolean | null;
	guessTimeLeft: number;
	totalTimeElapsed: number;
	isMuted: boolean;
	setIsMuted: (muted: boolean) => void;
	localScore: number;
	opponentScore: number;
	hostScore: number;
	guestScore: number;
	hostName: string;
	guestName: string;
	hostPlayerId: string;
	localPlayerName: string;
	opponentName: string;
	roundNumber: number;
	submitError: string | null;
	roundWinnerName: string | null;
	roundPointsEarned: number;
	isPokemonLoading: boolean;
	currentPokemon: ReturnType<typeof useGetPokemonByIdQuery>["data"];
	remainingCount: number;
	totalCount: number;
	showCriticalSuccess: boolean;
	showCriticalHit: boolean;
	pointsEarned: number;
	inputRef: RefObject<HTMLInputElement>;
	suggestionsRef: RefObject<HTMLDivElement>;
	handleGuessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
	handleSuggestionClick: (suggestion: string) => void;
	handleQuit: () => void;
	handleStartGame: () => Promise<void>;
	isStartingGame: boolean;
	startGameError: string | null;
}

export const useMultiplayerGameController = ({
	room,
	localPlayerId,
	isHost,
}: UseMultiplayerGameControllerParams): UseMultiplayerGameControllerResult => {
	const { i18n } = useTranslation();
	const core = useMultiplayerGameCore();

	const queries = useMultiplayerGameQueries({
		room,
		localPlayerId,
		optimisticScores: core.state.optimisticScores,
	});

	useMultiplayerGameEffects({
		room,
		localPlayerId,
		isHost,
		gameState: queries.gameState,
		isShiny: queries.isShiny,
		currentPokemon: queries.currentPokemon,
		roundNumber: queries.roundNumber,
		setters: core.setters,
		refs: core.refs,
	});

	const handlers = useMultiplayerGameHandlers({
		room,
		localPlayerId,
		isHost,
		language: i18n.language,
		gameState: queries.gameState,
		state: core.state,
		setters: core.setters,
		apiPokemonNames: queries.apiPokemonNames,
		currentPokemon: queries.currentPokemon,
		isPokemonLoading: queries.isPokemonLoading,
		isShiny: queries.isShiny,
		playCorrectSound: core.playCorrectSound,
		playWrongSound: core.playWrongSound,
		submitErrorTimeoutRef: core.refs.submitErrorTimeoutRef,
	});

	const roundWinnerName =
		queries.gameState?.roundWinnerId == null
			? null
			: room.players.find((player) => player.id === queries.gameState?.roundWinnerId)?.name ?? null;

	return {
		guess: core.state.guess,
		suggestions: core.state.suggestions,
		highlightedIndex: core.state.highlightedIndex,
		isCorrect: core.state.isCorrect,
		guessTimeLeft: core.state.guessTimeLeft,
		totalTimeElapsed: core.state.totalTimeElapsed,
		isMuted: core.state.isMuted,
		setIsMuted: core.setters.setIsMuted,
		localScore: queries.localScore,
		opponentScore: queries.opponentScore,
		hostScore: queries.hostScore,
		guestScore: queries.guestScore,
		hostName: queries.hostName,
		guestName: queries.guestName,
		hostPlayerId: queries.hostPlayerId,
		localPlayerName: queries.localPlayerName,
		opponentName: queries.opponentName,
		roundNumber: queries.roundNumber,
		submitError: core.state.submitError,
		roundWinnerName,
		roundPointsEarned: queries.roundPointsEarned,
		isPokemonLoading: queries.isPokemonLoading,
		currentPokemon: queries.currentPokemon,
		remainingCount: queries.remainingCount,
		totalCount: queries.totalCount,
		showCriticalSuccess: core.state.showCriticalSuccess,
		showCriticalHit: core.state.showCriticalHit,
		pointsEarned: core.state.pointsEarned,
		inputRef: core.refs.inputRef,
		suggestionsRef: core.refs.suggestionsRef,
		handleGuessChange: handlers.handleGuessChange,
		handleKeyDown: handlers.handleKeyDown,
		handleSuggestionClick: handlers.handleSuggestionClick,
		handleQuit: handlers.handleQuit,
		handleStartGame: handlers.handleStartGame,
		isStartingGame: core.state.isStartingGame,
		startGameError: core.state.startGameError,
	};
};
