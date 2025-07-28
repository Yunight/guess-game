import { Crown, Sparkles, Star } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { PokemonSprite } from "./PokemonSprite";
import type { Pokemon } from "./types";

interface StaticPokemonDisplayProps {
	pokemon: Pokemon;
}

export const StaticPokemonDisplay: FC<StaticPokemonDisplayProps> = ({
	pokemon,
}) => {
	const { t, i18n } = useTranslation();

	return (
		<div className="relative bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 overflow-hidden min-h-[280px]">
			<div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.5)_20%)] bg-[length:10px_10px] animate-grid-shine" />
			<div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 animate-screen-glare" />
			<div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg animate-corner-pulse" />
			<div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg animate-corner-pulse-delay-1" />
			<div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg animate-corner-pulse-delay-2" />
			<div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg animate-corner-pulse-delay-3" />

			{/* Add sparkle effects */}
			<div className="absolute inset-0 pointer-events-none">
				<div
					className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-1"
					style={{ top: "20%", left: "30%" }}
				/>
				<div
					className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-2"
					style={{ top: "70%", left: "80%" }}
				/>
				<div
					className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-3"
					style={{ top: "40%", left: "60%" }}
				/>
			</div>

			<div className="relative z-10">
				<div className="flex flex-col items-center space-y-4">
					{/* Pokemon sprite container */}
					<div className="relative h-40 flex items-center justify-center">
						<div className="relative flex items-center justify-center scale-125">
							<div className="w-[125px] h-[125px] flex items-center justify-center">
								<PokemonSprite
									pokemonId={pokemon.id}
									className="w-full h-full object-contain pixelated"
									isRevealed={true}
									name={
										i18n.language === "fr"
											? pokemon.frenchName
											: pokemon.englishName
									}
									isShiny={pokemon.isShiny}
								/>
							</div>
						</div>
					</div>

					{/* Pokemon name and details */}
					<div className="text-center space-y-2">
						<div className="bg-gradient-to-r from-blue-500/50 via-blue-600/50 to-blue-500/50 text-white px-6 py-2 rounded-full backdrop-blur-sm font-bold text-xl drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] flex items-center gap-2">
							<span className="text-blue-100">
								{i18n.language === "fr" ? "Tu es " : "You are "}
							</span>
							{i18n.language === "fr"
								? pokemon.frenchName
								: pokemon.englishName}
						</div>

						<div className="flex flex-wrap justify-center gap-2">
							{pokemon.isShiny && (
								<div className="flex items-center justify-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold text-sm shadow-lg">
									<Sparkles className="h-4 w-4 text-yellow-300" />
									<span>
										{i18n.language === "fr" ? "Chromatique ✨" : "Shiny ✨"}
									</span>
								</div>
							)}

							{pokemon.isLegendary && (
								<div className="flex items-center justify-center gap-1 bg-purple-500/80 text-white px-3 py-2 rounded-full text-sm font-medium">
									<Crown className="h-4 w-4" />
									<span>
										{i18n.language === "fr" ? "Légendaire" : "Legendary"}
									</span>
								</div>
							)}

							{pokemon.isMythical && (
								<div className="flex items-center justify-center gap-1 bg-pink-500/80 text-white px-3 py-2 rounded-full text-sm font-medium">
									<Star className="h-4 w-4" />
									<span>
										{i18n.language === "fr" ? "Mythique" : "Mythical"}
									</span>
								</div>
							)}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
