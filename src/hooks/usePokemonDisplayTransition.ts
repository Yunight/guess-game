import {
	computePokemonDisplayTransition,
	type PokemonDisplayState,
} from "@/components/pokemon-game/pokemonDisplayState";
import { logCryDebug } from "@/components/pokemon-game/cryDebug";
import type { Pokemon } from "@/components/pokemon-game/types";
import { useLayoutEffect, useState, type MutableRefObject } from "react";

interface DisplaySnapshot {
	displayState: PokemonDisplayState;
	displayedPokemon: Pokemon | undefined;
	currentPokemonId: number | null;
}

const initialDisplaySnapshot: DisplaySnapshot = {
	displayState: "loading",
	displayedPokemon: undefined,
	currentPokemonId: null,
};

interface UsePokemonDisplayTransitionParams {
	currentPokemon: Pokemon | undefined;
	isPokemonLoading: boolean;
	isCorrect: boolean | null;
	guessTimeLeft: number;
	audioRef: MutableRefObject<HTMLAudioElement | null>;
	soundPlayedRef: MutableRefObject<boolean>;
}

interface UsePokemonDisplayTransitionResult {
	displayState: PokemonDisplayState;
	displayedPokemon: Pokemon | undefined;
}

const isSameDisplaySnapshot = (left: DisplaySnapshot, right: DisplaySnapshot): boolean =>
	left.displayState === right.displayState &&
	left.displayedPokemon === right.displayedPokemon &&
	left.currentPokemonId === right.currentPokemonId;

export const usePokemonDisplayTransition = ({
	currentPokemon,
	isPokemonLoading,
	isCorrect,
	guessTimeLeft,
	audioRef,
	soundPlayedRef,
}: UsePokemonDisplayTransitionParams): UsePokemonDisplayTransitionResult => {
	const [snapshot, setSnapshot] = useState<DisplaySnapshot>(initialDisplaySnapshot);

	const transition = computePokemonDisplayTransition({
		currentPokemon,
		isPokemonLoading,
		isCorrect,
		guessTimeLeft,
		displayState: snapshot.displayState,
		displayedPokemon: snapshot.displayedPokemon,
		currentPokemonId: snapshot.currentPokemonId,
	});

	const nextSnapshot: DisplaySnapshot = {
		displayState: transition.displayState,
		displayedPokemon: transition.displayedPokemon,
		currentPokemonId: transition.currentPokemonId,
	};

	logCryDebug("Display transition computed", {
		currentPokemonId: currentPokemon?.id ?? null,
		isPokemonLoading,
		isCorrect,
		guessTimeLeft,
		fromState: snapshot.displayState,
		fromDisplayedPokemonId: snapshot.displayedPokemon?.id ?? null,
		fromCurrentPokemonId: snapshot.currentPokemonId,
		toState: nextSnapshot.displayState,
		toDisplayedPokemonId: nextSnapshot.displayedPokemon?.id ?? null,
		toCurrentPokemonId: nextSnapshot.currentPokemonId,
		shouldClearAudio: transition.shouldClearAudio,
		shouldResetSoundPlayed: transition.shouldResetSoundPlayed,
	});

	if (!isSameDisplaySnapshot(snapshot, nextSnapshot)) {
		setSnapshot(nextSnapshot);
	}

	useLayoutEffect(() => {
		if (transition.shouldClearAudio && audioRef.current) {
			logCryDebug("Clearing current cry audio element", {
				transitionCurrentPokemonId: transition.currentPokemonId,
			});
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current.remove();
			audioRef.current = null;
		}

		if (transition.shouldResetSoundPlayed) {
			logCryDebug("Resetting soundPlayedRef", {
				transitionCurrentPokemonId: transition.currentPokemonId,
			});
			soundPlayedRef.current = false;
		}
	}, [
		audioRef,
		soundPlayedRef,
		transition.currentPokemonId,
		transition.shouldClearAudio,
		transition.shouldResetSoundPlayed,
	]);

	return {
		displayState: nextSnapshot.displayState,
		displayedPokemon: nextSnapshot.displayedPokemon,
	};
};
