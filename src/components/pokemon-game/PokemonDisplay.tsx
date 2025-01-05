import React, { type FC, useEffect, useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PokemonSprite } from "./PokemonSprite";
import type { Pokemon } from "./types";

// Detect iOS device
const isIOS =
	/iPad|iPhone|iPod/.test(navigator.userAgent) ||
	(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

interface PokemonDisplayProps {
	currentPokemon: Pokemon | undefined;
	isPokemonLoading: boolean;
	isCorrect: boolean | null;
	isMuted: boolean;
	guessTimeLeft: number;
	remainingCount: number;
	totalCount: number;
}

// Play shiny effect sound
const playShinyEffect = async () => {
	if (isIOS) return; // Skip on iOS devices
	try {
		const shinyAudio = new Audio("/sounds/shiny_effect.mp3");
		await shinyAudio.play();
		// Wait for shiny effect to finish before resolving
		await new Promise((resolve) => {
			shinyAudio.onended = resolve;
		});
	} catch {
		// Ignore audio play errors
	}
};

// Audio cache at component level
const audioCache = new Map<string, HTMLAudioElement>();

export const PokemonDisplay: FC<PokemonDisplayProps> = ({
	currentPokemon,
	isPokemonLoading,
	isCorrect,
	isMuted,
	guessTimeLeft,
	remainingCount,
	totalCount,
}) => {
	const { i18n } = useTranslation();
	const [displayState, setDisplayState] = useState<
		"loading" | "ready" | "revealed"
	>("loading");
	const [displayedPokemon, setDisplayedPokemon] = useState<
		Pokemon | undefined
	>();
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const soundPlayedRef = useRef(false);
	const currentPokemonIdRef = useRef<number | null>(0);

	// Handle Pokemon changes and loading states
	useEffect(() => {
		const newPokemonId = currentPokemon?.id;
		const currentId = currentPokemonIdRef.current;

		// If we're loading or Pokemon has changed
		if (isPokemonLoading || newPokemonId !== currentId) {
			// Clean up audio
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.currentTime = 0;
				audioRef.current.remove();
				audioRef.current = null;
			}
			soundPlayedRef.current = false;

			// Only clear display if we're loading a new Pokemon AND it's a different Pokemon
			if (newPokemonId !== currentId) {
				// Only reset display state if it's a different Pokemon
				if (newPokemonId !== displayedPokemon?.id) {
					setDisplayState("loading");
					setDisplayedPokemon(undefined);
				}
			}

			// Update reference immediately to prevent multiple clears
			currentPokemonIdRef.current = newPokemonId || null;
		}

		// Set new Pokemon only when we have it and it's not loading
		if (currentPokemon && !isPokemonLoading) {
			// Keep revealed state during transition until new Pokemon
			if (
				displayState === "revealed" &&
				currentPokemon.id === displayedPokemon?.id
			) {
				setDisplayedPokemon(currentPokemon);
			} else {
				// Set new state only if it's a different Pokemon or not revealed
				const newState =
					isCorrect === true || guessTimeLeft === 0 ? "revealed" : "ready";
				// Reset sound played flag when setting a new Pokemon
				if (currentPokemon.id !== displayedPokemon?.id) {
					soundPlayedRef.current = false;
				}
				setDisplayState(newState);
				setDisplayedPokemon(currentPokemon);
			}
		}
	}, [
		currentPokemon,
		isPokemonLoading,
		isCorrect,
		displayState,
		displayedPokemon,
		guessTimeLeft,
	]);

	// Handle Pokemon cry sound
	useEffect(() => {
		// Only play sound if:
		// 1. We have a Pokemon
		// 2. It has a cry URL
		// 3. Sound is not muted
		// 4. Sound hasn't been played yet
		// 5. We're in ready state (not loading or revealed)
		// 6. The Pokemon ID matches our current reference (no race conditions)
		if (
			!displayedPokemon ||
			!displayedPokemon.cryUrl ||
			isMuted ||
			soundPlayedRef.current ||
			displayState !== "ready" ||
			displayedPokemon.id !== currentPokemonIdRef.current
		) {
			return;
		}

		const formatPokemonNameForShowdown = (name: string): string => {
			// Handle special cases
			const specialCases: { [key: string]: string } = {
				"Nidoran♂": "nidoranm",
				"Nidoran♀": "nidoranf",
				"Mr. Mime": "mrmime",
				"Mime Jr.": "mimejr",
				"Type: Null": "typenull",
				Flabébé: "flabebe",
				"Farfetch'd": "farfetchd",
				"Sirfetch'd": "sirfetchd",
				"Mr. Rime": "mrrime",
				"Wo-Chien": "wochien",
				"Chien-Pao": "chienpao",
				"Ting-Lu": "tinglu",
				"Chi-Yu": "chiyu",
				"Tapu Koko": "tapukoko",
				"Tapu Lele": "tapulele",
				"Tapu Bulu": "tapubulu",
				"Tapu Fini": "tapufini",
			};

			const pokemonName = name.toLowerCase();
			return specialCases[name] || pokemonName.replace(/[^a-z0-9]/g, "");
		};

		const preloadAudio = async (
			url: string,
		): Promise<HTMLAudioElement | null> => {
			if (audioCache.has(url)) {
				const cachedAudio = audioCache.get(url);
				return cachedAudio ?? null;
			}

			try {
				const audio = new Audio();
				const loadPromise = new Promise<void>((resolve, reject) => {
					audio.oncanplaythrough = () => resolve();
					audio.onerror = () => reject();
				});

				audio.src = url;
				audio.preload = "auto";
				await loadPromise;

				audioCache.set(url, audio);
				return audio;
			} catch (error) {
				console.error(`Failed to preload audio: ${url}`, error);
				return null;
			}
		};

		const playPokemonCry = async () => {
			// Clean up any existing audio first
			if (audioRef.current) {
				audioRef.current.pause();
				audioRef.current.currentTime = 0;
				audioRef.current = null;
			}

			if (!displayedPokemon) return;

			try {
				// Play shiny effect first if it's a shiny Pokemon
				if (displayedPokemon.isShiny && !isIOS) {
					await playShinyEffect();
				}

				let audio: HTMLAudioElement | null = null;

				if (isIOS) {
					// Use Pokemon Showdown's MP3 cry for iOS devices
					const formattedName = formatPokemonNameForShowdown(
						displayedPokemon.englishName,
					);
					const showdownUrl = `https://play.pokemonshowdown.com/audio/cries/${formattedName}.mp3`;
					audio = await preloadAudio(showdownUrl);
				} else {
					// Use regular cries for other devices
					const urls = displayedPokemon.cryUrl.split("|");
					for (const url of urls) {
						audio = await preloadAudio(url);
						if (audio) break;
					}
				}

				// Only play if we're still showing the same Pokemon
				if (audio && displayedPokemon.id === currentPokemonIdRef.current) {
					const playingAudio = audio.cloneNode() as HTMLAudioElement;
					audioRef.current = playingAudio;
					await playingAudio.play();
					soundPlayedRef.current = true;
				}
			} catch (error) {
				console.error("Error playing Pokemon cry:", error);
				if (audioRef.current) {
					audioRef.current = null;
				}
			}
		};

		// Play the sounds
		playPokemonCry();
	}, [displayState, displayedPokemon, isMuted]);

	// Cleanup function for audio cache
	useEffect(() => {
		return () => {
			for (const audio of audioCache.values()) {
				audio.pause();
				audio.src = "";
			}
			audioCache.clear();
		};
	}, []);

	return (
		<div className="w-full max-w-2xl mx-auto px-4">
			{/* Counter display with flex container for alignment */}
			<div className="flex justify-between items-center mb-2">
				{/* Quit button slot - will be filled by parent component */}
				<div className="w-24">
					{" "}
					{/* Fixed width to maintain layout */}
					<slot name="quit-button" />
				</div>

				{/* Pokemon counter - centered */}
				<div className="bg-black/80 text-white px-4 py-1 rounded-full text-sm font-medium">
					{remainingCount}/{totalCount}
				</div>

				{/* Empty div for symmetry */}
				<div className="w-24" />
			</div>
			<div
				className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center p-2 
				aspect-[4/3] mb-2 relative overflow-hidden shadow-inner"
			>
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

				<div className="relative z-10 w-full h-full flex items-center justify-center">
					{!displayedPokemon || !displayedPokemon.sprite ? (
						<div className="pokeball-loading">
							<div className="outer-circle" />
							<div className="middle-line" />
							<div className="center-circle" />
						</div>
					) : (
						<div
							className={`relative w-full h-full flex items-center justify-center ${
								displayState === "revealed" ? "animate-reveal-pokemon" : ""
							}`}
						>
							{/* Show shiny message even during silhouette */}
							{displayedPokemon.isShiny && (
								<div className="absolute top-4 left-0 right-0 flex justify-center z-20">
									<div className="bg-yellow-400/90 text-black px-4 py-1 rounded-full font-bold text-sm">
										{i18n.language === "fr"
											? "✨ CHROMATIQUE ✨"
											: "✨ SHINY ✨"}
									</div>
								</div>
							)}
							<PokemonSprite
								pokemonId={displayedPokemon.id}
								className={`w-auto h-[80%] max-w-full ${
									displayState === "revealed"
										? "animate-reveal-pokemon"
										: displayState === "ready"
											? "animate-appear-pokemon"
											: "opacity-0"
								}`}
								isRevealed={displayState === "revealed"}
								name={
									i18n.language === "fr"
										? displayedPokemon.frenchName
										: displayedPokemon.englishName
								}
								isShiny={displayedPokemon.isShiny}
							/>

							{/* Pokemon name reveal */}
							{displayState === "revealed" && (
								<div className="absolute bottom-4 left-0 right-0 text-center">
									<div className="bg-gradient-to-r from-blue-500/50 via-blue-600/50 to-blue-500/50 text-white px-6 py-3 rounded-full mx-auto inline-block backdrop-blur-sm font-bold text-xl animate-fade-in drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
										{i18n.language === "fr"
											? displayedPokemon.frenchName
											: displayedPokemon.englishName}
									</div>
								</div>
							)}

							{/* Reveal effects */}
							{displayState === "revealed" && (
								<div className="absolute inset-0 pointer-events-none">
									{/* Inner expanding ring */}
									<div className="absolute inset-0 animate-ring-expand">
										<div
											className={`absolute inset-0 border-4 ${
												displayedPokemon.isShiny
													? "border-yellow-400/50"
													: "border-blue-400/30"
											} rounded-full`}
										/>
									</div>
									{/* Outer expanding ring (delayed) */}
									<div className="absolute inset-0 animate-ring-expand-delayed">
										<div
											className={`absolute inset-0 border-4 ${
												displayedPokemon.isShiny
													? "border-yellow-400/40"
													: "border-blue-400/20"
											} rounded-full`}
										/>
									</div>
									{/* Sparkles */}
									<div
										className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
										style={{ top: "20%", left: "30%", animationDuration: "1s" }}
									/>
									<div
										className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
										style={{
											top: "70%",
											left: "80%",
											animationDuration: "1.2s",
										}}
									/>
									<div
										className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping"
										style={{
											top: "40%",
											left: "60%",
											animationDuration: "0.8s",
										}}
									/>

									{/* Extra sparkles for shiny Pokemon */}
									{displayedPokemon.isShiny && (
										<>
											<div
												className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping"
												style={{
													top: "30%",
													left: "20%",
													animationDuration: "1.3s",
												}}
											/>
											<div
												className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping"
												style={{
													top: "60%",
													left: "70%",
													animationDuration: "0.9s",
												}}
											/>
											<div
												className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping"
												style={{
													top: "45%",
													left: "40%",
													animationDuration: "1.1s",
												}}
											/>
										</>
									)}
								</div>
							)}
						</div>
					)}
				</div>
			</div>
		</div>
	);
};
