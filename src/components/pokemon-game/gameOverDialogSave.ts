import { type GameResult, gameResultsService } from "../../services/gameResultsService";
import type { Pokemon } from "./types";

export interface RewardPokemonState {
	pokemon: Pokemon | undefined;
	isLoading: boolean;
}

export interface GameSaveContext {
	gameOver: boolean;
	shareableUrl: string | null;
	isSavingResult: boolean;
	rewardPokemon: RewardPokemonState;
	isSlotMachineRunning: boolean;
	gameSessionId: string | null;
	finalTime: number;
	totalTimeElapsed: number;
}

export interface GameResultPayloadParams {
	playerName: string;
	score: number;
	finalTime: number;
	totalTimeElapsed: number;
	userRanking: number | null;
	selectedGeneration: { name: string; startId: number; endId: number };
	rewardPokemon: Pokemon;
	remainingPokemon: number[];
	criticalHitCount: number;
	criticalSuccessCount: number;
	hyperTrainCount: number;
	maxHypeChain: number;
	gameSessionId: string;
}

export const shouldInitializeGameSessionId = (
	gameOver: boolean,
	gameSessionId: string | null,
	shareableUrl: string | null,
	isSavingResult: boolean,
): boolean => {
	return gameOver && !gameSessionId && !shareableUrl && !isSavingResult;
};

export const shouldResetGameOverSaveState = (gameOver: boolean): boolean => {
	return !gameOver;
};

export const shouldUpdateFinalTime = (gameOver: boolean, totalTimeElapsed: number): boolean => {
	return gameOver && totalTimeElapsed > 0;
};

export const createGameSessionId = (): string => {
	return `game_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

const resolveSaveTime = (finalTime: number, totalTimeElapsed: number): number => {
	return finalTime > 0 ? finalTime : totalTimeElapsed;
};

const hasTimingData = (finalTime: number, totalTimeElapsed: number): boolean => {
	return finalTime > 0 || totalTimeElapsed > 0;
};

export const shouldScheduleGameSave = (context: GameSaveContext): boolean => {
	return (
		context.gameOver &&
		!context.shareableUrl &&
		!context.isSavingResult &&
		!context.isSlotMachineRunning &&
		Boolean(context.rewardPokemon.pokemon) &&
		!context.rewardPokemon.isLoading &&
		Boolean(context.gameSessionId)
	);
};

export const shouldProceedWithGameSave = (context: GameSaveContext): boolean => {
	return (
		context.gameOver &&
		!context.shareableUrl &&
		!context.isSavingResult &&
		Boolean(context.rewardPokemon.pokemon) &&
		!context.rewardPokemon.isLoading &&
		!context.isSlotMachineRunning &&
		Boolean(context.gameSessionId) &&
		hasTimingData(context.finalTime, context.totalTimeElapsed)
	);
};

export const shouldAbortSaveAfterDelay = (
	rewardPokemon: RewardPokemonState,
	isSlotMachineRunning: boolean,
): boolean => {
	return !rewardPokemon.pokemon || rewardPokemon.isLoading || isSlotMachineRunning;
};

const buildGameResultPayload = (
	params: GameResultPayloadParams,
): Omit<GameResult, "id" | "createdAt"> => {
	const {
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
		gameSessionId,
	} = params;

	return {
		playerName,
		score,
		totalTimeElapsed: resolveSaveTime(finalTime, totalTimeElapsed),
		userRanking,
		selectedGeneration,
		rewardPokemon,
		remainingPokemon,
		criticalHitCount,
		criticalSuccessCount,
		hyperTrainCount,
		maxHypeChain,
		gameMode: `${selectedGeneration.name}_${gameSessionId}`,
	};
};

export const persistGameResult = async (params: GameResultPayloadParams): Promise<string> => {
	const resultData = buildGameResultPayload(params);
	const resultId = await gameResultsService.saveGameResult(resultData);
	return gameResultsService.generateShareableUrl(resultId);
};

const SAVE_SETTLE_DELAY_MS = 300;
export const SAVE_SCHEDULE_DELAY_MS = 800;

export interface RunGameResultSaveParams {
	saveContext: GameSaveContext;
	gameSessionId: string;
	playerName: string;
	score: number;
	finalTime: number;
	totalTimeElapsed: number;
	userRanking: number | null;
	selectedGeneration: { name: string; startId: number; endId: number };
	rewardPokemon: RewardPokemonState;
	remainingPokemon: number[];
	criticalHitCount: number;
	criticalSuccessCount: number;
	hyperTrainCount: number;
	maxHypeChain: number;
	isSlotMachineRunning: boolean;
	setIsSavingResult: (value: boolean) => void;
	setShareableUrl: (url: string) => void;
}

export const runGameResultSave = async (params: RunGameResultSaveParams): Promise<void> => {
	if (!shouldProceedWithGameSave(params.saveContext)) {
		return;
	}

	if (shouldAbortSaveAfterDelay(params.rewardPokemon, params.isSlotMachineRunning)) {
		return;
	}

	const pokemon = params.rewardPokemon.pokemon;
	if (!pokemon) {
		return;
	}

	await new Promise<void>((resolve) => {
		setTimeout(resolve, SAVE_SETTLE_DELAY_MS);
	});

	if (
		!shouldProceedWithGameSave(params.saveContext) ||
		shouldAbortSaveAfterDelay(params.rewardPokemon, params.isSlotMachineRunning)
	) {
		return;
	}

	params.setIsSavingResult(true);
	try {
		const url = await persistGameResult({
			playerName: params.playerName,
			score: params.score,
			finalTime: params.finalTime,
			totalTimeElapsed: params.totalTimeElapsed,
			userRanking: params.userRanking,
			selectedGeneration: params.selectedGeneration,
			rewardPokemon: pokemon,
			remainingPokemon: params.remainingPokemon,
			criticalHitCount: params.criticalHitCount,
			criticalSuccessCount: params.criticalSuccessCount,
			hyperTrainCount: params.hyperTrainCount,
			maxHypeChain: params.maxHypeChain,
			gameSessionId: params.gameSessionId,
		});
		params.setShareableUrl(url);
		params.setIsSavingResult(false);
	} catch (error) {
		console.error("❌ Failed to save game result:", error);
		params.setIsSavingResult(false);
	}
};
