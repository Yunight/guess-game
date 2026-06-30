import { useEffect, useRef } from "react";
import type { Pokemon } from "./types";

const REWARD_TRANSITION_DELAY_MS = 100;

export const useRewardPokemonTransition = (
	pokemon: Pokemon | undefined,
	isSlotMachineRunning: boolean,
): React.MutableRefObject<Pokemon | undefined> => {
	const previousPokemonRef = useRef<Pokemon | undefined>();

	useEffect(() => {
		if (!isSlotMachineRunning && pokemon && pokemon !== previousPokemonRef.current) {
			const timeoutId = setTimeout(() => {
				previousPokemonRef.current = pokemon;
			}, REWARD_TRANSITION_DELAY_MS);

			return () => clearTimeout(timeoutId);
		}
	}, [isSlotMachineRunning, pokemon]);

	return previousPokemonRef;
};
