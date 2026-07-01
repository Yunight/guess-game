import type { FC } from "react";

import { useTranslation } from "react-i18next";

import { PokemonDisplayFrame } from "./PokemonDisplayFrame";

import { PokemonSprite } from "./PokemonSprite";

import { StaticPokemonBadges } from "./StaticPokemonBadges";

import { getLocalizedPokemonName, getYouAreLabel } from "./pokemonLabelText";

import type { Pokemon } from "./types";

interface StaticPokemonDisplayProps {
	pokemon: Pokemon;
}

export const StaticPokemonDisplay: FC<StaticPokemonDisplayProps> = ({ pokemon }) => {
	const { i18n } = useTranslation();

	const localizedName = getLocalizedPokemonName(pokemon, i18n.language);

	return (
		<PokemonDisplayFrame className="rounded-xl p-4 min-h-[280px]">
			<div className="flex flex-col items-center space-y-4">
				<div className="relative h-40 flex items-center justify-center">
					<div className="relative flex items-center justify-center scale-125">
						<div className="w-[125px] h-[125px] flex items-center justify-center">
							<PokemonSprite
								pokemonId={pokemon.id}
								className="w-full h-full object-contain pixelated"
								isRevealed={true}
								name={localizedName}
								isShiny={pokemon.isShiny}
							/>
						</div>
					</div>
				</div>

				<div className="text-center space-y-2">
					<div className="bg-gradient-to-r from-blue-500/50 via-blue-600/50 to-blue-500/50 text-white px-6 py-2 rounded-full backdrop-blur-sm font-bold text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] flex items-center gap-2">
						<span className="text-blue-100">{getYouAreLabel(i18n.language)}</span>

						{localizedName}
					</div>

					<StaticPokemonBadges pokemon={pokemon} language={i18n.language} />
				</div>
			</div>
		</PokemonDisplayFrame>
	);
};
