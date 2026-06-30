import type { Pokemon } from "@/components/pokemon-game/types";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";
import { convertTyradexToPokemon, toApiError } from "./pokemonApiTransform";
import {
	fetchTyradexPokemonList,
	getCryUrl,
	getFlavorText,
	TYRADEX_BASE_URL,
	TYRADEX_CACHE_KEY,
} from "./pokemonApiFetch";
import {
	filterPokemonByGeneration,
	type PokemonNamesQueryArg,
} from "./pokemonGeneration";
import { getFromStorage, isCachedData } from "./pokemonApiStorage";
import {
	parseTyradexPokemon,
	type TyradexPokemon,
} from "./pokemonApiValidators";

const CACHE_DURATION = 24 * 60 * 60 * 1000;

const shinyStateCache = new Map<number, boolean>();
const pokemonCache = new Map<string, Omit<Pokemon, "cryUrl">>();

const convertToPokemon = (
	tyradexPokemon: TyradexPokemon,
	maxHypeChain = 0,
	forcedShinyState?: boolean,
): Omit<Pokemon, "cryUrl"> => {
	const pokemonId = tyradexPokemon.pokedex_id;
	const cacheKey = `${pokemonId}_${maxHypeChain}_${forcedShinyState ?? "auto"}`;

	const cached = pokemonCache.get(cacheKey);
	if (cached) {
		return cached;
	}

	const result = convertTyradexToPokemon(tyradexPokemon, {
		maxHypeChain,
		forcedShinyState,
		shinyCache: shinyStateCache,
	});

	pokemonCache.set(cacheKey, result);
	return result;
};

export const pokemonApi = createApi({
	reducerPath: "pokemonApi",
	baseQuery: fetchBaseQuery({
		baseUrl: `${TYRADEX_BASE_URL}/`,
		timeout: 10000,
	}),
	tagTypes: ["Pokemon", "PokemonList"],
	endpoints: (builder) => ({
		getAllPokemonNames: builder.query<Pokemon[], PokemonNamesQueryArg>({
			async queryFn(arg) {
				try {
					const maxHypeChain = arg.maxHypeChain || 0;
					const tyradexData = await fetchTyradexPokemonList();

					const generationPokemon = filterPokemonByGeneration(
						tyradexData.map((pokemon) =>
							convertToPokemon(pokemon, maxHypeChain),
						),
						arg.startId,
						arg.endId,
					);

					return {
						data: generationPokemon.map((pokemon) => ({
							...pokemon,
							cryUrl: "",
						})),
					};
				} catch (error) {
					console.error("Error fetching pokemon data:", error);
					return { error: toApiError(error) };
				}
			},
			keepUnusedDataFor: 3600,
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

					const cachedData = getFromStorage(TYRADEX_CACHE_KEY);
					if (
						isCachedData(cachedData) &&
						Date.now() - cachedData.timestamp < CACHE_DURATION
					) {
						const pokemon = cachedData.tyradexData.find(
							(p) => p.pokedex_id === pokemonId,
						);
						if (pokemon) {
							tyradexPokemon = pokemon;
						}
					}

					if (!tyradexPokemon) {
						const response = await fetch(
							`${TYRADEX_BASE_URL}/pokemon/${pokemonId}`,
							{
								signal: AbortSignal.timeout(10000),
							},
						);
						if (!response.ok) {
							throw new Error("Failed to fetch from Tyradex API");
						}
						tyradexPokemon = parseTyradexPokemon(await response.json());
					}

					const convertedPokemon = convertToPokemon(
						tyradexPokemon,
						maxHypeChain,
					);

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

					const finalCryUrl = cryUrl.status === "fulfilled" ? cryUrl.value : "";
					const finalFlavorTexts =
						flavorTexts.status === "fulfilled"
							? flavorTexts.value
							: { french: "", english: "" };

					return {
						data: {
							...convertedPokemon,
							cryUrl: finalCryUrl,
							frenchFlavorText: finalFlavorTexts.french,
							englishFlavorText: finalFlavorTexts.english,
						},
					};
				} catch (error) {
					console.error("Error fetching pokemon data:", error);
					return { error: toApiError(error) };
				}
			},
			keepUnusedDataFor: 1800,
			providesTags: (_result, _error, arg) => [{ type: "Pokemon", id: arg.id }],
		}),
	}),
});

export const { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } =
	pokemonApi;
