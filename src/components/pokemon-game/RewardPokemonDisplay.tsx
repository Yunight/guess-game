import { Crown, Sparkles, Star } from "lucide-react";
import type { FC } from "react";
import { useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PokemonSprite } from "./PokemonSprite";

import type { Pokemon } from "./types";

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
	const { t, i18n } = useTranslation();
	const previousPokemonRef = useRef<Pokemon | undefined>();
	const transitionTimeoutRef = useRef<NodeJS.Timeout>();

	// Effect to handle the transition between slot machine and final Pokemon
	useEffect(() => {
		if (
			!isSlotMachineRunning &&
			pokemon &&
			pokemon !== previousPokemonRef.current
		) {
			// Clear any existing timeout
			if (transitionTimeoutRef.current) {
				clearTimeout(transitionTimeoutRef.current);
			}
			// Update the previous Pokemon reference after a short delay
			transitionTimeoutRef.current = setTimeout(() => {
				previousPokemonRef.current = pokemon;
			}, 100);
		}
		return () => {
			if (transitionTimeoutRef.current) {
				clearTimeout(transitionTimeoutRef.current);
			}
		};
	}, [isSlotMachineRunning, pokemon]);

	if (!pokemon && !isLoading && !spinningPokemon) {
		return null;
	}

	// Check if Pokemon is from the selected generation
	const currentPokemon = isSlotMachineRunning ? spinningPokemon : pokemon;
	if (
		currentPokemon &&
		(currentPokemon.id < selectedGeneration.startId ||
			currentPokemon.id > selectedGeneration.endId)
	) {
		console.error("Pokemon not from selected generation:", {
			pokemonId: currentPokemon.id,
			generation: selectedGeneration,
		});
		return null;
	}

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
					{/* Pokemon sprite container with vertical animation */}
					<div className="relative h-40 flex items-center justify-center">
						{isLoading && !currentPokemon ? (
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="w-20 h-20 animate-spin-slow">
									<img
										src="/pokeball.svg"
										alt="Loading..."
										className="w-full h-full"
									/>
								</div>
							</div>
						) : currentPokemon ? (
							<div
								className={`
								relative flex items-center justify-center
								${isSlotMachineRunning ? "animate-slide-up" : "animate-bounce-in"}
								transition-transform duration-300 ease-in-out
							`}
								style={{
									transform: isSlotMachineRunning
										? "translateY(-100%)"
										: "none",
									animation: isSlotMachineRunning
										? "slideUp 0.03s linear infinite"
										: undefined,
									opacity:
										!isSlotMachineRunning &&
										pokemon !== previousPokemonRef.current
											? 0
											: 1,
									transition: !isSlotMachineRunning
										? "opacity 0.1s ease-in-out"
										: "none",
									scale: "1.3",
								}}
							>
								<div className="w-[125px] h-[125px] flex items-center justify-center">
									<PokemonSprite
										pokemonId={currentPokemon.id}
										className="w-full h-full object-contain pixelated"
										isRevealed={!isSlotMachineRunning}
										name={
											i18n.language === "fr"
												? currentPokemon.frenchName
												: currentPokemon.englishName
										}
										isShiny={currentPokemon.isShiny}
									/>
								</div>
							</div>
						) : null}
					</div>

					{/* Pokemon name - only show for final Pokemon */}
					{pokemon &&
						!isSlotMachineRunning &&
						pokemon === previousPokemonRef.current && (
							<div className="text-center space-y-2 animate-fade-in">
								<div className="bg-gradient-to-r from-blue-500/50 via-blue-600/50 to-blue-500/50 text-white px-6 py-2 rounded-full backdrop-blur-sm font-bold text-xl animate-fade-in drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] flex items-center gap-2">
									<span className="text-blue-100">
										{i18n.language === "fr" ? "Tu es " : "You are "}
									</span>
									{i18n.language === "fr"
										? pokemon.frenchName
										: pokemon.englishName}
								</div>
								{pokemon.isShiny && (
									<div className="flex items-center justify-center gap-2 bg-yellow-500 text-black px-4 py-2 rounded-full font-bold text-lg shadow-lg animate-pulse-custom">
										<Sparkles className="h-5 w-5 text-yellow-300" />
										<span>
											{i18n.language === "fr" ? "Chromatique ✨" : "Shiny ✨"}
										</span>
									</div>
								)}
								{pokemon.isLegendary && (
									<div className="flex items-center justify-center gap-1 text-purple-300">
										<Crown className="h-4 w-4" />
										<span className="text-sm font-medium">
											{i18n.language === "fr" ? "Légendaire" : "Legendary"}
										</span>
									</div>
								)}
								{pokemon.isMythical && (
									<div className="flex items-center justify-center gap-1 text-pink-300">
										<Star className="h-4 w-4" />
										<span className="text-sm font-medium">
											{i18n.language === "fr" ? "Mythique" : "Mythical"}
										</span>
									</div>
								)}
							</div>
						)}
				</div>
			</div>
		</div>
	);
};
