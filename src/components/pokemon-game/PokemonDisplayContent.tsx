import { PokemonSprite } from "./PokemonSprite";
import {
	getLocalizedPokemonName,
	getShinyLabel,
	type PokemonDisplayState,
} from "./pokemonDisplayState";
import type { Pokemon } from "./types";

interface PokemonDisplayContentProps {
	displayedPokemon: Pokemon;
	displayState: PokemonDisplayState;
	language: string;
}

const RevealRingEffects = ({
	isShiny,
}: {
	isShiny: boolean;
}): JSX.Element => {
	const primaryBorder = isShiny ? "border-yellow-400/50" : "border-blue-400/30";
	const secondaryBorder = isShiny
		? "border-yellow-400/40"
		: "border-blue-400/20";

	return (
		<div className="absolute inset-0 pointer-events-none">
			<div className="absolute inset-0 animate-ring-expand">
				<div
					className={`absolute inset-0 border-4 ${primaryBorder} rounded-full`}
				/>
			</div>
			<div className="absolute inset-0 animate-ring-expand-delayed">
				<div
					className={`absolute inset-0 border-4 ${secondaryBorder} rounded-full`}
				/>
			</div>
			<div
				className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
				style={{ top: "20%", left: "30%", animationDuration: "1s" }}
			/>
			<div
				className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
				style={{ top: "70%", left: "80%", animationDuration: "1.2s" }}
			/>
			<div
				className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
				style={{ top: "40%", left: "60%", animationDuration: "0.8s" }}
			/>
			{isShiny && (
				<>
					<div
						className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping"
						style={{ top: "30%", left: "20%", animationDuration: "1.3s" }}
					/>
					<div
						className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping"
						style={{ top: "60%", left: "70%", animationDuration: "0.9s" }}
					/>
					<div
						className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping"
						style={{ top: "45%", left: "40%", animationDuration: "1.1s" }}
					/>
				</>
			)}
		</div>
	);
};

export const PokemonDisplayContent = ({
	displayedPokemon,
	displayState,
	language,
}: PokemonDisplayContentProps): JSX.Element => {
	const localizedName = getLocalizedPokemonName(displayedPokemon, language);
	const isRevealed = displayState === "revealed";
	const isReady = displayState === "ready";

	const spriteClassName = isRevealed
		? "animate-reveal-pokemon"
		: isReady
			? "animate-appear-pokemon"
			: "opacity-0";

	return (
		<div
			className={`relative w-full h-full flex items-center justify-center ${
				isRevealed ? "animate-reveal-pokemon" : ""
			}`}
		>
			<div className="absolute top-2 left-0 right-0 flex justify-center items-center gap-2 z-20">
				{displayedPokemon.isShiny && (
					<div className="bg-yellow-400/90 text-black px-4 py-1 rounded-full font-bold text-sm">
						{getShinyLabel(language)}
					</div>
				)}
				{isRevealed && (
					<div className="bg-gradient-to-r from-blue-500/50 via-blue-600/50 to-blue-500/50 text-white px-6 py-2 rounded-full backdrop-blur-sm font-bold text-xl animate-fade-in drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
						{localizedName}
					</div>
				)}
			</div>

			<PokemonSprite
				pokemonId={displayedPokemon.id}
				className={`w-auto h-[65%] max-w-full mt-5 mb-4 ${spriteClassName}`}
				isRevealed={isRevealed}
				name={localizedName}
				isShiny={displayedPokemon.isShiny}
			/>

			{isRevealed && <RevealRingEffects isShiny={displayedPokemon.isShiny} />}
		</div>
	);
};

export const PokemonDisplayLoading = (): JSX.Element => (
	<div className="pokeball-loading">
		<div className="outer-circle" />
		<div className="middle-line" />
		<div className="center-circle" />
	</div>
);
