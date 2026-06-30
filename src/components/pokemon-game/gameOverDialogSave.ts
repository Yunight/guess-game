import {
	type GameResult,
	gameResultsService,
} from "../../services/gameResultsService";
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

export const createGameSessionId = (): string => {
	return `game_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
};

const resolveSaveTime = (
	finalTime: number,
	totalTimeElapsed: number,
): number => {
	return finalTime > 0 ? finalTime : totalTimeElapsed;
};

const hasTimingData = (
	finalTime: number,
	totalTimeElapsed: number,
): boolean => {
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
	return (
		!rewardPokemon.pokemon ||
		rewardPokemon.isLoading ||
		isSlotMachineRunning
	);
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

export const persistGameResult = async (
	params: GameResultPayloadParams,
): Promise<string> => {
	const resultData = buildGameResultPayload(params);
	const resultId = await gameResultsService.saveGameResult(resultData);
	return gameResultsService.generateShareableUrl(resultId);
};

export const SAVE_SETTLE_DELAY_MS = 300;
export const SAVE_SCHEDULE_DELAY_MS = 800;
