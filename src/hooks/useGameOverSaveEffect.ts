import {
	SAVE_SCHEDULE_DELAY_MS,
	createGameSessionId,
	runGameResultSave,
	shouldScheduleGameSave,
} from "@/components/pokemon-game/gameOverDialogSave";
import type { GameOverDialogProps } from "@/components/pokemon-game/GameOverDialog";
import { useEffect, useState } from "react";

export type GameOverSaveEffectParams = Pick<
	GameOverDialogProps,
	| "gameOver"
	| "playerName"
	| "score"
	| "totalTimeElapsed"
	| "userRanking"
	| "remainingPokemon"
	| "rewardPokemon"
	| "isSlotMachineRunning"
	| "selectedGeneration"
	| "criticalHitCount"
	| "criticalSuccessCount"
	| "hyperTrainCount"
	| "maxHypeChain"
>;

export interface GameOverSaveEffectResult {
	shareableUrl: string | null;
	isSavingResult: boolean;
	displayTime: number;
}

interface SaveContext {
	gameOver: boolean;
	shareableUrl: string | null;
	isSavingResult: boolean;
	rewardPokemon: GameOverSaveEffectParams["rewardPokemon"];
	isSlotMachineRunning: boolean;
	gameSessionId: string;
	finalTime: number;
	totalTimeElapsed: number;
}

const buildSaveContext = (params: SaveContext) => ({
	gameOver: params.gameOver,
	shareableUrl: params.shareableUrl,
	isSavingResult: params.isSavingResult,
	rewardPokemon: params.rewardPokemon,
	isSlotMachineRunning: params.isSlotMachineRunning,
	gameSessionId: params.gameSessionId,
	finalTime: params.finalTime,
	totalTimeElapsed: params.totalTimeElapsed,
});

export const useGameOverSaveEffect = (
	params: GameOverSaveEffectParams,
): GameOverSaveEffectResult => {
	const {
		gameOver,
		playerName,
		score,
		totalTimeElapsed,
		userRanking,
		remainingPokemon,
		rewardPokemon,
		isSlotMachineRunning,
		selectedGeneration,
		criticalHitCount,
		criticalSuccessCount,
		hyperTrainCount,
		maxHypeChain,
	} = params;

	const [shareableUrl, setShareableUrl] = useState<string | null>(null);
	const [isSavingResult, setIsSavingResult] = useState(false);
	const [gameSessionId] = useState(createGameSessionId);

	const finalTime = gameOver && totalTimeElapsed > 0 ? totalTimeElapsed : 0;
	const displayTime = finalTime > 0 ? finalTime : totalTimeElapsed;

	useEffect(() => {
		const saveContext = buildSaveContext({
			gameOver,
			shareableUrl,
			isSavingResult,
			rewardPokemon,
			isSlotMachineRunning,
			gameSessionId,
			finalTime,
			totalTimeElapsed,
		});

		if (!shouldScheduleGameSave(saveContext)) {
			return;
		}

		const timeoutId = setTimeout(() => {
			void runGameResultSave({
				saveContext,
				gameSessionId,
				playerName,
				score,
				finalTime,
				totalTimeElapsed,
				userRanking,
				selectedGeneration,
				rewardPokemon,
				remainingPokemon,
				criticalHitCount,
				criticalSuccessCount,
				hyperTrainCount,
				maxHypeChain,
				isSlotMachineRunning,
				setIsSavingResult,
				setShareableUrl,
			});
		}, SAVE_SCHEDULE_DELAY_MS);

		return () => clearTimeout(timeoutId);
	}, [
		gameOver,
		isSlotMachineRunning,
		rewardPokemon,
		shareableUrl,
		isSavingResult,
		gameSessionId,
		playerName,
		score,
		finalTime,
		totalTimeElapsed,
		userRanking,
		selectedGeneration,
		remainingPokemon,
		criticalHitCount,
		criticalSuccessCount,
		hyperTrainCount,
		maxHypeChain,
	]);

	return { shareableUrl, isSavingResult, displayTime };
};
