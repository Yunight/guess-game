import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface PokemonSpriteProps {
	pokemonId: number;
	className?: string;
	isRevealed?: boolean;
	name?: string;
	isShiny?: boolean;
}

const imageCache = new Map<string, HTMLImageElement>();

const isImageCached = (url: string): boolean => imageCache.has(url);

export const PokemonSprite = ({
	pokemonId,
	className,
	isRevealed = true,
	isShiny = false,
}: PokemonSpriteProps): JSX.Element => {
	const [homeError, setHomeError] = useState(false);
	const [regularError, setRegularError] = useState(false);
	const [isLoaded, setIsLoaded] = useState(false);

	const homeArtworkUrl = isShiny
		? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/shiny/${pokemonId}.png`
		: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`;

	const regularSpriteUrl = isShiny
		? `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/${pokemonId}.png`
		: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;

	const fallbackSprite = "/pokeball.svg";

	const spriteUrl = homeError ? regularSpriteUrl : homeArtworkUrl;

	useEffect(() => {
		void pokemonId;
		void isShiny;
		setHomeError(false);
		setRegularError(false);
		setIsLoaded(isImageCached(spriteUrl));
	}, [pokemonId, isShiny, spriteUrl]);

	useEffect(() => {
		const preloadImage = async (url: string): Promise<void> => {
			if (imageCache.has(url)) {
				return;
			}

			try {
				const img = new Image();
				const loadPromise = new Promise<void>((resolve, reject) => {
					img.onload = () => resolve();
					img.onerror = () => reject(new Error("preload_failed"));
				});
				img.src = url;
				await loadPromise;
				imageCache.set(url, img);
			} catch (error: unknown) {
				if (error instanceof Error) {
					console.error(`Failed to preload image: ${url}`, error);
				}
			}
		};

		void preloadImage(homeArtworkUrl);
		void preloadImage(regularSpriteUrl);
	}, [homeArtworkUrl, regularSpriteUrl]);

	const showSilhouette = isLoaded && !isRevealed;

	return (
		<div className={cn("relative w-32 h-32 flex items-center justify-center", className)}>
			<img
				src={spriteUrl}
				alt=""
				className={cn(
					"w-full h-full object-contain transition-opacity duration-300",
					!isLoaded && "opacity-0",
					showSilhouette && "brightness-0",
					regularError && "w-16 h-16",
					!regularError && "image-rendering-auto",
				)}
				style={{
					transform: "scale(1.2)",
					transformOrigin: "center",
					filter:
						showSilhouette && !regularError
							? "drop-shadow(0 0 2px black) drop-shadow(0 0 2px black) drop-shadow(0 0 2px black) drop-shadow(0 0 2px black)"
							: "none",
				}}
				onLoad={(e) => {
					setIsLoaded(true);
					imageCache.set(spriteUrl, e.currentTarget);
				}}
				onError={(e) => {
					if (!homeError) {
						setHomeError(true);
						setIsLoaded(isImageCached(regularSpriteUrl));
						e.currentTarget.src = regularSpriteUrl;
					} else if (!regularError) {
						setRegularError(true);
						setIsLoaded(true);
						e.currentTarget.src = fallbackSprite;
					}
				}}
				loading="eager"
			/>
		</div>
	);
};
