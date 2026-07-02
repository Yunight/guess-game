import type { ReactNode } from "react";
import { GameOverDialog } from "./GameOverDialog";
import { PokemonGameDevTools } from "./PokemonGameDevTools";
import { PokemonGameActiveLayout, PokemonGameMenuLayout } from "./PokemonGameSections";
import type { usePokemonGameController } from "../../hooks/usePokemonGameController";
import { formatTimeForRanking } from "../../utils/gameFormatters";

type PokemonGameController = ReturnType<typeof usePokemonGameController>;

interface PokemonGameLayoutProps {
	controller: PokemonGameController;
}

export const PokemonGameLayout = ({ controller }: PokemonGameLayoutProps): ReactNode => {
	const { gameState, gameSetters } = controller;

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4 flex items-start sm:items-center justify-center font-oswald relative">
			<PokemonGameDevTools
				onGameOver={controller.handleDevGameOver}
				onCompleteGeneration={controller.handleDevCompleteGeneration}
			/>

			{gameState.isGameActive ? (
				<PokemonGameActiveLayout controller={controller} />
			) : (
				<PokemonGameMenuLayout controller={controller} />
			)}

			<GameOverDialog
				gameOver={gameState.gameOver}
				setGameOver={gameSetters.setGameOver}
				playerName={controller.playerName}
				score={gameState.score}
				bestScore={controller.bestScore}
				bestTime={controller.bestTime}
				userRanking={controller.userRanking}
				bestRanking={controller.bestRanking}
				totalTimeElapsed={gameState.totalTimeElapsed}
				formatTimeForRanking={formatTimeForRanking}
				rewardPokemon={controller.rewardPokemon}
				remainingPokemon={gameState.remainingPokemon}
				handleRestart={controller.handleRestart}
				handleBackToMenu={controller.handleBackToMenu}
				isMuted={gameState.isMuted}
				criticalHitCount={gameState.criticalHitCount}
				criticalSuccessCount={gameState.criticalSuccessCount}
				hyperTrainCount={gameState.hyperTrainCount}
				maxHypeChain={gameState.maxHypeChain}
				selectedGeneration={gameState.selectedGeneration}
				isSlotMachineRunning={controller.isSlotMachineRunning}
				spinningPokemon={controller.spinningPokemonData}
			/>
		</div>
	);
};
