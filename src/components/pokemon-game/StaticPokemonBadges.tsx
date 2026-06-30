import { Crown, Sparkles, Star } from "lucide-react";
import {
	getLegendaryBadgeLabel,
	getMythicalBadgeLabel,
	getShinyBadgeLabel,
} from "./pokemonLabelText";
import type { Pokemon } from "./types";

interface StaticPokemonBadgesProps {
	pokemon: Pokemon;
	language: string;
}

export const StaticPokemonBadges = ({
	pokemon,
	language,
}: StaticPokemonBadgesProps): JSX.Element => (
	<div className="flex flex-wrap justify-center gap-2">
		{pokemon.isShiny && (
			<div className="flex items-center justify-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold text-sm shadow-lg">
				<Sparkles className="h-4 w-4 text-yellow-300" />
				<span>{getShinyBadgeLabel(language)}</span>
			</div>
		)}
		{pokemon.isLegendary && (
			<div className="flex items-center justify-center gap-1 bg-purple-500/80 text-white px-3 py-2 rounded-full text-sm font-medium">
				<Crown className="h-4 w-4" />
				<span>{getLegendaryBadgeLabel(language)}</span>
			</div>
		)}
		{pokemon.isMythical && (
			<div className="flex items-center justify-center gap-1 bg-pink-500/80 text-white px-3 py-2 rounded-full text-sm font-medium">
				<Star className="h-4 w-4" />
				<span>{getMythicalBadgeLabel(language)}</span>
			</div>
		)}
	</div>
);
