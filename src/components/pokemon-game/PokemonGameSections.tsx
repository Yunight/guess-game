import { GENERATIONS } from "./generations";
import { MenuScreen } from "./MenuScreen";
import { resolveCanStartGame } from "./pokemonGameMenuLogic";
import { GameScreen } from "./GameScreen";
import { buildGameScreenViewProps } from "./gameScreenViewProps";
import { formatRankingDate, formatTimeForRanking } from "../../utils/gameFormatters";
import type { usePokemonGameController } from "../../hooks/usePokemonGameController";
import { useCallback, useState, type ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import { createRoom } from "@/services/multiplayerRoomService";
import { createRoomPlayerId } from "@/services/multiplayerPlayerId";

type Controller = ReturnType<typeof usePokemonGameController>;

interface PokemonGameActiveLayoutProps {
	controller: Controller;
}

export const PokemonGameActiveLayout = ({
	controller,
}: PokemonGameActiveLayoutProps): ReactNode => {
	const { t } = useTranslation();
	const { gameState, gameSetters } = controller;
	const criticalSuccessLabel = t("criticalSuccess");
	const criticalHitLabel = t("criticalHit");
	const hypeTrainLabel = t("hypeTrain", {
		count: gameState.consecutiveFastAnswers,
	});

	return (
		<GameScreen
			{...buildGameScreenViewProps({
				currentPokemon: gameState.isRestarting ? undefined : gameState.currentPokemon,
				isPokemonLoading: gameState.isRestarting || controller.isPokemonLoading,
				isCorrect: gameState.isCorrect,
				isMuted: gameState.isMuted,
				setIsMuted: gameSetters.setIsMuted,
				isHardMode: gameState.isHardMode,
				showCriticalSuccess: gameState.showCriticalSuccess,
				showCriticalHit: gameState.showCriticalHit,
				showHypeTrain: gameState.showHypeTrain,
				consecutiveFastAnswers: gameState.consecutiveFastAnswers,
				totalTimeElapsed: gameState.totalTimeElapsed,
				formatTime: formatTimeForRanking,
				onQuit: controller.handleQuit,
				pointsEarned: gameState.pointsEarned,
				guessTimeLeft: gameState.guessTimeLeft,
				remainingCount: gameState.remainingPokemon.length,
				totalCount: gameState.selectedGeneration.endId - gameState.selectedGeneration.startId + 1,
				criticalSuccessLabel,
				criticalHitLabel,
				hypeTrainLabel,
				controlsSection: {
					currentPokemon: gameState.isRestarting ? undefined : gameState.currentPokemon,
					isPokemonLoading: gameState.isRestarting || controller.isPokemonLoading,
					isCorrect: gameState.isCorrect,
					score: gameState.score,
					bestScore: controller.bestScore,
					bestTime: controller.bestTime,
					guessTimeLeft: gameState.guessTimeLeft,
					hintsLeft: gameState.hintsLeft,
					guess: gameState.guess,
					handleGuessChange: controller.handleGuessChange,
					handleKeyDown: controller.handleKeyDown,
					suggestions: gameState.suggestions,
					handleSuggestionClick: controller.handleSuggestionClick,
					highlightedIndex: gameState.highlightedIndex,
					showHint: gameState.showHint,
					useHint: controller.useHint,
					inputRef: controller.inputRef,
					suggestionsRef: controller.suggestionsRef,
					formatTime: formatTimeForRanking,
					isMuted: gameState.isMuted,
					remainingCount: gameState.remainingPokemon.length,
					totalCount: gameState.selectedGeneration.endId - gameState.selectedGeneration.startId + 1,
					showCriticalSuccess: gameState.showCriticalSuccess,
					showCriticalHit: gameState.showCriticalHit,
					showHypeTrain: gameState.showHypeTrain,
					consecutiveFastAnswers: gameState.consecutiveFastAnswers,
					criticalSuccessLabel,
					criticalHitLabel,
					hypeTrainLabel,
				},
			})}
		/>
	);
};

interface PokemonGameMenuLayoutProps {
	controller: Controller;
}

export const PokemonGameMenuLayout = ({ controller }: PokemonGameMenuLayoutProps): ReactNode => {
	const { gameState, gameSetters } = controller;
	const navigate = useNavigate();
	const [isCreatingMultiRoom, setIsCreatingMultiRoom] = useState(false);
	const [multiError, setMultiError] = useState<string | null>(null);

	const handleStartMulti = useCallback(async (): Promise<void> => {
		setMultiError(null);
		setIsCreatingMultiRoom(true);
		try {
			const playerName = controller.playerName.trim();
			const roomId = await createRoom(playerName, gameState.selectedGeneration);
			createRoomPlayerId(roomId);
			navigate(`/multi/${roomId}`);
		} catch (error: unknown) {
			if (error instanceof Error) {
				setMultiError(error.message);
			} else {
				setMultiError("multiplayerCreateFailed");
			}
		} finally {
			setIsCreatingMultiRoom(false);
		}
	}, [controller.playerName, gameState.selectedGeneration, navigate]);

	return (
		<MenuScreen
			player={{
				playerName: controller.playerName,
				nameError: controller.nameError,
				onPlayerNameChange: controller.handlePlayerNameChange,
				checkNameAvailability: controller.checkNameAvailability,
			}}
			generation={{
				selectedGeneration: gameState.selectedGeneration,
				generations: GENERATIONS,
				onGenerationSelect: controller.handleGenerationSelect,
			}}
			canStartGame={resolveCanStartGame({
				playerName: controller.playerName,
				nameError: controller.nameError,
				isCheckingName: controller.isCheckingName,
				savedName: controller.savedName,
				isAuthName: controller.isAuthName,
			})}
			startGame={controller.startGame}
			onStartMulti={() => void handleStartMulti()}
			isCreatingMultiRoom={isCreatingMultiRoom}
			multiError={multiError}
			score={gameState.score}
			audio={{
				isMuted: gameState.isMuted,
				setIsMuted: gameSetters.setIsMuted,
			}}
			rankings={{
				rankings: controller.rankings,
				rankingError: controller.rankingError,
				formatTimeForRanking,
				formatDate: formatRankingDate,
			}}
		/>
	);
};
