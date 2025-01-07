import { useEffect, useState } from "react";
import { useAppSelector } from "../../hooks/store";
import { useLocalStorage } from "../../hooks/useLocalStorage";
import type { RootState } from "../../store/store";
import type { Generation } from "./types";

interface PreloaderProps {
	onComplete?: () => void;
	children: React.ReactNode;
}

interface ResourceCache {
	version: string;
	generation: string;
	lastUpdated: number;
	loadedResources: {
		sprites: number[];
		cries: number[];
	};
}

const CACHE_VERSION = "1.0.0";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours
const DEFAULT_GENERATION: Generation = {
	name: "Kanto",
	startId: 1,
	endId: 151,
};

const BATCH_SIZE = 20;

export const ResourcePreloader = ({ onComplete, children }: PreloaderProps) => {
	const [isLoading, setIsLoading] = useState(true);
	const [progress, setProgress] = useState(0);
	const generation =
		useAppSelector((state: RootState) => state.game?.selectedGeneration) ||
		DEFAULT_GENERATION;
	const [resourceCache, setResourceCache] = useLocalStorage<ResourceCache>(
		"pokemon-resource-cache",
		{
			version: CACHE_VERSION,
			generation: "",
			lastUpdated: 0,
			loadedResources: {
				sprites: [],
				cries: [],
			},
		},
	);

	useEffect(() => {
		const preloadResources = async () => {
			try {
				const startId = generation.startId;
				const endId = generation.endId;
				const totalResources = (endId - startId + 1) * 2;
				let loadedResources = 0;

				// Check if cache is valid
				const isCacheValid =
					resourceCache.version === CACHE_VERSION &&
					resourceCache.generation === generation.name &&
					Date.now() - resourceCache.lastUpdated < CACHE_DURATION;

				if (isCacheValid) {
					setIsLoading(false);
					onComplete?.();
					return;
				}

				const pokemonIds = Array.from(
					{ length: endId - startId + 1 },
					(_, i) => startId + i,
				);

				const batches = [];
				for (let i = 0; i < pokemonIds.length; i += BATCH_SIZE) {
					batches.push(pokemonIds.slice(i, i + BATCH_SIZE));
				}

				const newCache: ResourceCache = {
					version: CACHE_VERSION,
					generation: generation.name,
					lastUpdated: Date.now(),
					loadedResources: {
						sprites: [],
						cries: [],
					},
				};

				for (const batch of batches) {
					const spritePromises = batch.map((id) => {
						const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
						return new Promise<number>((resolve) => {
							const img = new Image();
							img.onload = () => {
								loadedResources++;
								setProgress(
									Math.round((loadedResources / totalResources) * 100),
								);
								newCache.loadedResources.sprites.push(id);
								resolve(id);
							};
							img.onerror = () => {
								loadedResources++;
								setProgress(
									Math.round((loadedResources / totalResources) * 100),
								);
								resolve(id);
							};
							img.src = spriteUrl;
						});
					});

					const cryPromises = batch.map((id) => {
						const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
						return new Promise<number>((resolve) => {
							const audio = new Audio();
							audio.oncanplaythrough = () => {
								loadedResources++;
								setProgress(
									Math.round((loadedResources / totalResources) * 100),
								);
								newCache.loadedResources.cries.push(id);
								resolve(id);
							};
							audio.onerror = () => {
								loadedResources++;
								setProgress(
									Math.round((loadedResources / totalResources) * 100),
								);
								resolve(id);
							};
							audio.src = cryUrl;
							audio.preload = "auto";
						});
					});

					await Promise.all([...spritePromises, ...cryPromises]);
				}

				setResourceCache(newCache);
				setIsLoading(false);
				onComplete?.();
			} catch (error) {
				console.error("Error preloading resources:", error);
				setIsLoading(false);
				onComplete?.();
			}
		};

		preloadResources();
	}, [generation, onComplete, resourceCache, setResourceCache]);

	if (isLoading) {
		return (
			<div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
				<div className="text-center">
					<div className="pokeball-loading mx-auto">
						<div className="outer-circle" />
						<div className="center-circle" />
					</div>
					<p className="text-white mt-4 font-medium">
						Loading Pokémon resources...
					</p>
					<div className="mt-2 w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
						<div
							className="h-full bg-blue-500 transition-all duration-300 ease-out"
							style={{ width: `${progress}%` }}
						/>
					</div>
					<p className="text-white/80 text-sm mt-1">{progress}%</p>
				</div>
			</div>
		);
	}

	return <>{children}</>;
};
