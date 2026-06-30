import type { Pokemon } from "@/components/pokemon-game/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

interface TyradexPokemon {
	pokedex_id: number;
	name: {
		fr: string;
		en: string;
	};
	sprites: {
		regular: string;
		shiny: string | null;
		gmax: {
			regular: string;
			shiny: string;
		} | null;
	};
}

interface PokemonCries {
	latest: string;
	legacy: string;
}

interface FlavorTextEntry {
	flavor_text: string;
	language: {
		name: string;
	};
	version: {
		name: string;
	};
}

interface PokemonSpecies {
	flavor_text_entries: FlavorTextEntry[];
}

const TYRADEX_BASE_URL = "https://tyradex.app/api/v1";
const TYRADEX_CACHE_KEY = "tyradexCache";
const FLAVOR_TEXT_CACHE_KEY = "flavorTextCache";
const CRY_URL_CACHE_KEY = "cryUrlCache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
	timestamp: number;
	tyradexData: TyradexPokemon[];
}

interface CachedFlavorText {
	timestamp: number;
	french: string;
	english: string;
}

interface CachedCryUrl {
	timestamp: number;
	cryUrl: string;
}

interface ApiError {
	status: number;
	data: unknown;
}

// Optimized shiny state cache with Map for better performance
const shinyStateCache = new Map<number, boolean>();

// Enhanced localStorage helpers with error handling and compression
const getFromStorage = (key: string) => {
	if (typeof window === "undefined") return null;
	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : null;
	} catch (error) {
		console.error("Error accessing localStorage:", error);
		// Clear corrupted data
		try {
			localStorage.removeItem(key);
		} catch {}
		return null;
	}
};

const setToStorage = (key: string, value: unknown) => {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error("Error writing to localStorage:", error);
		// If storage is full, try to clear old cache entries
		try {
			const keys = Object.keys(localStorage);
			const cacheKeys = keys.filter((k) => k.includes("Cache"));
			// Remove oldest cache entries first
			for (const k of cacheKeys) {
				localStorage.removeItem(k);
			}
			// Try again
			localStorage.setItem(key, JSON.stringify(value));
		} catch {
			// Still failing, ignore
		}
	}
};

// Optimized cry URL fetching with caching
const getCryUrl = async (id: number): Promise<string> => {
	const cacheKey = `${CRY_URL_CACHE_KEY}_${id}`;
	const cached = getFromStorage(cacheKey) as CachedCryUrl | null;

	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return cached.cryUrl;
	}

	try {
		const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
		if (!response.ok) throw new Error("Failed to fetch Pokemon cry");

		const data = await response.json();
		const cries = data.cries as PokemonCries;
		const cryUrl = `${cries.latest}|${cries.legacy}`;

		// Cache the result
		setToStorage(cacheKey, {
			timestamp: Date.now(),
			cryUrl,
		});

		return cryUrl;
	} catch (error) {
		console.error("Error fetching Pokemon cry:", error);
		return "";
	}
};

// Optimized flavor text fetching with caching
const getFlavorText = async (
	id: number,
): Promise<{ french: string; english: string }> => {
	const cacheKey = `${FLAVOR_TEXT_CACHE_KEY}_${id}`;
	const cached = getFromStorage(cacheKey) as CachedFlavorText | null;

	if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
		return { french: cached.french, english: cached.english };
	}

	try {
		const response = await fetch(
			`https://pokeapi.co/api/v2/pokemon-species/${id}`,
		);
		if (!response.ok) throw new Error("Failed to fetch Pokemon flavor text");

		const data = (await response.json()) as PokemonSpecies;
		const frenchEntries = data.flavor_text_entries.filter(
			(entry) => entry.language.name === "fr",
		);
		const englishEntries = data.flavor_text_entries.filter(
			(entry) => entry.language.name === "en",
		);

		// Get random entries for variety
		const french =
			frenchEntries.length > 0
				? frenchEntries[
						Math.floor(Math.random() * frenchEntries.length)
					].flavor_text
						.replace(/\f/g, " ")
						.replace(/\n/g, " ")
				: "";

		const english =
			englishEntries.length > 0
				? englishEntries[
						Math.floor(Math.random() * englishEntries.length)
					].flavor_text
						.replace(/\f/g, " ")
						.replace(/\n/g, " ")
				: "";

		const result = { french, english };

		// Cache the result
		setToStorage(cacheKey, {
			timestamp: Date.now(),
			...result,
		});

		return result;
	} catch (error) {
		console.error("Error fetching Pokemon flavor text:", error);
		return { french: "", english: "" };
	}
};

// Optimized Pokemon conversion with memoization
const pokemonCache = new Map<string, Omit<Pokemon, "cryUrl">>();

const convertToPokemon = (
	tyradexPokemon: TyradexPokemon,
	maxHypeChain = 0,
	forcedShinyState?: boolean,
): Omit<Pokemon, "cryUrl"> => {
	const pokemonId = tyradexPokemon.pokedex_id;
	const cacheKey = `${pokemonId}_${maxHypeChain}_${forcedShinyState ?? "auto"}`;

	// Check cache first
	const cached = pokemonCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	let isShiny: boolean;
	if (typeof forcedShinyState === "boolean") {
		isShiny = forcedShinyState;
		shinyStateCache.set(pokemonId, isShiny);
	} else if (shinyStateCache.has(pokemonId)) {
		const cachedShiny = shinyStateCache.get(pokemonId);
		isShiny = cachedShiny !== undefined ? cachedShiny : false;
	} else {
		isShiny = Math.random() < Math.min(0.05 + maxHypeChain * 0.01, 0.1);
		shinyStateCache.set(pokemonId, isShiny);
	}

	const result = {
		id: pokemonId,
		name: tyradexPokemon.name.en.toLowerCase(),
		englishName: tyradexPokemon.name.en,
		frenchName: tyradexPokemon.name.fr,
		frenchFlavorText: "",
		englishFlavorText: "",
		sprites: {
			front_default: tyradexPokemon.sprites.regular,
			front_shiny:
				tyradexPokemon.sprites.shiny || tyradexPokemon.sprites.regular,
		},
		isShiny,
		evolvesFromSpecies: null,
		hasEvolution: false,
		evolutionStage: 1,
		isLegendary: false,
		isMythical: false,
	};

	// Cache the result
	pokemonCache.set(cacheKey, result);

	return result;
};

