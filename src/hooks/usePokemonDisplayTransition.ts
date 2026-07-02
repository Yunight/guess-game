import {
	computePokemonDisplayTransition,
	type PokemonDisplayState,
} from "@/components/pokemon-game/pokemonDisplayState";
import type { Pokemon } from "@/components/pokemon-game/types";
import { useLayoutEffect, useRef, useState, type MutableRefObject } from "react";

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
	const handledSideEffectsKeyRef = useRef<string>("");

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

	if (!isSameDisplaySnapshot(snapshot, nextSnapshot)) {
		setSnapshot(nextSnapshot);
	}

	useLayoutEffect(() => {
		const sideEffectsKey = [
			transition.shouldClearAudio,
			transition.shouldResetSoundPlayed,
			transition.currentPokemonId,
		].join(":");

		if (handledSideEffectsKeyRef.current === sideEffectsKey) {
			return;
		}

		handledSideEffectsKeyRef.current = sideEffectsKey;

		if (transition.shouldClearAudio && audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current.remove();
			audioRef.current = null;
		}

		if (transition.shouldResetSoundPlayed) {
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
