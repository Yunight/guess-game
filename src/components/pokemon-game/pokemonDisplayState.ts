import type { Pokemon } from "./types";

export type PokemonDisplayState = "loading" | "ready" | "revealed";

export interface PokemonDisplayTransitionInput {
	currentPokemon: Pokemon | undefined;
	isPokemonLoading: boolean;
	isCorrect: boolean | null;
	guessTimeLeft: number;
	displayState: PokemonDisplayState;
	displayedPokemon: Pokemon | undefined;
	currentPokemonId: number | null;
}

export interface PokemonDisplayTransitionOutput {
	displayState: PokemonDisplayState;
	displayedPokemon: Pokemon | undefined;
	currentPokemonId: number | null;
	shouldClearAudio: boolean;
	shouldResetSoundPlayed: boolean;
}

export const shouldClearAudioOnTransition = (
	isPokemonLoading: boolean,
	newPokemonId: number | undefined,
	currentPokemonId: number | null,
): boolean => {
	return isPokemonLoading || newPokemonId !== currentPokemonId;
};

export const shouldResetToLoading = (
	newPokemonId: number | undefined,
	currentPokemonId: number | null,
	displayedPokemonId: number | undefined,
): boolean => {
	return (
		newPokemonId !== currentPokemonId && newPokemonId !== displayedPokemonId
	);
};

export const computeNextDisplayState = (
	isCorrect: boolean | null,
	guessTimeLeft: number,
): PokemonDisplayState => {
	return isCorrect === true || guessTimeLeft === 0 ? "revealed" : "ready";
};

export const shouldUpdateRevealedPokemon = (
	displayState: PokemonDisplayState,
	currentPokemonId: number,
	displayedPokemonId: number | undefined,
): boolean => {
	return displayState === "revealed" && currentPokemonId === displayedPokemonId;
};

export const shouldResetSoundOnPokemonChange = (
	currentPokemonId: number,
	displayedPokemonId: number | undefined,
): boolean => {
	return currentPokemonId !== displayedPokemonId;
};

export const computePokemonDisplayTransition = (
	input: PokemonDisplayTransitionInput,
): PokemonDisplayTransitionOutput => {
	const newPokemonId = input.currentPokemon?.id;
	const currentId = input.currentPokemonId;
	const displayedId = input.displayedPokemon?.id;

	let displayState = input.displayState;
	let displayedPokemon = input.displayedPokemon;
	let currentPokemonId = currentId;
	let shouldClearAudio = false;
	let shouldResetSoundPlayed = false;

	if (shouldClearAudioOnTransition(input.isPokemonLoading, newPokemonId, currentId)) {
		shouldClearAudio = true;
		shouldResetSoundPlayed = true;

		if (shouldResetToLoading(newPokemonId, currentId, displayedId)) {
			displayState = "loading";
			displayedPokemon = undefined;
		}

		currentPokemonId = newPokemonId ?? null;
	}

	if (input.currentPokemon && !input.isPokemonLoading) {
		if (
			shouldUpdateRevealedPokemon(
				displayState,
				input.currentPokemon.id,
				displayedPokemon?.id,
			)
		) {
			displayedPokemon = input.currentPokemon;
		} else {
			const nextState = computeNextDisplayState(
				input.isCorrect,
				input.guessTimeLeft,
			);
			if (
				shouldResetSoundOnPokemonChange(
					input.currentPokemon.id,
					displayedPokemon?.id,
				)
			) {
				shouldResetSoundPlayed = true;
			}
			displayState = nextState;
			displayedPokemon = input.currentPokemon;
		}
	}

	return {
		displayState,
		displayedPokemon,
		currentPokemonId,
		shouldClearAudio,
		shouldResetSoundPlayed,
	};
};

export const getLocalizedPokemonName = (
	pokemon: Pokemon,
	language: string,
): string => {
	return language === "fr" ? pokemon.frenchName : pokemon.englishName;
};

export const getShinyLabel = (language: string): string => {
	return language === "fr" ? "✨ CHROMATIQUE" : "✨ SHINY";
};
