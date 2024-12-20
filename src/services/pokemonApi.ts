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

const POKEMON_CACHE_KEY = 'pokemonCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedData {
  timestamp: number;
  pokemons: Record<number, Pokemon>;
}

interface ApiError {
  status: number;
  data: unknown;
}

// Move getCryUrl outside of transformPokemonData to make it accessible
const getCryUrl = (name: string): string => {
  // Handle special cases
  const specialCases: { [key: string]: string } = {
    'nidoran♂': 'nidoranm',
    'nidoran♀': 'nidoranf',
    'mr. mime': 'mrmime',
    'mime jr.': 'mimejr',
    'farfetch\u2019d': 'farfetchd',
    'sirfetch\u2019d': 'sirfetchd',
    'type: null': 'typenull',
    'flabébé': 'flabebe',
    'jangmo-o': 'jangmoo',
    'hakamo-o': 'hakamoo',
    'kommo-o': 'kommoo'
  };

  // Normalize the name: lowercase and remove special characters
  const normalizedName = name.toLowerCase();
  
  // Check if it's a special case
  const soundName = specialCases[normalizedName] || normalizedName
    .replace(/[^a-z0-9]/g, '') // Remove any non-alphanumeric characters
    .replace(/\s+/g, ''); // Remove spaces

  // Return both URLs for fallback
  return `https://play.pokemonshowdown.com/audio/cries/${soundName}.mp3|https://play.pokemonshowdown.com/audio/cries/${soundName}.ogg`;
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

export const pokemonApi = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://tyradex.vercel.app/api/v1/' }),
  endpoints: (builder) => ({
    getAllPokemonNames: builder.query<Pokemon[], void>({
      async queryFn() {
        try {
          // Check cache first
          const cachedData = getFromStorage(POKEMON_CACHE_KEY);
          if (cachedData) {
            const { timestamp, pokemons } = JSON.parse(cachedData) as CachedData;
            // Cache is valid for 24 hours
            if (Date.now() - timestamp < CACHE_DURATION) {
              console.log('📦 Using cached Pokemon data');
              return { data: Object.values(pokemons) };
            }
          }

          // If no cache or expired, fetch from Tyradex API
          console.log('🔄 Fetching Pokemon data from Tyradex API');
          const response = await fetch('https://tyradex.vercel.app/api/v1/pokemon');
          if (!response.ok) throw new Error('Failed to fetch from Tyradex API');

          const tyradexData = await response.json() as TyradexPokemon[];
          
          const pokemonData = tyradexData.map(p => ({
            id: p.pokedex_id,
            name: p.name.en.toLowerCase(),
            englishName: p.name.en,
            frenchName: p.name.fr,
            frenchFlavorText: '',
            englishFlavorText: '',
            sprite: p.sprites.regular,
            evolvesFromSpecies: null,
            hasEvolution: false,
            evolutionStage: 1,
            isLegendary: false,
            isMythical: false,
            cryUrl: getCryUrl(p.name.en)
          }));

          // Cache the data
          const cacheData: CachedData = {
            timestamp: Date.now(),
            pokemons: pokemonData.reduce((acc, pokemon) => {
              acc[pokemon.id] = pokemon;
              return acc;
            }, {} as Record<number, Pokemon>)
          };
          setToStorage(POKEMON_CACHE_KEY, JSON.stringify(cacheData));
          console.log('💾 Pokemon data cached successfully');

          return { data: pokemonData };
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
          // Check cache first
          const cachedData = getFromStorage(POKEMON_CACHE_KEY);
          if (cachedData) {
            const { timestamp, pokemons } = JSON.parse(cachedData) as CachedData;
            if (Date.now() - timestamp < CACHE_DURATION && pokemons[pokemonId]) {
              console.log('📦 Using cached Pokemon data for ID:', pokemonId);
              return { data: pokemons[pokemonId] };
            }
          }

          // If no cache or expired, fetch all Pokemon data
          console.log('🔄 Fetching Pokemon data from Tyradex API');
          const response = await fetch('https://tyradex.vercel.app/api/v1/pokemon');
          if (!response.ok) throw new Error('Failed to fetch from Tyradex API');

          const tyradexData = await response.json() as TyradexPokemon[];
          const pokemonData = tyradexData.find(p => p.pokedex_id === pokemonId);

          if (!pokemonData) {
            throw new Error(`Pokemon with ID ${pokemonId} not found`);
          }

          const pokemon: Pokemon = {
            id: pokemonData.pokedex_id,
            name: pokemonData.name.en.toLowerCase(),
            englishName: pokemonData.name.en,
            frenchName: pokemonData.name.fr,
            frenchFlavorText: '',
            englishFlavorText: '',
            sprite: pokemonData.sprites.regular,
            evolvesFromSpecies: null,
            hasEvolution: false,
            evolutionStage: 1,
            isLegendary: false,
            isMythical: false,
            cryUrl: getCryUrl(pokemonData.name.en)
          };

          // Cache all Pokemon data
          const allPokemonData = tyradexData.map(p => ({
            id: p.pokedex_id,
            name: p.name.en.toLowerCase(),
            englishName: p.name.en,
            frenchName: p.name.fr,
            frenchFlavorText: '',
            englishFlavorText: '',
            sprite: p.sprites.regular,
            evolvesFromSpecies: null,
            hasEvolution: false,
            evolutionStage: 1,
            isLegendary: false,
            isMythical: false,
            cryUrl: getCryUrl(p.name.en)
          }));

          const cacheData: CachedData = {
            timestamp: Date.now(),
            pokemons: allPokemonData.reduce((acc, pokemon) => {
              acc[pokemon.id] = pokemon;
              return acc;
            }, {} as Record<number, Pokemon>)
          };
          setToStorage(POKEMON_CACHE_KEY, JSON.stringify(cacheData));
          console.log('💾 Pokemon data cached successfully');

          return { data: pokemon };
        } catch (error) {
          console.error('❌ Error fetching pokemon data:', error);
          return { error: error as ApiError };
        }
      }
    })
  })
});

export const { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } = pokemonApi; 