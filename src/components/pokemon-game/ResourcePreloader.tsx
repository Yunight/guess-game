import { useCallback, useEffect, useMemo, useState } from "react";
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
			failedSprites: number[];
			failedCries: number[];
		};
	};
}

const CACHE_VERSION = "1.0.2"; // Bumped for optimization
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

// Enhanced mobile detection utilities
const isMobile = () => {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		navigator.userAgent,
	);
};

const isIOS = () => {
	return /iPad|iPhone|iPod/.test(navigator.userAgent);
};

const isLowEndDevice = () => {
	// Check for low-end device indicators
	const memory = (navigator as unknown as { deviceMemory?: number })
		.deviceMemory;
	const hardwareConcurrency = navigator.hardwareConcurrency;

	return (
		(memory && memory <= 2) || // 2GB or less RAM
		(hardwareConcurrency && hardwareConcurrency <= 2) || // 2 cores or less
		isMobile()
	);
};

// Adaptive configuration based on device capabilities
const getDeviceConfig = () => {
	const isLowEnd = isLowEndDevice();
	const mobile = isMobile();
	const ios = isIOS();

	return {
		batchSize: ios ? 2 : mobile ? 3 : isLowEnd ? 5 : 15,
		maxPreload: mobile ? 20 : isLowEnd ? 30 : 50,
		timeout: mobile ? 8000 : 15000,
		audioTimeout: ios ? 3000 : mobile ? 5000 : 10000,
		skipAudio: ios, // Skip audio on iOS due to restrictions
		enableParallelLoading: !isLowEnd,
		delayBetweenBatches: mobile ? 200 : 100,
	};
};

// Optimized image preloader with connection-aware loading
const preloadImage = (url: string, timeout: number): Promise<boolean> => {
	return new Promise((resolve) => {
		const img = new Image();
		const timeoutId = setTimeout(() => {
			cleanup();
			resolve(false);
		}, timeout);

		const cleanup = () => {
			clearTimeout(timeoutId);
			img.onload = null;
			img.onerror = null;
		};

		img.onload = () => {
			cleanup();
			resolve(true);
		};

		img.onerror = () => {
			cleanup();
			resolve(false);
		};

		// Use loading="eager" for immediate loading
		img.loading = "eager";
		img.src = url;
	});
};

// Optimized audio preloader
const preloadAudio = (url: string, timeout: number): Promise<boolean> => {
	return new Promise((resolve) => {
		const audio = new Audio();
		const timeoutId = setTimeout(() => {
			cleanup();
			resolve(false);
		}, timeout);

		const cleanup = () => {
			clearTimeout(timeoutId);
			audio.oncanplaythrough = null;
			audio.onerror = null;
			audio.remove?.();
		};

		audio.oncanplaythrough = () => {
			cleanup();
			resolve(true);
		};

		audio.onerror = () => {
			cleanup();
			resolve(false);
		};

		audio.preload = "auto";
		audio.src = url;
	});
};

