const POKEAPI_CACHE_KEY = "pokeApiCryCache";
const CACHE_DURATION_MS = 24 * 60 * 60 * 1000;

export interface PokemonCries {
	latest: string;
	legacy: string;
}

interface CachedCryEntry {
	timestamp: number;
	cries: PokemonCries;
}

type CryCache = Record<string, CachedCryEntry>;

const isRecord = (value: unknown): value is Record<string, unknown> => {
	return typeof value === "object" && value !== null;
};

const isPokemonCries = (value: unknown): value is PokemonCries => {
	if (!isRecord(value)) {
		return false;
	}

	return (
		typeof value.latest === "string" && typeof value.legacy === "string"
	);
};

const isCachedCryEntry = (value: unknown): value is CachedCryEntry => {
	if (!isRecord(value)) {
		return false;
	}

	if (typeof value.timestamp !== "number" || !isPokemonCries(value.cries)) {
		return false;
	}

	return true;
};

const parseCryCache = (cachedData: string): CryCache | null => {
	try {
		const parsed: unknown = JSON.parse(cachedData);
		if (!isRecord(parsed)) {
			return null;
		}

		const cache: CryCache = {};
		for (const [key, entry] of Object.entries(parsed)) {
			if (isCachedCryEntry(entry)) {
				cache[key] = entry;
			}
		}

		return cache;
	} catch {
		return null;
	}
};

const readCacheEntry = (
	cache: CryCache,
	pokemonId: number,
): PokemonCries | null => {
	const entry = cache[String(pokemonId)];
	if (!entry) {
		return null;
	}

	if (Date.now() - entry.timestamp >= CACHE_DURATION_MS) {
		return null;
	}

	return entry.cries;
};

const writeCacheEntry = (
	cache: CryCache,
	pokemonId: number,
	cries: PokemonCries,
): void => {
	cache[String(pokemonId)] = {
		timestamp: Date.now(),
		cries,
	};
	localStorage.setItem(POKEAPI_CACHE_KEY, JSON.stringify(cache));
};

const extractCriesFromApiResponse = (data: unknown): PokemonCries | null => {
	if (!isRecord(data)) {
		return null;
	}

	const cries = data.cries;
	if (!isPokemonCries(cries)) {
		return null;
	}

	return cries;
};

export const resolveCryAudioUrl = (cries: PokemonCries): string => {
	return cries.latest || cries.legacy;
};

export const shouldSkipCryPlayback = (
	pokemonId: number,
	lastPlayedId: number | null,
	isMuted: boolean,
): boolean => {
	return pokemonId === lastPlayedId || isMuted;
};

export const getCachedCryUrl = async (
	pokemonId: number,
): Promise<PokemonCries> => {
	try {
		const cachedData = localStorage.getItem(POKEAPI_CACHE_KEY);
		if (cachedData) {
			const cache = parseCryCache(cachedData);
			if (cache) {
				const cachedCries = readCacheEntry(cache, pokemonId);
				if (cachedCries) {
					console.log("📦 Using cached cry URL for Pokemon:", pokemonId);
					return cachedCries;
				}
			}
		}

		console.log("🔄 Fetching cry from PokeAPI for Pokemon:", pokemonId);
		const response = await fetch(
			`https://pokeapi.co/api/v2/pokemon/${pokemonId}`,
		);
		if (!response.ok) {
			throw new Error("Failed to fetch Pokemon cry");
		}

		const data: unknown = await response.json();
		const cries = extractCriesFromApiResponse(data);
		if (!cries) {
			throw new Error("Invalid Pokemon cry response");
		}

		const cache = cachedData ? parseCryCache(cachedData) ?? {} : {};
		writeCacheEntry(cache, pokemonId, cries);
		console.log("💾 Cry URL cached successfully");

		return cries;
	} catch (error) {
		console.error("Error fetching cry URL:", error);
		if (error instanceof Error) {
			throw error;
		}
		throw new Error("Error fetching cry URL");
	}
};

const isHtmlAudioElement = (target: EventTarget | null): target is HTMLAudioElement => {
	return target instanceof HTMLAudioElement;
};

export const playCryAudio = async (audioUrl: string): Promise<boolean> => {
	const cryAudio = new Audio(audioUrl);
	let hasError = false;

	cryAudio.addEventListener("loadstart", () =>
		console.log("🎵 Started loading audio"),
	);
	cryAudio.addEventListener("canplay", () =>
		console.log("✅ Audio can start playing"),
	);
	cryAudio.addEventListener("loadeddata", () =>
		console.log("✅ Audio data loaded successfully"),
	);
	cryAudio.addEventListener("error", (event) => {
		hasError = true;
		const audio = isHtmlAudioElement(event.currentTarget)
			? event.currentTarget
			: null;
		console.error("❌ Audio loading error:", {
			src: audio?.src,
			networkState: audio?.networkState,
			readyState: audio?.readyState,
			error: audio?.error
				? {
						code: audio.error.code,
						message: audio.error.message,
					}
				: null,
		});
	});

	console.log("⏳ Attempting to play audio...");
	await cryAudio.play();

	return !hasError;
};
