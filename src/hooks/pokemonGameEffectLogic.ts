import type { Pokemon } from "@/components/pokemon-game/types";

const isMissingPokemonName = (value: string | undefined): boolean =>
	value === undefined || value.length === 0;

export const shouldResetTimersWhenInactive = (
	isGameActive: boolean,
	guessTimeLeft: number,
	totalTimeElapsed: number,
): boolean => {
	return !isGameActive && (guessTimeLeft !== Number.POSITIVE_INFINITY || totalTimeElapsed !== 0);
};

export const shouldStartTotalTimer = (isGameActive: boolean, totalTimeElapsed: number): boolean =>
	isGameActive && totalTimeElapsed === 0;

export const shouldStartGuessTimer = (
	isGameActive: boolean,
	isHardMode: boolean,
	guessTimeLeft: number,
): boolean => isGameActive && isHardMode && guessTimeLeft === Number.POSITIVE_INFINITY;

export interface GameTimerSyncInput {
	isGameActive: boolean;
	isHardMode: boolean;
	guessTimeLeft: number;
	totalTimeElapsed: number;
}

export interface GameTimerSyncSetters {
	setGuessTimeLeft: (value: number) => void;
	setTotalTimeElapsed: (value: number) => void;
}

export const applyGameTimerSync = (
	input: GameTimerSyncInput,
	setters: GameTimerSyncSetters,
	startTotalTimer: (setter: (value: number) => void) => void,
	startGuessTimer: (setter: (value: number) => void) => void,
	stopAllTimers: () => void,
): (() => void) | undefined => {
	if (
		shouldResetTimersWhenInactive(input.isGameActive, input.guessTimeLeft, input.totalTimeElapsed)
	) {
		stopAllTimers();

		if (input.guessTimeLeft !== Number.POSITIVE_INFINITY) {
			setters.setGuessTimeLeft(Number.POSITIVE_INFINITY);
		}

		if (input.totalTimeElapsed !== 0) {
			setters.setTotalTimeElapsed(0);
		}

		return undefined;
	}

	if (!input.isGameActive) {
		return undefined;
	}

	if (shouldStartTotalTimer(input.isGameActive, input.totalTimeElapsed)) {
		startTotalTimer(setters.setTotalTimeElapsed);
	}

	if (shouldStartGuessTimer(input.isGameActive, input.isHardMode, input.guessTimeLeft)) {
		startGuessTimer(setters.setGuessTimeLeft);
	}

	return () => {
		if (!input.isGameActive) {
			stopAllTimers();
		}
	};
};

export const shouldRecoverInvalidPokemon = (
	isGameActive: boolean,
	isPokemonLoading: boolean,
	currentPokemonId: number | null,
	remainingPokemonLength: number,
	currentPokemon: Pokemon | undefined,
): boolean => {
	if (!isGameActive || isPokemonLoading || currentPokemonId === null) {
		return false;
	}
	if (remainingPokemonLength === 0) {
		return false;
	}
	return (
		currentPokemon === undefined ||
		isMissingPokemonName(currentPokemon.englishName) ||
		isMissingPokemonName(currentPokemon.frenchName)
	);
};

export const shouldSyncRewardPokemon = (
	gameOver: boolean,
	rewardPokemonData: Pokemon | undefined,
	isSlotMachineRunning: boolean,
): boolean => Boolean(gameOver && rewardPokemonData && !isSlotMachineRunning);

export const isRewardPokemonAlreadySynced = (
	existingPokemonId: number | undefined,
	isLoading: boolean,
	rewardPokemonData: Pokemon,
): boolean => existingPokemonId === rewardPokemonData.id && !isLoading;

export const shouldResetRewardOnGameClose = (
	gameOver: boolean,
	hasRewardPokemon: boolean,
): boolean => !gameOver && hasRewardPokemon;

export const shouldTriggerGameOver = (
	isGameActive: boolean,
	gameOver: boolean,
	guessTimeLeft: number,
	remainingPokemonLength: number,
): boolean => isGameActive && !gameOver && (guessTimeLeft <= 0 || remainingPokemonLength === 0);

export const shouldApplyHypeTrainBonus = (
	isHardMode: boolean,
	showHypeTrain: boolean,
	guessTimeLeft: number,
): boolean => isHardMode && showHypeTrain && guessTimeLeft <= 9;
