import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PokemonSpriteProps {
	pokemonId: number;
	className?: string;
	isRevealed?: boolean;
	name?: string;
	isShiny?: boolean;
}

// Cache for preloaded images
const imageCache = new Map<string, HTMLImageElement>();

export const PokemonSprite = ({
	pokemonId,
	className,
	isRevealed = true,
	isShiny = false,
}: PokemonSpriteProps) => {
	const [homeError, setHomeError] = useState(false);
	const [regularError, setRegularError] = useState(false);

	// Use shiny sprite URL if isShiny is true
	const homeArtworkUrl = isShiny
		? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${pokemonId}.png`
		: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`;

	const regularSpriteUrl = isShiny
		? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`
		: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

	const fallbackSprite = "/pokeball.png";

	const spriteUrl = homeError ? regularSpriteUrl : homeArtworkUrl;

	// Preload images
	useEffect(() => {
		const preloadImage = async (url: string) => {
			if (imageCache.has(url)) return;

			try {
				const img = new Image();
				const loadPromise = new Promise((resolve, reject) => {
					img.onload = resolve;
					img.onerror = reject;
				});
				img.src = url;
				await loadPromise;
				imageCache.set(url, img);
			} catch (error) {
				console.error(`Failed to preload image: ${url}`, error);
			}
		};

		// Preload both home and regular sprites
		preloadImage(homeArtworkUrl);
		preloadImage(regularSpriteUrl);
	}, [homeArtworkUrl, regularSpriteUrl]);

	return (
		<div
			className={cn(
				"relative w-32 h-32 flex items-center justify-center",
				className,
			)}
		>
			<img
				src={spriteUrl}
				className={cn(
					"w-full h-full object-contain transition-opacity duration-300",
					!isRevealed && "brightness-0",
					regularError && "w-16 h-16", // Make fallback image smaller
					!regularError && "image-rendering-auto", // Better rendering for artwork
				)}
				style={{
					transform: "scale(1.2)", // Slightly larger
					transformOrigin: "center",
					filter: !regularError
						? "drop-shadow(0 0 2px black) drop-shadow(0 0 2px black) drop-shadow(0 0 2px black) drop-shadow(0 0 2px black)"
						: "none", // Quadruple drop-shadow for thicker black outline
				}}
				onError={(e) => {
					if (!homeError) {
						setHomeError(true);
						e.currentTarget.src = regularSpriteUrl;
					} else if (!regularError) {
						setRegularError(true);
						e.currentTarget.src = fallbackSprite;
					}
				}}
				loading="eager" // Changed from lazy to eager for immediate loading
			/>
		</div>
	);
};
