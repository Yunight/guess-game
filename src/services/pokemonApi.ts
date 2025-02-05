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

const TYRADEX_CACHE_KEY = "tyradexCache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
	timestamp: number;
	tyradexData: TyradexPokemon[];
}

interface ApiError {
	status: number;
	data: unknown;
}

// Add shiny state cache
const shinyStateCache = new Map<number, boolean>();

// Get Pokemon cry URL from PokeAPI - only when needed
const getCryUrl = async (id: number): Promise<string> => {
	try {
		const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
		if (!response.ok) throw new Error("Failed to fetch Pokemon cry");

		const data = await response.json();
		const cries = data.cries as PokemonCries;

		return `${cries.latest}|${cries.legacy}`;
	} catch (error) {
		console.error("Error fetching Pokemon cry:", error);
		return "";
	}
};

// Get Pokemon flavor text from PokeAPI
const getFlavorText = async (
	id: number,
): Promise<{ french: string; english: string }> => {
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

		return { french, english };
	} catch (error) {
		console.error("Error fetching Pokemon flavor text:", error);
		return { french: "", english: "" };
	}
};

// Update localStorage handling to be safe for SSR
const getFromStorage = (key: string) => {
	if (typeof window === "undefined") return null;
	try {
		return localStorage.getItem(key);
	} catch (error) {
		console.error("Error accessing localStorage:", error);
		return null;
	}
};

const setToStorage = (key: string, value: string) => {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, value);
	} catch (error) {
		console.error("Error writing to localStorage:", error);
	}
};

// Convert Tyradex data to Pokemon format
const convertToPokemon = (
	tyradexPokemon: TyradexPokemon,
	maxHypeChain = 0,
	forcedShinyState?: boolean,
): Omit<Pokemon, "cryUrl"> => {
	const pokemonId = tyradexPokemon.pokedex_id;

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

	return {
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
};

export const pokemonApi = createApi({
	reducerPath: "pokemonApi",
	baseQuery: fetchBaseQuery({ baseUrl: "https://tyradex.vercel.app/api/v1/" }),
	endpoints: (builder) => ({
		getAllPokemonNames: builder.query<Pokemon[], { maxHypeChain?: number }>({
			async queryFn(arg) {
				try {
					const maxHypeChain = arg?.maxHypeChain || 0;
					// Check cache first
					const cachedData = getFromStorage(TYRADEX_CACHE_KEY);
					if (cachedData) {
						const { timestamp, tyradexData } = JSON.parse(
							cachedData,
						) as CachedData;
						// Cache is valid for 24 hours
						if (Date.now() - timestamp < CACHE_DURATION) {
							console.log("📦 Using cached Tyradex data");
							return {
								data: tyradexData.map((pokemon) => ({
									...convertToPokemon(pokemon, maxHypeChain),
									cryUrl: "",
								})),
							};
						}
					}

					// If no cache or expired, fetch from Tyradex API
					console.log("🔄 Fetching Pokemon data from Tyradex API");
					const response = await fetch(
						"https://tyradex.vercel.app/api/v1/pokemon",
					);
					if (!response.ok) throw new Error("Failed to fetch from Tyradex API");

					const tyradexData = (await response.json()) as TyradexPokemon[];

					// Cache the raw Tyradex data
					setToStorage(
						TYRADEX_CACHE_KEY,
						JSON.stringify({
							timestamp: Date.now(),
							tyradexData,
						}),
					);
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
			keepUnusedDataFor: 3600,
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
					const cachedData = getFromStorage(TYRADEX_CACHE_KEY);
					if (cachedData) {
						const { timestamp, tyradexData } = JSON.parse(
							cachedData,
						) as CachedData;
						if (Date.now() - timestamp < CACHE_DURATION) {
							const pokemon = tyradexData.find(
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
					}

					// If not in cache, fetch from API
					if (!tyradexPokemon) {
						console.log("🔄 Fetching Pokemon data from Tyradex API");
						const response = await fetch(
							`https://tyradex.vercel.app/api/v1/pokemon/${pokemonId}`,
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

					// Fetch cry URL and flavor texts in parallel
					const [cryUrl, flavorTexts] = await Promise.all([
						getCryUrl(pokemonId),
						getFlavorText(pokemonId),
					]);

					// Return complete Pokemon data
					return {
						data: {
							...convertedPokemon,
							cryUrl,
							frenchFlavorText: flavorTexts.french,
							englishFlavorText: flavorTexts.english,
						},
					};
				} catch (error) {
					console.error("❌ Error fetching pokemon data:", error);
					return { error: error as ApiError };
				}
			},
		}),
	}),
});

export const { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } =
	pokemonApi;
