import { Crown, Sparkles, Star } from "lucide-react";
import React, { type FC } from "react";
import { useTranslation } from "react-i18next";
import { PokemonSprite } from "./PokemonSprite";
import type { Pokemon } from "./types";

interface RewardPokemonDisplayProps {
	pokemon: Pokemon | undefined;
	isLoading: boolean;
	totalPokemonCount: number;
	selectedGeneration: {
		name: string;
		startId: number;
		endId: number;
	};
	isSlotMachineRunning: boolean;
}

export const RewardPokemonDisplay: FC<RewardPokemonDisplayProps> = ({
	pokemon,
	isLoading,
	totalPokemonCount,
	isSlotMachineRunning,
}) => {
	const { t, i18n } = useTranslation();

	if (!pokemon && !isLoading) {
		return null;
	}

	return (
		<div className="relative bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl p-4 overflow-hidden">
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
					<div
						className={`relative w-40 h-40 ${isSlotMachineRunning ? "overflow-hidden" : ""}`}
					>
						{isLoading && !pokemon ? (
							<div className="absolute inset-0 flex items-center justify-center">
								<div className="w-20 h-20 animate-spin-slow">
									<img
										src="/pokeball.svg"
										alt="Loading..."
										className="w-full h-full"
									/>
								</div>
							</div>
						) : pokemon ? (
							<div
								className={`
								relative w-full h-full flex items-center justify-center
								${isSlotMachineRunning ? "animate-slot-machine" : "animate-reward-appear"}
							`}
							>
								<img
									src={pokemon.sprites.front_default}
									alt={pokemon.englishName}
									className="w-full h-full object-contain pixelated"
								/>
							</div>
						) : null}
					</div>

					{/* Pokemon name */}
					{pokemon && !isSlotMachineRunning && (
						<div className="text-center space-y-2 animate-fade-in">
							<div className="bg-gradient-to-r from-blue-500/50 via-blue-600/50 to-blue-500/50 text-white px-6 py-2 rounded-full backdrop-blur-sm font-bold text-xl animate-fade-in drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)] flex items-center gap-2">
								<span className="text-blue-100">
									{i18n.language === "fr" ? "Tu es" : "You are"}
								</span>
								{i18n.language === "fr"
									? pokemon.frenchName
									: pokemon.englishName}
							</div>
							{pokemon.isShiny && (
								<div className="flex items-center justify-center gap-1 text-yellow-300">
									<Sparkles className="h-4 w-4" />
									<span className="text-sm font-medium">
										{i18n.language === "fr" ? "Chromatique" : "Shiny"}
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
