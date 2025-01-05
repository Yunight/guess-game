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
	name = "Pokemon",
	isShiny = false,
}: PokemonSpriteProps) => {
	const [homeError, setHomeError] = useState(false);
	const [regularError, setRegularError] = useState(false);

	// URLs for different sprite versions
	const homeUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${isShiny ? "shiny/" : ""}${pokemonId}.png`;
	const regularSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${isShiny ? "shiny/" : ""}${pokemonId}.png`;
	const fallbackSprite = "/pokeball.svg";

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
		preloadImage(homeUrl);
		preloadImage(regularSpriteUrl);
	}, [homeUrl, regularSpriteUrl]);

	// Determine which sprite URL to use
	const spriteUrl = regularError
		? fallbackSprite
		: homeError
			? regularSpriteUrl
			: homeUrl;

	return (
		<div
			className={cn(
				"relative w-32 h-32 flex items-center justify-center",
				className,
			)}
		>
			<img
				src={spriteUrl}
				alt={name}
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
