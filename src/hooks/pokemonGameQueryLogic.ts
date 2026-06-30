import { skipToken } from "@reduxjs/toolkit/query";
import type { Generation } from "@/components/pokemon-game/generations";

interface GameQueryState {
	isGameActive: boolean;
	gameOver: boolean;
	currentPokemonId: number | null;
	maxHypeChain: number;
	selectedGeneration: Generation;
}

export const resolvePokemonNamesQueryArg = (
	gameState: GameQueryState,
): typeof skipToken | { startId: number; endId: number; maxHypeChain: number } => {
	if (!gameState.isGameActive) {
		return skipToken;
	}

	return {
		startId: gameState.selectedGeneration.startId,
		endId: gameState.selectedGeneration.endId,
		maxHypeChain: gameState.maxHypeChain,
	};
};

export const resolveCurrentPokemonQueryArg = (
	gameState: GameQueryState,
): typeof skipToken | { id: number; maxHypeChain: number } => {
	if (!gameState.currentPokemonId) {
		return skipToken;
	}

	return {
		id: gameState.currentPokemonId,
		maxHypeChain: gameState.maxHypeChain,
	};
};

export const shouldSkipCurrentPokemonQuery = (
	currentPokemonId: number | null,
	isGameActive: boolean,
): boolean => {
	return !currentPokemonId || !isGameActive;
};

export const resolveRewardPokemonQueryArg = (
	rewardPokemonId: number | null,
	maxHypeChain: number,
): typeof skipToken | { id: number; maxHypeChain: number } => {
	if (!rewardPokemonId) {
		return skipToken;
	}

	return { id: rewardPokemonId, maxHypeChain };
};

export const shouldSkipRewardPokemonQuery = (
	rewardPokemonId: number | null,
	gameOver: boolean,
): boolean => {
	return !rewardPokemonId || !gameOver;
};

export const resolveSpinningPokemonQueryArg = (
	spinningPokemonId: number | null,
	maxHypeChain: number,
): typeof skipToken | { id: number; maxHypeChain: number } => {
	if (!spinningPokemonId) {
		return skipToken;
	}

	return { id: spinningPokemonId, maxHypeChain };
};

export const shouldSkipSpinningPokemonQuery = (
	spinningPokemonId: number | null,
	isSlotMachineRunning: boolean,
): boolean => {
	return !spinningPokemonId || !isSlotMachineRunning;
};
