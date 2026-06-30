import type { Pokemon } from "@/components/pokemon-game/types";
import type { MutableRefObject } from "react";

const isIOS =
	/iPad|iPhone|iPod/.test(navigator.userAgent) ||
	(navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);

const audioCache = new Map<string, HTMLAudioElement>();

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
		return cachedAudio;
	}

	try {
		const audio = new Audio();
		const loadPromise = new Promise<void>((resolve, reject) => {
			audio.oncanplaythrough = () => resolve();
			audio.onerror = () => reject(new Error(`Failed to load audio: ${url}`));
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

export const playPokemonCry = async ({
	pokemon,
	isMuted,
	currentPokemonIdRef,
	audioRef,
	soundPlayedRef,
}: PlayPokemonCryParams): Promise<void> => {
	if (isMuted) {
		return;
	}

	if (audioRef.current) {
		audioRef.current.pause();
		audioRef.current.currentTime = 0;
		audioRef.current = null;
	}

	try {
		if (pokemon.isShiny && !isIOS) {
			await playShinyEffect();
		}

		let audio: HTMLAudioElement | null = null;

		if (isIOS) {
			const formattedName = formatPokemonNameForShowdown(pokemon.englishName);
			const showdownUrl = `https://play.pokemonshowdown.com/audio/cries/${formattedName}.mp3`;
			audio = await preloadAudio(showdownUrl);
		} else {
			const urls = pokemon.cryUrl.split("|");
			for (const url of urls) {
				audio = await preloadAudio(url);
				if (audio) {
					break;
				}
			}
		}

		if (audio && pokemon.id === currentPokemonIdRef.current) {
			const playingAudio = cloneAudioElement(audio);
			audioRef.current = playingAudio;
			await playingAudio.play();
			soundPlayedRef.current = true;
		}
	} catch (error) {
		console.error("Error playing Pokemon cry:", error);
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
