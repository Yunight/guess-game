import { useCallback, useEffect, useState } from "react";
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
	lastUpdated: number;
	loadedResources: {
		[generation: string]: {
			sprites: number[];
			cries: number[];
		};
	};
}

const CACHE_VERSION = "1.0.0";
const CACHE_DURATION = 12 * 60 * 60 * 1000; // 12 hours
const DEFAULT_GENERATION: Generation = {
	name: "Kanto",
	startId: 1,
	endId: 151,
};

const GENERATIONS: Generation[] = [
	{ name: "1ère Génération", startId: 1, endId: 151 },
	{ name: "2ème Génération", startId: 152, endId: 251 },
	{ name: "3ème Génération", startId: 252, endId: 386 },
	{ name: "4ème Génération", startId: 387, endId: 493 },
	{ name: "5ème Génération", startId: 494, endId: 649 },
	{ name: "6ème Génération", startId: 650, endId: 721 },
	{ name: "7ème Génération", startId: 722, endId: 809 },
	{ name: "8ème Génération", startId: 810, endId: 905 },
	{ name: "9ème Génération", startId: 906, endId: 1010 },
];

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
			lastUpdated: 0,
			loadedResources: {},
		},
	);

	const preloadGeneration = useCallback(
		async (gen: Generation, isBackground = false) => {
			try {
				const startId = gen.startId;
				const endId = gen.endId;
				const totalResources = (endId - startId + 1) * 2;
				let loadedResources = 0;

				// Check if cache is valid for this generation
				const isCacheValid =
					resourceCache.version === CACHE_VERSION &&
					resourceCache.loadedResources[gen.name] &&
					Date.now() - resourceCache.lastUpdated < CACHE_DURATION;

				if (isCacheValid) {
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
					...resourceCache,
					version: CACHE_VERSION,
					lastUpdated: Date.now(),
					loadedResources: {
						...resourceCache.loadedResources,
						[gen.name]: {
							sprites: [] as number[],
							cries: [] as number[],
						},
					},
				};

				for (const batch of batches) {
					const spritePromises = batch.map((id) => {
						const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
						return new Promise<number>((resolve) => {
							const img = new Image();
							img.onload = () => {
								loadedResources++;
								if (!isBackground) {
									setProgress(
										Math.round((loadedResources / totalResources) * 100),
									);
								}
								newCache.loadedResources[gen.name].sprites.push(id);
								resolve(id);
							};
							img.onerror = () => {
								loadedResources++;
								if (!isBackground) {
									setProgress(
										Math.round((loadedResources / totalResources) * 100),
									);
								}
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
								if (!isBackground) {
									setProgress(
										Math.round((loadedResources / totalResources) * 100),
									);
								}
								newCache.loadedResources[gen.name].cries.push(id);
								resolve(id);
							};
							audio.onerror = () => {
								loadedResources++;
								if (!isBackground) {
									setProgress(
										Math.round((loadedResources / totalResources) * 100),
									);
								}
								resolve(id);
							};
							audio.src = cryUrl;
							audio.preload = "auto";
						});
					});

					await Promise.all([...spritePromises, ...cryPromises]);
				}

				setResourceCache(newCache);
			} catch (error) {
				console.error(
					"Error preloading resources for generation:",
					gen.name,
					error,
				);
			}
		},
		[resourceCache, setResourceCache],
	);

	const preloadAdjacentGenerations = useCallback(
		async (currentGen: Generation) => {
			const currentIndex = GENERATIONS.findIndex(
				(gen) => gen.name === currentGen.name,
			);
			if (currentIndex === -1) return;

			// Get previous and next generations if they exist
			const prevGen = currentIndex > 0 ? GENERATIONS[currentIndex - 1] : null;
			const nextGen =
				currentIndex < GENERATIONS.length - 1
					? GENERATIONS[currentIndex + 1]
					: null;

			// Preload adjacent generations in the background
			if (prevGen) {
				await preloadGeneration(prevGen, true);
			}
			if (nextGen) {
				await preloadGeneration(nextGen, true);
			}
		},
		[preloadGeneration],
	);

	useEffect(() => {
		const loadResources = async () => {
			try {
				// First, load the current generation
				await preloadGeneration(generation);
				setIsLoading(false);
				onComplete?.();

				// Then, silently preload adjacent generations in the background
				preloadAdjacentGenerations(generation);
			} catch (error) {
				console.error("Error in resource preloader:", error);
				setIsLoading(false);
				onComplete?.();
			}
		};

		loadResources();
	}, [generation, onComplete, preloadGeneration, preloadAdjacentGenerations]);

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
