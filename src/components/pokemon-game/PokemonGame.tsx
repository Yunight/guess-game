import { skipToken } from "@reduxjs/toolkit/query";

import { useCallback, useEffect, useRef, useState } from "react";

import { useTranslation } from "react-i18next";

import { useGameAudio } from "../../hooks/useGameAudio";

import { useGameState } from "../../hooks/useGameState";

import { useGameTimers } from "../../hooks/useGameTimers";

import { usePlayerName } from "../../hooks/usePlayerName";

import { usePokemonGameEffects } from "../../hooks/usePokemonGameEffects";
import { usePokemonGameHandlers } from "../../hooks/usePokemonGameHandlers";

import { useRankings } from "../../hooks/useRankings";

import { useSlotMachine } from "../../hooks/useSlotMachine";

import {
	useGetAllPokemonNamesQuery,
	useGetPokemonByIdQuery,
} from "../../services/pokemonApi";

import {
	formatRankingDate,
	formatTimeForRanking,
} from "../../utils/gameFormatters";

import { GameOverDialog } from "./GameOverDialog";

import { GameScreen } from "./GameScreen";
import { GENERATIONS } from "./generations";
import { MenuScreen } from "./MenuScreen";
import { PokemonGameDevTools } from "./PokemonGameDevTools";

import "../../styles/PokemonGame.css";

const PokemonGame = (): JSX.Element => {
	const { i18n } = useTranslation();

	const inputRef = useRef<HTMLInputElement>(null);

	const suggestionsRef = useRef<HTMLDivElement>(null);

	const savedName = localStorage.getItem("pokemonGamePlayerName");

	const [rewardPokemonId, setRewardPokemonId] = useState<number | null>(null);

	const { state: gameState, setters: gameSetters } = useGameState(
		GENERATIONS[0],
	);

	const {
		isSlotMachineRunning,

		spinningPokemonId,

		runSlotMachineEffect,

		resetSlotMachine,
	} = useSlotMachine(gameState.selectedGeneration);

	const {
		playerName,

		nameError,

		isCheckingName,

		isAuthName,

		handlePlayerNameChange,

		checkNameAvailability,

		convertToStoredFormat,
	} = usePlayerName({ GENERATIONS });

	const {
		rankings,

		bestScore,

		bestTime,

		userRanking,

		bestRanking,

		rankingError,

		saveRanking,
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

		gameState.guessTimeLeft,
	);

	const handleWrongAnswer = useCallback(() => {
		gameSetters.setIsCorrect(false);

		void playWrongSound();
	}, [gameSetters, playWrongSound]);

	const { startGuessTimer, startTotalTimer, stopAllTimers, clearGuessTimer } =
		useGameTimers(
			gameState.isGameActive,

			gameState.isHardMode,

			gameState.currentPokemon?.isShiny,

			{
				onGuessTimeEnd: handleWrongAnswer,

				onTotalTimeUpdate: (time) => {
					gameSetters.setTotalTimeElapsed(time);
				},
			},
		);

	const { data: apiPokemonNames = [] } = useGetAllPokemonNamesQuery(
		gameState.isGameActive
			? {
					startId: gameState.selectedGeneration.startId,

					endId: gameState.selectedGeneration.endId,

					maxHypeChain: gameState.maxHypeChain,
				}
			: skipToken,

		{
			refetchOnMountOrArgChange: false,

			refetchOnFocus: false,

			refetchOnReconnect: false,
		},
	);

	const { data: currentPokemon, isLoading: isPokemonLoading } =
		useGetPokemonByIdQuery(
			gameState.currentPokemonId
				? {
						id: gameState.currentPokemonId,

						maxHypeChain: gameState.maxHypeChain,
					}
				: skipToken,

			{
				skip: !gameState.currentPokemonId || !gameState.isGameActive,

				refetchOnMountOrArgChange: false,

				refetchOnFocus: false,

				refetchOnReconnect: false,
			},
		);

	useEffect(() => {
		if (currentPokemon) {
			gameSetters.setCurrentPokemon(currentPokemon);
		}
	}, [currentPokemon, gameSetters]);

	const {
		handleSuggestionClick,

		handleGuessChange,

		handleKeyDown,

		useHint,

		handleGenerationSelect,

		handleQuit,

		handleRestart,

		handleBackToMenu,

		startGame,

		handleGameOver,
	} = usePokemonGameHandlers({
		gameState,

		gameSetters,

		inputRef,

		currentPokemon,

		isPokemonLoading,

		apiPokemonNames,

		playerName,

		language: i18n.language,

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
	});

	const { data: rewardPokemonData, isLoading: isRewardPokemonLoading } =
		useGetPokemonByIdQuery(
			rewardPokemonId
				? { id: rewardPokemonId, maxHypeChain: gameState.maxHypeChain }
				: skipToken,

			{
				skip: !rewardPokemonId || !gameState.gameOver,
			},
		);

	usePokemonGameEffects({
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
	});

	const { data: spinningPokemonData } = useGetPokemonByIdQuery(
		spinningPokemonId
			? { id: spinningPokemonId, maxHypeChain: gameState.maxHypeChain }
			: skipToken,

		{
			skip: !spinningPokemonId || !isSlotMachineRunning,
		},
	);

	const handleDevCompleteGeneration = useCallback((): void => {
		gameSetters.setRemainingPokemon([]);

		void handleGameOver();
	}, [gameSetters, handleGameOver]);

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4 flex items-start sm:items-center justify-center font-oswald relative">
			<PokemonGameDevTools
				onGameOver={() => {
					void handleGameOver();
				}}
				onCompleteGeneration={handleDevCompleteGeneration}
			/>

			{gameState.isGameActive ? (
				<GameScreen
					currentPokemon={
						gameState.isRestarting ? undefined : gameState.currentPokemon
					}
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
					player={{
						playerName,

						nameError,

						onPlayerNameChange: handlePlayerNameChange,

						checkNameAvailability,
					}}
					generation={{
						selectedGeneration: gameState.selectedGeneration,

						generations: GENERATIONS,

						onGenerationSelect: handleGenerationSelect,
					}}
					canStartGame={Boolean(
						(playerName && !nameError && !isCheckingName) ||
							(savedName && playerName === savedName) ||
							(playerName && isAuthName),
					)}
					startGame={startGame}
					score={gameState.score}
					audio={{
						isMuted: gameState.isMuted,

						setIsMuted: gameSetters.setIsMuted,
					}}
					rankings={{
						rankings,

						rankingError,

						formatTimeForRanking,

						formatDate: formatRankingDate,
					}}
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
				rewardPokemon={{
					pokemon: gameState.rewardPokemon.pokemon,

					isLoading: gameState.rewardPokemon.isLoading,
				}}
				remainingPokemon={gameState.remainingPokemon}
				handleRestart={handleRestart}
				handleBackToMenu={handleBackToMenu}
				isMuted={gameState.isMuted}
				criticalHitCount={gameState.criticalHitCount}
				criticalSuccessCount={gameState.criticalSuccessCount}
				hyperTrainCount={gameState.hyperTrainCount}
				maxHypeChain={gameState.maxHypeChain}
				selectedGeneration={gameState.selectedGeneration}
				isSlotMachineRunning={isSlotMachineRunning}
				spinningPokemon={spinningPokemonData}
			/>
		</div>
	);
};

export default PokemonGame;
