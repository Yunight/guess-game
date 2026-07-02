import type { Pokemon } from "@/components/pokemon-game/types";
import type { MutableRefObject } from "react";
import { logCryDebug } from "./cryDebug";

const isIOS =
	/iPad|iPhone|iPod/.test(navigator.userAgent) ||
	(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const audioCache = new Map<string, HTMLAudioElement>();
const AUDIO_PRELOAD_TIMEOUT_MS = 4000;

const playShinyEffect = async (): Promise<void> => {
	if (isIOS) {
		return;
	}
	try {
		const shinyAudio = new Audio("/sounds/shiny_effect.mp3");
		await shinyAudio.play();
		await new Promise<void>((resolve) => {
			shinyAudio.onended = () => resolve();
		});
	} catch {
		return;
	}
};

const formatPokemonNameForShowdown = (name: string): string => {
	const specialCases = {
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
	} as const satisfies Partial<Record<string, string>>;

	for (const [key, value] of Object.entries(specialCases)) {
		if (key === name) {
			return value;
		}
	}

	return name.toLowerCase().replace(/[^a-z0-9]/g, "");
};

const preloadAudio = async (url: string): Promise<HTMLAudioElement | null> => {
	const cachedAudio = audioCache.get(url);
	if (cachedAudio) {
		logCryDebug("Using cached audio", { url });
		return cachedAudio;
	}

	try {
		const audio = new Audio();
		const loadPromise = new Promise<void>((resolve, reject) => {
			let settled = false;
			let timeoutId: ReturnType<typeof setTimeout> | null = null;
			const clearHandlers = (): void => {
				audio.oncanplay = null;
				audio.oncanplaythrough = null;
				audio.onloadeddata = null;
				audio.onerror = null;
				if (timeoutId) {
					clearTimeout(timeoutId);
				}
			};

			const onLoadSuccess = (): void => {
				if (settled) {
					return;
				}
				settled = true;
				clearHandlers();
				resolve();
			};

			const onLoadError = (reason: string): void => {
				if (settled) {
					return;
				}
				settled = true;
				clearHandlers();
				reject(new Error(reason));
			};

			audio.oncanplay = onLoadSuccess;
			audio.oncanplaythrough = onLoadSuccess;
			audio.onloadeddata = onLoadSuccess;
			audio.onerror = () => onLoadError(`Failed to load audio: ${url}`);
			timeoutId = setTimeout(() => {
				onLoadError(`Timed out loading audio: ${url}`);
			}, AUDIO_PRELOAD_TIMEOUT_MS);
		});

		logCryDebug("Preloading cry URL", { url });
		audio.src = url;
		audio.preload = "auto";
		await loadPromise;

		audioCache.set(url, audio);
		logCryDebug("Preload success", { url });
		return audio;
	} catch (error) {
		logCryDebug("Preload failed", {
			url,
			error: error instanceof Error ? error.message : "Unknown preload error",
		});
		console.error(`Failed to preload audio: ${url}`, error);
		return null;
	}
};

const cloneAudioElement = (audio: HTMLAudioElement): HTMLAudioElement => {
	const clonedAudio = new Audio(audio.src);
	clonedAudio.preload = audio.preload;
	return clonedAudio;
};

export interface PlayPokemonCryParams {
	pokemon: Pokemon;
	isMuted: boolean;
	currentPokemonIdRef: MutableRefObject<number | null>;
	audioRef: MutableRefObject<HTMLAudioElement | null>;
	soundPlayedRef: MutableRefObject<boolean>;
}

const loadFirstAvailableAudio = async (urls: readonly string[]): Promise<HTMLAudioElement | null> => {
	const normalizedUrls = urls.map((url) => url.trim()).filter((url) => url.length > 0);
	logCryDebug("Evaluating cry URL candidates", { urls: normalizedUrls });
	if (normalizedUrls.length === 0) {
		logCryDebug("No cry URL candidates available");
		return null;
	}

	for (const url of normalizedUrls) {
		const audio = await preloadAudio(url);
		if (audio) {
			logCryDebug("Selected cry URL candidate", { url });
			return audio;
		}
		logCryDebug("Cry URL candidate unusable, trying next", { url });
	}

	logCryDebug("No usable cry URL candidate found");
	return null;
};

export const playPokemonCry = async ({
	pokemon,
	isMuted,
	currentPokemonIdRef,
	audioRef,
	soundPlayedRef,
}: PlayPokemonCryParams): Promise<void> => {
	logCryDebug("playPokemonCry invoked", {
		pokemonId: pokemon.id,
		pokemonName: pokemon.englishName,
		isMuted,
		currentPokemonIdRef: currentPokemonIdRef.current,
	});
	if (isMuted) {
		logCryDebug("Skipping playPokemonCry because muted", { pokemonId: pokemon.id });
		return;
	}

	if (audioRef.current) {
		logCryDebug("Stopping previous audio before new cry", { pokemonId: pokemon.id });
		audioRef.current.pause();
		audioRef.current.currentTime = 0;
		audioRef.current = null;
	}

	try {
		if (pokemon.isShiny && !isIOS) {
			await playShinyEffect();
		}

		let audio: HTMLAudioElement | null = null;
		const formattedName = formatPokemonNameForShowdown(pokemon.englishName);
		const showdownUrl = `https://play.pokemonshowdown.com/audio/cries/${formattedName}.mp3`;

		if (isIOS) {
			logCryDebug("Using iOS showdown cry URL", { showdownUrl, pokemonId: pokemon.id });
			audio = await preloadAudio(showdownUrl);
		} else {
			const urls = pokemon.cryUrl
				.split("|")
				.map((url) => url.trim())
				.filter((url) => url.length > 0);
			if (!urls.includes(showdownUrl)) {
				urls.push(showdownUrl);
			}
			logCryDebug("Using non-iOS candidate list", { pokemonId: pokemon.id, urls });
			audio = await loadFirstAvailableAudio(urls);
		}

		if (!audio) {
			logCryDebug("No audio resolved for cry playback", { pokemonId: pokemon.id });
			return;
		}

		if (pokemon.id !== currentPokemonIdRef.current) {
			logCryDebug("Skipping cry playback due to stale pokemon id", {
				pokemonId: pokemon.id,
				currentPokemonIdRef: currentPokemonIdRef.current,
			});
			return;
		}

		if (audio) {
			const playingAudio = cloneAudioElement(audio);
			audioRef.current = playingAudio;
			await playingAudio.play();
			soundPlayedRef.current = true;
			logCryDebug("Cry playback started successfully", { pokemonId: pokemon.id });
		}
	} catch (error) {
		logCryDebug("Cry playback failed", {
			pokemonId: pokemon.id,
			error: error instanceof Error ? `${error.name}: ${error.message}` : "Unknown playback error",
		});
		if (error instanceof Error && error.message.includes("Timed out loading audio")) {
			console.warn("Pokemon cry preload timeout:", error.message);
		} else if (error instanceof Error && error.name === "NotAllowedError") {
			console.warn("Pokemon cry blocked by autoplay policy:", error.message);
		} else {
			console.error("Error playing Pokemon cry:", error);
		}
		audioRef.current = null;
	}
};

export const clearPokemonCryCache = (): void => {
	for (const audio of audioCache.values()) {
		audio.pause();
		audio.src = "";
	}
	audioCache.clear();
};
