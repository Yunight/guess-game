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

const CACHE_VERSION = "1.0.1"; // Bumped version for mobile fixes
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

// Mobile detection utilities
const isMobile = () => {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent,
	);
};

const isIOS = () => {
	return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

// Adaptive batch sizes based on device
const getBatchSize = () => {
	if (isMobile()) {
		return isIOS() ? 3 : 5; // Smaller batches for iOS
	}
	return 20; // Original size for desktop
};

// Maximum preload count for mobile devices
const getMaxPreloadCount = () => {
	if (isMobile()) {
		return 30; // Only preload first 30 Pokemon on mobile
	}
	return Number.POSITIVE_INFINITY; // No limit on desktop
};

export const ResourcePreloader = ({ onComplete, children }: PreloaderProps) => {
	const [isLoading, setIsLoading] = useState(true);
	const [progress, setProgress] = useState(0);
	const [loadingMessage, setLoadingMessage] = useState(
		"Loading Pokémon resources...",
	);
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
				const maxPreload = getMaxPreloadCount();
				const actualEndId = Math.min(endId, startId + maxPreload - 1);
				const shouldSkipAudio = isIOS(); // Skip audio on iOS due to restrictions

				// Calculate total resources (sprites only on iOS, sprites + audio on others)
				const totalPokemon = actualEndId - startId + 1;
				const totalResources = shouldSkipAudio
					? totalPokemon
					: totalPokemon * 2;
				let loadedResources = 0;

				// Check if cache is valid for this generation
				const isCacheValid =
					resourceCache.version === CACHE_VERSION &&
					resourceCache.loadedResources[gen.name] &&
					Date.now() - resourceCache.lastUpdated < CACHE_DURATION;

				if (isCacheValid && !isBackground) {
					// Cache is valid, skip preloading
					setIsLoading(false);
					onComplete?.();
					return;
				}

				if (!isBackground) {
					setLoadingMessage(
						shouldSkipAudio
							? "Loading Pokémon sprites..."
							: "Loading Pokémon resources...",
					);
				}

				const pokemonIds = Array.from(
					{ length: totalPokemon },
					(_, i) => startId + i,
				);

				const batchSize = getBatchSize();
				const batches = [];
				for (let i = 0; i < pokemonIds.length; i += batchSize) {
					batches.push(pokemonIds.slice(i, i + batchSize));
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
							const timeoutId = setTimeout(
								() => {
									// Timeout after 10 seconds on mobile, 30 seconds on desktop
									const timeout = isMobile() ? 10000 : 30000;
									loadedResources++;
									if (!isBackground) {
										setProgress(
											Math.round((loadedResources / totalResources) * 100),
										);
									}
									resolve(id);
								},
								isMobile() ? 10000 : 30000,
							);

							img.onload = () => {
								clearTimeout(timeoutId);
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
								clearTimeout(timeoutId);
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

					// Only preload audio if not on iOS
					const cryPromises = shouldSkipAudio
						? []
						: batch.map((id) => {
								const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
								return new Promise<number>((resolve) => {
									const audio = new Audio();
									const timeoutId = setTimeout(
										() => {
											loadedResources++;
											if (!isBackground) {
												setProgress(
													Math.round((loadedResources / totalResources) * 100),
												);
											}
											resolve(id);
										},
										isMobile() ? 5000 : 15000,
									); // Shorter timeout for audio on mobile

									audio.oncanplaythrough = () => {
										clearTimeout(timeoutId);
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
										clearTimeout(timeoutId);
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

					// Add a small delay between batches on mobile to prevent overwhelming
					if (isMobile() && batches.indexOf(batch) < batches.length - 1) {
						await new Promise((resolve) => setTimeout(resolve, 100));
					}
				}

				setResourceCache(newCache);

				if (!isBackground) {
					setIsLoading(false);
					onComplete?.();
				}
			} catch (error) {
				console.error(
					"Error preloading resources for generation:",
					gen.name,
					error,
				);
				// Don't let preloading errors block the app
				if (!isBackground) {
					setIsLoading(false);
					onComplete?.();
				}
			}
		},
		[resourceCache, setResourceCache, onComplete],
	);

	const preloadAdjacentGenerations = useCallback(
		async (currentGen: Generation) => {
			// Skip adjacent preloading on mobile to save bandwidth and memory
			if (isMobile()) {
				return;
			}

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
				setLoadingMessage("Initializing game...");

				// On mobile, add a shorter timeout to prevent infinite loading
				if (isMobile()) {
					const timeoutPromise = new Promise<void>((resolve) => {
						setTimeout(() => {
							console.warn(
								"Mobile preloading timeout reached, proceeding without full preload",
							);
							resolve();
						}, 15000); // 15 second timeout on mobile
					});

					const preloadPromise = preloadGeneration(generation);

					await Promise.race([preloadPromise, timeoutPromise]);
				} else {
					// Full preloading on desktop
					await preloadGeneration(generation);
				}

				setIsLoading(false);
				onComplete?.();

				// Then, silently preload adjacent generations in the background (desktop only)
				if (!isMobile()) {
					preloadAdjacentGenerations(generation);
				}
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
				<div className="text-center max-w-xs mx-auto px-4">
					<div className="pokeball-loading mx-auto">
						<div className="outer-circle" />
						<div className="center-circle" />
					</div>
					<p className="text-white mt-4 font-medium text-sm">
						{loadingMessage}
					</p>
					{progress > 0 && (
						<>
							<div className="mt-2 w-full h-2 bg-gray-700 rounded-full overflow-hidden">
								<div
									className="h-full bg-blue-500 transition-all duration-300 ease-out"
									style={{ width: `${progress}%` }}
								/>
							</div>
							<p className="text-white/80 text-xs mt-1">{progress}%</p>
						</>
					)}
					{isMobile() && (
						<p className="text-white/60 text-xs mt-2">
							Mobile optimized loading...
						</p>
					)}
				</div>
			</div>
		);
	}

	return <>{children}</>;
};