export const ResourcePreloader = ({ onComplete, children }: PreloaderProps) => {
	const [isLoading, setIsLoading] = useState(true);
	const [progress, setProgress] = useState(0);
	const [loadingMessage, setLoadingMessage] = useState("Initializing...");
	const [currentPhase, setCurrentPhase] = useState<
		"sprites" | "audio" | "complete"
	>("sprites");

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

	// Device configuration (removed memoization to avoid circular dependencies)
	const deviceConfig = getDeviceConfig();

	// Device configuration (removed memoization to avoid circular dependencies)

	const preloadGeneration = useCallback(
		async (gen: Generation, isBackground = false) => {
			try {
				const startId = gen.startId;
				const endId = gen.endId;
				const maxPreload = deviceConfig.maxPreload;
				const actualEndId = Math.min(endId, startId + maxPreload - 1);
				const totalPokemon = actualEndId - startId + 1;
				const config = deviceConfig;

				// Check cache validity
				const isCacheValid =
					resourceCache.version === CACHE_VERSION &&
					resourceCache.loadedResources[gen.name] &&
					Date.now() - resourceCache.lastUpdated < CACHE_DURATION;

				if (isCacheValid && !isBackground) {
					setIsLoading(false);
					onComplete?.();
					return;
				}

				if (!isBackground) {
					setLoadingMessage("Loading Pokémon sprites...");
					setCurrentPhase("sprites");
				}

				const pokemonIds = Array.from(
					{ length: totalPokemon },
					(_, i) => startId + i,
				);

				// Create batches for loading
				const batches = [];
				for (let i = 0; i < pokemonIds.length; i += config.batchSize) {
					batches.push(pokemonIds.slice(i, i + config.batchSize));
				}

				const newCache: ResourceCache = {
					...resourceCache,
					version: CACHE_VERSION,
					lastUpdated: Date.now(),
					loadedResources: {
						...resourceCache.loadedResources,
						[gen.name]: {
							sprites: [],
							cries: [],
							failedSprites: [],
							failedCries: [],
						},
					},
				};

				let loadedCount = 0;
				const totalResources = config.skipAudio
					? totalPokemon
					: totalPokemon * 2;

				// Load sprites
				for (const [index, batch] of batches.entries()) {
					if (config.enableParallelLoading) {
						// Parallel loading for better devices
						const spritePromises = batch.map(async (id) => {
							const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
							const success = await preloadImage(spriteUrl, config.timeout);

							loadedCount++;
							if (!isBackground) {
								setProgress(Math.round((loadedCount / totalResources) * 100));
							}

							if (success) {
								newCache.loadedResources[gen.name].sprites.push(id);
							} else {
								newCache.loadedResources[gen.name].failedSprites.push(id);
							}

							return success;
						});

						await Promise.allSettled(spritePromises);
					} else {
						// Sequential loading for low-end devices
						for (const id of batch) {
							const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
							const success = await preloadImage(spriteUrl, config.timeout);

							loadedCount++;
							if (!isBackground) {
								setProgress(Math.round((loadedCount / totalResources) * 100));
							}

							if (success) {
								newCache.loadedResources[gen.name].sprites.push(id);
							} else {
								newCache.loadedResources[gen.name].failedSprites.push(id);
							}
						}
					}

					// Add delay between batches to prevent overwhelming
					if (index < batches.length - 1) {
						await new Promise((resolve) =>
							setTimeout(resolve, config.delayBetweenBatches),
						);
					}
				}

				// Load audio if not skipped
				if (!config.skipAudio) {
					if (!isBackground) {
						setLoadingMessage("Loading Pokémon cries...");
						setCurrentPhase("audio");
					}

					for (const [index, batch] of batches.entries()) {
						if (config.enableParallelLoading) {
							const cryPromises = batch.map(async (id) => {
								const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
								const success = await preloadAudio(cryUrl, config.audioTimeout);

								loadedCount++;
								if (!isBackground) {
									setProgress(Math.round((loadedCount / totalResources) * 100));
								}

								if (success) {
									newCache.loadedResources[gen.name].cries.push(id);
								} else {
									newCache.loadedResources[gen.name].failedCries.push(id);
								}

								return success;
							});

							await Promise.allSettled(cryPromises);
						} else {
							for (const id of batch) {
								const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
								const success = await preloadAudio(cryUrl, config.audioTimeout);

								loadedCount++;
								if (!isBackground) {
									setProgress(Math.round((loadedCount / totalResources) * 100));
								}

								if (success) {
									newCache.loadedResources[gen.name].cries.push(id);
								} else {
									newCache.loadedResources[gen.name].failedCries.push(id);
								}
							}
						}

						if (index < batches.length - 1) {
							await new Promise((resolve) =>
								setTimeout(resolve, config.delayBetweenBatches),
							);
						}
					}
				}

				setResourceCache(newCache);

				if (!isBackground) {
					setCurrentPhase("complete");
					setIsLoading(false);
					onComplete?.();
				}

				console.log(`✅ Preloaded ${gen.name}:`, {
					sprites: newCache.loadedResources[gen.name].sprites.length,
					cries: newCache.loadedResources[gen.name].cries.length,
					failedSprites:
						newCache.loadedResources[gen.name].failedSprites.length,
					failedCries: newCache.loadedResources[gen.name].failedCries.length,
				});
			} catch (error) {
				console.error(
					"Error preloading resources for generation:",
					gen.name,
					error,
				);
				if (!isBackground) {
					setIsLoading(false);
					onComplete?.();
				}
			}
		},
		[deviceConfig, resourceCache, setResourceCache, onComplete],
	);

	const preloadAdjacentGenerations = useCallback(
		async (currentGen: Generation) => {
			// Skip adjacent preloading on mobile/low-end devices
			if (deviceConfig.batchSize <= 5) {
				return;
			}

			const currentIndex = GENERATIONS.findIndex(
				(gen) => gen.name === currentGen.name,
			);
			if (currentIndex === -1) return;

			const prevGen = currentIndex > 0 ? GENERATIONS[currentIndex - 1] : null;
			const nextGen =
				currentIndex < GENERATIONS.length - 1
					? GENERATIONS[currentIndex + 1]
					: null;

			const preloadPromises = [];
			if (prevGen) preloadPromises.push(preloadGeneration(prevGen, true));
			if (nextGen) preloadPromises.push(preloadGeneration(nextGen, true));

			await Promise.allSettled(preloadPromises);
		},
		[deviceConfig.batchSize, preloadGeneration],
	);

	useEffect(() => {
		const loadResources = async () => {
			try {
				setLoadingMessage("Initializing game...");

				// Set a timeout for mobile devices
				if (deviceConfig.batchSize <= 5) {
					const timeoutPromise = new Promise<void>((resolve) => {
						setTimeout(() => {
							console.warn(
								"Mobile preloading timeout reached, proceeding without full preload",
							);
							resolve();
						}, 20000); // 20 second timeout
					});

					const preloadPromise = preloadGeneration(generation);
					await Promise.race([preloadPromise, timeoutPromise]);
				} else {
					await preloadGeneration(generation);
				}

				setIsLoading(false);
				onComplete?.();

				// Background preload adjacent generations for better devices
				if (deviceConfig.enableParallelLoading) {
					preloadAdjacentGenerations(generation);
				}
			} catch (error) {
				console.error("Error in resource preloader:", error);
				setIsLoading(false);
				onComplete?.();
			}
		};

		loadResources();
	}, [
		generation,
		deviceConfig,
		onComplete,
		preloadGeneration,
		preloadAdjacentGenerations,
	]);

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
					<div className="text-white/60 text-xs mt-2 space-y-1">
						<p>
							{deviceConfig.batchSize <= 5
								? "Mobile optimized"
								: "Desktop optimized"}{" "}
							loading
						</p>
						{currentPhase === "sprites" && <p>Loading sprites...</p>}
						{currentPhase === "audio" && <p>Loading audio...</p>}
						{currentPhase === "complete" && <p>Finalizing...</p>}
					</div>
				</div>
			</div>
		);
	}

	return <>{children}</>;
};
