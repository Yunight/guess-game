import type { CSSProperties } from "react";

import { PokemonSprite } from "./PokemonSprite";

import {
	getRewardLocalizedName,
	getRewardSpriteContainerClassName,
	getRewardSpriteStyle,
} from "./rewardPokemonSpriteStyles";

import type { Pokemon } from "./types";

interface RewardPokemonSpriteProps {
	currentPokemon: Pokemon | undefined;

	isLoading: boolean;

	isSlotMachineRunning: boolean;

	isRevealed: boolean;

	language: string;

	previousPokemon: Pokemon | undefined;
}

export const RewardPokemonSprite = ({
	currentPokemon,

	isLoading,

	isSlotMachineRunning,

	isRevealed,

	language,
}: RewardPokemonSpriteProps): JSX.Element | null => {
	if (isLoading && !currentPokemon) {
		return (
			<div className="absolute inset-0 flex items-center justify-center">
				<div className="w-20 h-20 animate-spin-slow">
					<img src="/pokeball.svg" alt="Loading..." className="w-full h-full" />
				</div>
			</div>
		);
	}

	if (!currentPokemon) {
		return null;
	}

	const localizedName = getRewardLocalizedName(currentPokemon, language);

	const containerStyle: CSSProperties = getRewardSpriteStyle(
		isSlotMachineRunning,

		isRevealed,
	);

	return (
		<div className={getRewardSpriteContainerClassName(isSlotMachineRunning)} style={containerStyle}>
			<div className="w-[125px] h-[125px] flex items-center justify-center">
				<PokemonSprite
					pokemonId={currentPokemon.id}
					className="w-full h-full object-contain pixelated"
					isRevealed={!isSlotMachineRunning}
					name={localizedName}
					isShiny={currentPokemon.isShiny}
				/>
			</div>
		</div>
	);
};
