import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Pokemon } from '@/components/pokemon-game/types';

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

const TYRADEX_CACHE_KEY = 'tyradexCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  timestamp: number;
  tyradexData: TyradexPokemon[];
}

interface ApiError {
  status: number;
  data: unknown;
}

// Get Pokemon cry URL from PokeAPI - only when needed
const getCryUrl = async (id: number): Promise<string> => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
    if (!response.ok) throw new Error('Failed to fetch Pokemon cry');
    
    const data = await response.json();
    const cries = data.cries as PokemonCries;
    
    return `${cries.latest}|${cries.legacy}`;
  } catch (error) {
    console.error('Error fetching Pokemon cry:', error);
    return '';
  }
};

// Update localStorage handling to be safe for SSR
const getFromStorage = (key: string) => {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(key);
  } catch (error) {
    console.error('Error accessing localStorage:', error);
    return null;
  }
};

const setToStorage = (key: string, value: string) => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, value);
  } catch (error) {
    console.error('Error writing to localStorage:', error);
  }
};

// Convert Tyradex data to Pokemon format
const convertToPokemon = (tyradexPokemon: TyradexPokemon): Omit<Pokemon, 'cryUrl'> => ({
  id: tyradexPokemon.pokedex_id,
  name: tyradexPokemon.name.en.toLowerCase(),
  englishName: tyradexPokemon.name.en,
  frenchName: tyradexPokemon.name.fr,
  frenchFlavorText: '',
  englishFlavorText: '',
  sprite: tyradexPokemon.sprites.regular,
  evolvesFromSpecies: null,
  hasEvolution: false,
  evolutionStage: 1,
  isLegendary: false,
  isMythical: false
});

export const pokemonApi = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://tyradex.vercel.app/api/v1/' }),
  endpoints: (builder) => ({
    getAllPokemonNames: builder.query<Pokemon[], void>({
      async queryFn() {
        try {
          // Check cache first
          const cachedData = getFromStorage(TYRADEX_CACHE_KEY);
          if (cachedData) {
            const { timestamp, tyradexData } = JSON.parse(cachedData) as CachedData;
            // Cache is valid for 24 hours
            if (Date.now() - timestamp < CACHE_DURATION) {
              console.log('📦 Using cached Tyradex data');
              return { 
                data: tyradexData.map(pokemon => ({
                  ...convertToPokemon(pokemon),
                  cryUrl: ''
                }))
              };
            }
          }

          // If no cache or expired, fetch from Tyradex API
          console.log('🔄 Fetching Pokemon data from Tyradex API');
          const response = await fetch('https://tyradex.vercel.app/api/v1/pokemon');
          if (!response.ok) throw new Error('Failed to fetch from Tyradex API');

          const tyradexData = await response.json() as TyradexPokemon[];
          
          // Cache the raw Tyradex data
          setToStorage(TYRADEX_CACHE_KEY, JSON.stringify({
            timestamp: Date.now(),
            tyradexData
          }));
          console.log('💾 Tyradex data cached successfully');

          // Convert and return Pokemon data
          return { 
            data: tyradexData.map(pokemon => ({
              ...convertToPokemon(pokemon),
              cryUrl: ''
            }))
          };
        } catch (error) {
          console.error('❌ Error fetching pokemon data:', error);
          return { error: error as ApiError };
        }
      },
      keepUnusedDataFor: 3600,
    }),

    getPokemonById: builder.query<Pokemon, number>({
      async queryFn(pokemonId) {
        try {
          let tyradexPokemon: TyradexPokemon | undefined;

          // Try to get Pokemon data from cache first
          const cachedData = getFromStorage(TYRADEX_CACHE_KEY);
          if (cachedData) {
            const { timestamp, tyradexData } = JSON.parse(cachedData) as CachedData;
            if (Date.now() - timestamp < CACHE_DURATION) {
              const pokemon = tyradexData.find(p => p.pokedex_id === pokemonId);
              if (pokemon) {
                console.log('📦 Using cached Tyradex data for Pokemon:', pokemonId);
                tyradexPokemon = pokemon;
              }
            }
          }

          // If not in cache, fetch from API
          if (!tyradexPokemon) {
            console.log('🔄 Fetching Pokemon data from Tyradex API');
            const response = await fetch(`https://tyradex.vercel.app/api/v1/pokemon/${pokemonId}`);
            if (!response.ok) throw new Error('Failed to fetch from Tyradex API');
            tyradexPokemon = await response.json() as TyradexPokemon;
          }

          if (!tyradexPokemon) {
            throw new Error(`Failed to get Pokemon data for ID: ${pokemonId}`);
          }

          // Fetch cry URL (not cached)
          console.log('🎵 Fetching cry from PokeAPI for Pokemon:', pokemonId);
          const cryUrl = await getCryUrl(pokemonId);

          // Return complete Pokemon data
          return { 
            data: {
              ...convertToPokemon(tyradexPokemon),
              cryUrl
            }
          };
        } catch (error) {
          console.error('❌ Error fetching pokemon data:', error);
          return { error: error as ApiError };
        }
      }
    })
  })
});

export const { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } = pokemonApi; 