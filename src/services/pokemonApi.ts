import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

interface Pokemon {
  id: number;
  name: string;
  frenchName: string;
  imageUrl: string;
  flavorText?: string;
  englishFlavorText?: string;
  cryUrl?: string;
  isLegendary?: boolean;
  isMythical?: boolean;
  evolvesFromSpecies: string | null;
  hasEvolution: boolean;
}

interface PokemonSpeciesResponse {
  name: string;
  names: Array<{
    language: { name: string };
    name: string;
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
  }>;
  is_legendary: boolean;
  is_mythical: boolean;
  evolves_from_species: { name: string } | null;
  evolution_chain: { url: string };
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

interface EvolutionChain {
  species: {
    name: string;
    url: string;
  };
  evolves_to: EvolutionChain[];
}

interface EvolutionChainResponse {
  chain: EvolutionChain;
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

interface ApiError {
  status: number;
  data: unknown;
}

// Add this function to count previous evolutions
const countPreviousEvolutions = (speciesData: PokemonSpeciesResponse): number => {
  let count = 0;
  let currentSpecies = speciesData;
  
  while (currentSpecies.evolves_from_species) {
    count++;
    currentSpecies = { 
      ...currentSpecies, 
      evolves_from_species: null,
      names: [],
      flavor_text_entries: [],
      is_legendary: false,
      is_mythical: false,
      evolution_chain: { url: '' }
    };
  }
  
  return count;
};

export const pokemonApi = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
  endpoints: (builder) => ({
    getAllPokemonNames: builder.query<Pokemon[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          // Check cache first
          const cachedData = localStorage.getItem(POKEMON_NAMES_CACHE_KEY);
          if (cachedData) {
            const { timestamp, names } = JSON.parse(cachedData) as CachedNamesData;
            if (Date.now() - timestamp < CACHE_DURATION) {
              return { data: names.map(p => ({
                id: p.id,
                name: p.name,
                frenchName: p.frenchName,
                imageUrl: '',
                evolvesFromSpecies: null,
                isLegendary: false,
                isMythical: false,
                hasEvolution: false
              })) };
            }
          }

          // If no cache or expired, fetch all pokemon species at once
          const response = await fetchWithBQ('pokemon-species?limit=1010');
          if (response.error) throw response.error;

          const data = response.data as { results: Array<{ name: string; url: string }> };
          
          // Fetch all species data and evolution chains in parallel
          const speciesPromises = data.results.map((pokemon, index) => 
            fetchWithBQ(`pokemon-species/${index + 1}`)
          );
          
          const speciesResponses = await Promise.all(speciesPromises);
          const evolutionChainPromises = speciesResponses.map(response => {
            const speciesData = response.data as PokemonSpeciesResponse;
            return fetchWithBQ(speciesData.evolution_chain.url.replace('https://pokeapi.co/api/v2/', ''));
          });
          
          const evolutionChainResponses = await Promise.all(evolutionChainPromises);
          
          const pokemonData: Pokemon[] = speciesResponses.map((response, index) => {
            const speciesData = response.data as PokemonSpeciesResponse;
            const evolutionChainData = evolutionChainResponses[index].data as EvolutionChainResponse;
            
            // Check if this Pokémon has any evolution
            let hasEvolution = false;
            const checkEvolutions = (chain: EvolutionChain) => {
              if (chain.species.name === speciesData.name) {
                hasEvolution = chain.evolves_to.length > 0;
              } else {
                chain.evolves_to.forEach((evolution) => {
                  checkEvolutions(evolution);
                });
              }
            };
            checkEvolutions(evolutionChainData.chain);

            return {
              id: index + 1,
              name: speciesData.name,
              frenchName: speciesData.names.find(n => n.language.name === 'fr')?.name || speciesData.name,
              imageUrl: '',
              isLegendary: speciesData.is_legendary,
              isMythical: speciesData.is_mythical,
              evolvesFromSpecies: speciesData.evolves_from_species?.name || null,
              hasEvolution
            };
          });

          // Cache the data
          const cacheData: CachedNamesData = {
            timestamp: Date.now(),
            names: pokemonData.map(p => ({
              id: p.id,
              name: p.name,
              frenchName: p.frenchName
            }))
          };
          localStorage.setItem(POKEMON_NAMES_CACHE_KEY, JSON.stringify(cacheData));

          return { data: pokemonData };
        } catch (error) {
          return { error: error as ApiError };
        }
      },
      keepUnusedDataFor: 3600,
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

          const englishFlavorText = speciesData.flavor_text_entries
            .find((entry) => entry.language.name === 'en')
            ?.flavor_text.replace(/\\n|\\f/g, ' ')
            .replace(new RegExp(pokemonData.name, 'gi'), '_____') || '';

          const cryUrl = `https://play.pokemonshowdown.com/audio/cries/${pokemonData.name.toLowerCase()}.mp3`;

          const pokemon: Pokemon = {
            id: pokemonId,
            name: pokemonData.name,
            frenchName,
            imageUrl: pokemonData.sprites.other['official-artwork'].front_default,
            flavorText: frenchFlavorText,
            englishFlavorText,
            cryUrl,
            isLegendary: speciesData.is_legendary,
            isMythical: speciesData.is_mythical,
            evolvesFromSpecies: speciesData.evolves_from_species?.name || null,
            hasEvolution: false
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
          return { error: error as ApiError };
        }
      }
    })
  })
});

export const { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } = pokemonApi; 