export const pokemonApi = createApi({
	reducerPath: "pokemonApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `${TYRADEX_BASE_URL}/`,
		timeout: 10000, // 10 second timeout
	}),
	tagTypes: ["Pokemon", "PokemonList"],
	endpoints: (builder) => ({
		getAllPokemonNames: builder.query<Pokemon[], { maxHypeChain?: number }>({
			async queryFn(arg) {
				try {
					const maxHypeChain = arg?.maxHypeChain || 0;
					// Check cache first
					const cachedData = getFromStorage(
						TYRADEX_CACHE_KEY,
					) as CachedData | null;
					if (
						cachedData &&
						Date.now() - cachedData.timestamp < CACHE_DURATION
					) {
						console.log("📦 Using cached Tyradex data");
						return {
							data: cachedData.tyradexData.map((pokemon) => ({
								...convertToPokemon(pokemon, maxHypeChain),
								cryUrl: "",
							})),
						};
					}

					// If no cache or expired, fetch from Tyradex API
					console.log("🔄 Fetching Pokemon data from Tyradex API");
					const response = await fetch(`${TYRADEX_BASE_URL}/pokemon`, {
						signal: AbortSignal.timeout(15000), // 15 second timeout
					});
					if (!response.ok) throw new Error("Failed to fetch from Tyradex API");

					const tyradexData = (await response.json()) as TyradexPokemon[];

					// Cache the raw Tyradex data
					setToStorage(TYRADEX_CACHE_KEY, {
						timestamp: Date.now(),
						tyradexData,
					});
					console.log("💾 Tyradex data cached successfully");

					// Convert and return Pokemon data
					return {
						data: tyradexData.map((pokemon) => ({
							...convertToPokemon(pokemon, maxHypeChain),
							cryUrl: "",
						})),
					};
				} catch (error) {
					console.error("❌ Error fetching pokemon data:", error);
					return { error: error as ApiError };
				}
			},
			keepUnusedDataFor: 3600, // Keep data for 1 hour
			providesTags: ["PokemonList"],
		}),

		getPokemonById: builder.query<
			Pokemon,
			{ id: number; maxHypeChain?: number }
		>({
			async queryFn(arg) {
				try {
					const { id: pokemonId, maxHypeChain = 0 } = arg;
					let tyradexPokemon: TyradexPokemon | undefined;

					// Try to get Pokemon data from cache first
					const cachedData = getFromStorage(
						TYRADEX_CACHE_KEY,
					) as CachedData | null;
					if (
						cachedData &&
						Date.now() - cachedData.timestamp < CACHE_DURATION
					) {
						const pokemon = cachedData.tyradexData.find(
							(p) => p.pokedex_id === pokemonId,
						);
						if (pokemon) {
							console.log(
								"📦 Using cached Tyradex data for Pokemon:",
								pokemonId,
							);
							tyradexPokemon = pokemon;
						}
					}

					// If not in cache, fetch from API
					if (!tyradexPokemon) {
						console.log(
							"🔄 Fetching Pokemon data from Tyradex API for ID:",
							pokemonId,
						);
						const response = await fetch(
							`${TYRADEX_BASE_URL}/pokemon/${pokemonId}`,
							{
								signal: AbortSignal.timeout(10000), // 10 second timeout
							},
						);
						if (!response.ok)
							throw new Error("Failed to fetch from Tyradex API");
						tyradexPokemon = (await response.json()) as TyradexPokemon;
					}

					if (!tyradexPokemon) {
						throw new Error(`Failed to get Pokemon data for ID: ${pokemonId}`);
					}

					// Convert Pokemon data first to check if it's shiny
					const convertedPokemon = convertToPokemon(
						tyradexPokemon,
						maxHypeChain,
					);

					// Fetch cry URL and flavor texts in parallel with timeout
					const [cryUrl, flavorTexts] = await Promise.allSettled([
						Promise.race([
							getCryUrl(pokemonId),
							new Promise<string>((_, reject) =>
								setTimeout(() => reject(new Error("Cry URL timeout")), 5000),
							),
						]),
						Promise.race([
							getFlavorText(pokemonId),
							new Promise<{ french: string; english: string }>((_, reject) =>
								setTimeout(
									() => reject(new Error("Flavor text timeout")),
									5000,
								),
							),
						]),
					]);

					// Handle results with fallbacks
					const finalCryUrl = cryUrl.status === "fulfilled" ? cryUrl.value : "";
					const finalFlavorTexts =
						flavorTexts.status === "fulfilled"
							? flavorTexts.value
							: { french: "", english: "" };

					// Return complete Pokemon data
					return {
						data: {
							...convertedPokemon,
							cryUrl: finalCryUrl,
							frenchFlavorText: finalFlavorTexts.french,
							englishFlavorText: finalFlavorTexts.english,
						},
					};
				} catch (error) {
					console.error("❌ Error fetching pokemon data:", error);
					return { error: error as ApiError };
				}
			},
			keepUnusedDataFor: 1800, // Keep data for 30 minutes
			providesTags: (result, error, arg) => [{ type: "Pokemon", id: arg.id }],
		}),
	}),
});

export const { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } =
	pokemonApi;
