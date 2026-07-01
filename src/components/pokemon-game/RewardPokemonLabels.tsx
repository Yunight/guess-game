import { Crown, Sparkles, Star } from "lucide-react";

import {
	getLegendaryBadgeLabel,
	getMythicalBadgeLabel,
	getShinyBadgeLabel,
	getYouAreLabel,
	getLocalizedPokemonName,
} from "./pokemonLabelText";

import type { Pokemon } from "./types";

interface RewardPokemonLabelsProps {
	pokemon: Pokemon;

	language: string;
}

export const RewardPokemonLabels = ({
	pokemon,

	language,
}: RewardPokemonLabelsProps): JSX.Element => {
	const localizedName = getLocalizedPokemonName(pokemon, language);

	return (
		<div className="text-center space-y-2 animate-fade-in">
			<div className="bg-gradient-to-r from-blue-500/50 via-blue-600/50 to-blue-500/50 text-white px-6 py-2 rounded-full backdrop-blur-sm font-bold text-xl animate-fade-in drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] flex items-center gap-2">
				<span className="text-blue-100">{getYouAreLabel(language)}</span>

				{localizedName}
			</div>

			{pokemon.isShiny && (
				<div className="flex items-center justify-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold text-lg shadow-lg animate-pulse-custom">
					<Sparkles className="h-5 w-5 text-yellow-300" />

					<span>{getShinyBadgeLabel(language)}</span>
				</div>
			)}

			{pokemon.isLegendary && (
				<div className="flex items-center justify-center gap-1 text-purple-300">
					<Crown className="h-4 w-4" />

					<span className="text-sm font-medium">{getLegendaryBadgeLabel(language)}</span>
				</div>
			)}

			{pokemon.isMythical && (
				<div className="flex items-center justify-center gap-1 text-pink-300">
					<Star className="h-4 w-4" />

					<span className="text-sm font-medium">{getMythicalBadgeLabel(language)}</span>
				</div>
			)}
		</div>
	);
};
