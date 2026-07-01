import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { PokemonDisplayFrame } from "./PokemonDisplayFrame";
import { RewardPokemonLabels } from "./RewardPokemonLabels";
import { RewardPokemonSprite } from "./RewardPokemonSprite";
import {
	isPokemonInGeneration,
	resolveRewardCurrentPokemon,
	shouldShowRewardDisplay,
	shouldShowRewardLabels,
} from "./rewardPokemonDisplayLogic";
import type { Pokemon } from "./types";
import { useRewardPokemonTransition } from "./useRewardPokemonTransition";

interface RewardPokemonDisplayProps {
	pokemon: Pokemon | undefined;
	isLoading: boolean;
	selectedGeneration: {
		name: string;
		startId: number;
		endId: number;
	};
	isSlotMachineRunning: boolean;
	spinningPokemon?: Pokemon | undefined;
}

export const RewardPokemonDisplay: FC<RewardPokemonDisplayProps> = ({
	pokemon,
	isLoading,
	selectedGeneration,
	isSlotMachineRunning,
	spinningPokemon,
}) => {
	const { i18n } = useTranslation();
	const previousPokemonRef = useRewardPokemonTransition(pokemon, isSlotMachineRunning);

	if (!shouldShowRewardDisplay(pokemon, isLoading, spinningPokemon)) {
		return null;
	}

	const currentPokemon = resolveRewardCurrentPokemon(
		isSlotMachineRunning,
		spinningPokemon,
		pokemon,
	);

	if (currentPokemon && !isPokemonInGeneration(currentPokemon, selectedGeneration)) {
		console.error("Pokemon not from selected generation:", {
			pokemonId: currentPokemon.id,
			generation: selectedGeneration,
		});
		return null;
	}

	const showLabels = shouldShowRewardLabels(
		pokemon,
		isSlotMachineRunning,
		previousPokemonRef.current,
	);

	return (
		<PokemonDisplayFrame className="rounded-xl p-4 min-h-[280px]">
			<div className="flex flex-col items-center space-y-4">
				<div className="relative h-40 flex items-center justify-center">
					<RewardPokemonSprite
						currentPokemon={currentPokemon}
						isLoading={isLoading}
						isSlotMachineRunning={isSlotMachineRunning}
						isRevealed={pokemon === previousPokemonRef.current}
						language={i18n.language}
						previousPokemon={previousPokemonRef.current}
					/>
				</div>
				{showLabels && <RewardPokemonLabels pokemon={pokemon} language={i18n.language} />}
			</div>
		</PokemonDisplayFrame>
	);
};
