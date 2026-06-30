import { GENERATIONS } from "./generations";
import { MenuScreen } from "./MenuScreen";
import { resolveCanStartGame } from "./pokemonGameMenuLogic";
import { GameScreen } from "./GameScreen";
import {
	formatRankingDate,
	formatTimeForRanking,
} from "../../utils/gameFormatters";
import type { usePokemonGameController } from "../../hooks/usePokemonGameController";

type Controller = ReturnType<typeof usePokemonGameController>;

interface PokemonGameActiveLayoutProps {
	controller: Controller;
}

export const PokemonGameActiveLayout = ({
	controller,
}: PokemonGameActiveLayoutProps): JSX.Element => {
	const { gameState, gameSetters } = controller;

	return (
		<GameScreen
			currentPokemon={
				gameState.isRestarting ? undefined : gameState.currentPokemon
			}
			isPokemonLoading={
				gameState.isRestarting || controller.isPokemonLoading
			}
			isCorrect={gameState.isCorrect}
			score={gameState.score}
			bestScore={controller.bestScore}
			bestTime={controller.bestTime}
			guessTimeLeft={gameState.guessTimeLeft}
			hintsLeft={gameState.hintsLeft}
			guess={gameState.guess}
			handleGuessChange={controller.handleGuessChange}
			handleKeyDown={controller.handleKeyDown}
			suggestions={gameState.suggestions}
			handleSuggestionClick={controller.handleSuggestionClick}
			highlightedIndex={gameState.highlightedIndex}
			showHint={gameState.showHint}
			useHint={controller.useHint}
			inputRef={controller.inputRef}
			suggestionsRef={controller.suggestionsRef}
			formatTime={formatTimeForRanking}
			isMuted={gameState.isMuted}
			setIsMuted={gameSetters.setIsMuted}
			totalTimeElapsed={gameState.totalTimeElapsed}
			onQuit={controller.handleQuit}
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
	);
};

interface PokemonGameMenuLayoutProps {
	controller: Controller;
}

export const PokemonGameMenuLayout = ({
	controller,
}: PokemonGameMenuLayoutProps): JSX.Element => {
	const { gameState, gameSetters } = controller;

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
