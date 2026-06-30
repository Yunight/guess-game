import { useCallback, useEffect, useRef, useState } from "react";
import type { Generation } from "@/components/pokemon-game/generations";
import { generateRewardCandidates } from "@/components/pokemon-game/generationPool";
import {
	calculateSpinInterval,
	pickSpinDisplayId,
	shouldContinueSpinning,
	SLOT_MACHINE_MIN_SPINS,
} from "./slotMachineLogic";

interface UseSlotMachineResult {
	isSlotMachineRunning: boolean;
	spinningPokemonId: number | null;
	potentialRewards: number[];
	runSlotMachineEffect: (
		finalPokemonId: number,
		onComplete: (pokemonId: number) => void,
	) => void;
	resetSlotMachine: () => void;
}

export const useSlotMachine = (
	selectedGeneration: Generation,
): UseSlotMachineResult => {
	const [isSlotMachineRunning, setIsSlotMachineRunning] = useState(false);
	const [spinningPokemonId, setSpinningPokemonId] = useState<number | null>(
		null,
	);
	const [potentialRewards, setPotentialRewards] = useState<number[]>([]);
	const slotMachineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const slotMachineCountRef = useRef(0);

	const resetSlotMachine = useCallback((): void => {
		if (slotMachineTimerRef.current) {
			clearTimeout(slotMachineTimerRef.current);
			slotMachineTimerRef.current = null;
		}
		slotMachineCountRef.current = 0;
		setIsSlotMachineRunning(false);
		setSpinningPokemonId(null);
		setPotentialRewards([]);
	}, []);

	const runSlotMachineEffect = useCallback(
		(finalPokemonId: number, onComplete: (pokemonId: number) => void): void => {
			resetSlotMachine();
			setIsSlotMachineRunning(true);

			const rewards = generateRewardCandidates(
				selectedGeneration.startId,
				selectedGeneration.endId,
				finalPokemonId,
			);
			setPotentialRewards(rewards);

			let lastDisplayedId: number | null = null;

			const showNextPokemon = (): void => {
				if (
					shouldContinueSpinning(
						slotMachineCountRef.current,
						SLOT_MACHINE_MIN_SPINS,
					)
				) {
					const displayPokemonId = pickSpinDisplayId(
						rewards,
						lastDisplayedId,
						finalPokemonId,
					);
					lastDisplayedId = displayPokemonId;
					setSpinningPokemonId(displayPokemonId);

					const nextInterval = calculateSpinInterval(
						slotMachineCountRef.current,
						SLOT_MACHINE_MIN_SPINS,
					);

					slotMachineTimerRef.current = setTimeout(() => {
						slotMachineCountRef.current++;
						showNextPokemon();
					}, nextInterval);
					return;
				}

				setIsSlotMachineRunning(false);
				setSpinningPokemonId(null);
				setPotentialRewards([]);
				onComplete(finalPokemonId);
			};

			showNextPokemon();
		},
		[resetSlotMachine, selectedGeneration.endId, selectedGeneration.startId],
	);

	useEffect(() => {
		return () => {
			if (slotMachineTimerRef.current) {
				clearTimeout(slotMachineTimerRef.current);
			}
		};
	}, []);

	return {
		isSlotMachineRunning,
		spinningPokemonId,
		potentialRewards,
		runSlotMachineEffect,
		resetSlotMachine,
	};
};
