import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface Pokemon {
  id: number;
  name: string;
  frenchName: string;
  imageUrl: string;
  flavorText?: string;
  cryUrl?: string;
}

interface PokemonSpeciesResponse {
  names: Array<{
    language: { name: string };
    name: string;
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
}

interface PokemonResponse {
  name: string;
  sprites: {
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}

const POKEMON_CACHE_KEY = 'pokemonDetailsCache';
const POKEMON_NAMES_CACHE_KEY = 'allPokemonNamesCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedPokemonData {
  timestamp: number;
  pokemons: Record<number, Pokemon>;
}


interface CachedNamesData {
  timestamp: number;
  names: Array<{
    id: number;
    name: string;
    frenchName: string;
  }>;
}

export const pokemonApi = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
  endpoints: (builder) => ({
    getAllPokemonNames: builder.query<string[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          // Check cache first
          const cachedData = localStorage.getItem(POKEMON_NAMES_CACHE_KEY);
          if (cachedData) {
            const { timestamp, names } = JSON.parse(cachedData) as CachedNamesData;
            if (Date.now() - timestamp < CACHE_DURATION) {
              return { data: names.map(p => p.frenchName) };
            }
          }

          // If no cache or expired, fetch all pokemon names at once
          const response = await fetchWithBQ('pokemon-species?limit=1010'); // Fetch all Pokemon
          if (response.error) throw response.error;

          const data = response.data as { results: Array<{ name: string; url: string }> };
          
          // Fetch all species data in parallel
          const namesPromises = data.results.map(async (pokemon, index) => {
            const speciesResponse = await fetchWithBQ(`pokemon-species/${index + 1}`);
            const speciesData = speciesResponse.data as PokemonSpeciesResponse;
            
            return {
              id: index + 1,
              name: pokemon.name,
              frenchName: speciesData.names.find(
                (name) => name.language.name === 'fr'
              )?.name || pokemon.name
            };
          });

          const names = await Promise.all(namesPromises);

          // Store in localStorage
          const cacheData: CachedNamesData = {
            timestamp: Date.now(),
            names
          };
          localStorage.setItem(POKEMON_NAMES_CACHE_KEY, JSON.stringify(cacheData));

          return { data: names.map(p => p.frenchName) };
        } catch (error) {
          // If error occurs but we have cached data, use it
          const cachedData = localStorage.getItem(POKEMON_NAMES_CACHE_KEY);
          if (cachedData) {
            const { names } = JSON.parse(cachedData) as CachedNamesData;
            return { data: names.map(p => p.frenchName) };
          }
          return { error: error as { status: number; data: any } };
        }
      },
      keepUnusedDataFor: 3600, // Keep in RTK Query cache for 1 hour
    }),

    getPokemonById: builder.query<Pokemon, number>({
      async queryFn(pokemonId, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          // Check cache first
          const cachedData = localStorage.getItem(POKEMON_CACHE_KEY);
          if (cachedData) {
            const { timestamp, pokemons } = JSON.parse(cachedData) as CachedPokemonData;
            if (Date.now() - timestamp < CACHE_DURATION && pokemons[pokemonId]) {
              return { data: pokemons[pokemonId] };
            }
          }

          // If not in cache or expired, fetch from API
          const [pokemonResponse, speciesResponse] = await Promise.all([
            fetchWithBQ(`pokemon/${pokemonId}`),
            fetchWithBQ(`pokemon-species/${pokemonId}`)
          ]);

          if (pokemonResponse.error) throw pokemonResponse.error;
          if (speciesResponse.error) throw speciesResponse.error;

          const pokemonData = pokemonResponse.data as PokemonResponse;
          const speciesData = speciesResponse.data as PokemonSpeciesResponse;

          const frenchName = speciesData.names.find(
            (name) => name.language.name === 'fr'
          )?.name || pokemonData.name;

          const frenchFlavorText = speciesData.flavor_text_entries
            .find((entry) => entry.language.name === 'fr')
            ?.flavor_text.replace(/\\n|\\f/g, ' ')
            .replace(new RegExp(frenchName, 'gi'), '_____') || '';

          const cryUrl = `https://play.pokemonshowdown.com/audio/cries/${pokemonData.name.toLowerCase()}.mp3`;

          const pokemon: Pokemon = {
            id: pokemonId,
            name: pokemonData.name,
            frenchName,
            imageUrl: pokemonData.sprites.other['official-artwork'].front_default,
            flavorText: frenchFlavorText,
            cryUrl
          };

          // Update cache with new pokemon data
          const existingCache = localStorage.getItem(POKEMON_CACHE_KEY);
          const cache: CachedPokemonData = existingCache 
            ? JSON.parse(existingCache)
            : { timestamp: Date.now(), pokemons: {} };

          if (Date.now() - cache.timestamp >= CACHE_DURATION) {
            cache.timestamp = Date.now();
            cache.pokemons = {};
          }

          cache.pokemons[pokemonId] = pokemon;
          localStorage.setItem(POKEMON_CACHE_KEY, JSON.stringify(cache));

          return { data: pokemon };
        } catch (error) {
          return { error: error as { status: number; data: any } };
        }
      }
    })
  })
});

export const { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } = pokemonApi; 