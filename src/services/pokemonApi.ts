import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Pokemon } from '@/components/pokemon-game/types';

interface TyradexPokemon {
  pokedex_id: number;
  generation: number;
  category: string;
  name: {
    fr: string;
    en: string;
    jp: string;
  };
  sprites: {
    regular: string;
    shiny: string | null;
    gmax: {
      regular: string;
      shiny: string;
    } | null;
  };
  evolution: {
    pre: Array<{
      pokedex_id: number;
      name: string;
      condition: string;
    }> | null;
    next: Array<{
      pokedex_id: number;
      name: string;
      condition: string;
    }> | null;
  } | null;
}

interface PokeAPIFlavorTextEntry {
  flavor_text: string;
  language: {
    name: string;
  };
}

interface PokeAPISpeciesResponse {
  flavor_text_entries: PokeAPIFlavorTextEntry[];
}

const POKEMON_NAMES_CACHE_KEY = 'allPokemonNamesCache';
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

interface CachedNamesData {
  timestamp: number;
  names: Array<{
    id: number;
    name: string;
    englishName: string;
    frenchName: string;
  }>;
}

interface ApiError {
  status: number;
  data: unknown;
}

// Add legendary and mythical Pokemon ID lists
const LEGENDARY_POKEMON_IDS = new Set([144, 145, 146, 150, 243, 244, 245, 249, 250, 377, 378, 379, 380, 381, 382, 383, 384, 480, 481, 482, 483, 484, 485, 486, 487, 488, 638, 639, 640, 641, 642, 643, 644, 645, 646, 716, 717, 718, 772, 773, 785, 786, 787, 788, 789, 790, 791, 792, 800, 888, 889, 890, 894, 895, 896, 897, 898]);

const MYTHICAL_POKEMON_IDS = new Set([151, 251, 385, 386, 489, 490, 491, 492, 493, 494, 647, 648, 649, 719, 720, 721, 801, 802, 807, 808, 809, 893]);

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

  const normalizedName = name.toLowerCase();
  const soundName = specialCases[normalizedName] || normalizedName
    .replace(/[^a-z0-9]/g, '')
    .replace(/\s+/g, '');

  return `https://play.pokemonshowdown.com/audio/cries/${soundName}.mp3|https://play.pokemonshowdown.com/audio/cries/${soundName}.ogg`;
};

// Add function to fetch flavor text from PokeAPI
const fetchFlavorText = async (pokemonId: number, language: string): Promise<string> => {
  try {
    const response = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);
    const data = await response.json() as PokeAPISpeciesResponse;
    
    const flavorTextEntry = data.flavor_text_entries
      .reverse()
      .find(entry => entry.language.name === language);
    
    if (flavorTextEntry) {
      return flavorTextEntry.flavor_text
        .replace(/[\f\n\r]/g, ' ')
        .replace(/POKéMON/g, 'Pokémon')
        .replace(/  +/g, ' ')
        .trim();
    }
    return '';
  } catch (error) {
    console.error('Error fetching flavor text:', error);
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

// Add in-memory cache for all Pokemon data
let inMemoryPokemonCache: Pokemon[] | null = null;
let inMemoryCacheTimestamp: number = 0;

export const transformTyradexPokemon = async (pokemon: TyradexPokemon, shouldFetchFlavorText = false): Promise<Pokemon> => {
  const isShiny = pokemon.sprites.shiny !== null;
  const sprite = isShiny ? pokemon.sprites.shiny : pokemon.sprites.regular;

  // Only fetch flavor text if explicitly requested
  const [frenchFlavorText, englishFlavorText] = shouldFetchFlavorText 
    ? await Promise.all([
        fetchFlavorText(pokemon.pokedex_id, 'fr'),
        fetchFlavorText(pokemon.pokedex_id, 'en')
      ])
    : ['', ''];

  return {
    id: pokemon.pokedex_id,
    name: pokemon.name.en.toLowerCase(),
    englishName: pokemon.name.en,
    frenchName: pokemon.name.fr,
    sprite: sprite || '',
    isLegendary: LEGENDARY_POKEMON_IDS.has(pokemon.pokedex_id),
    isMythical: MYTHICAL_POKEMON_IDS.has(pokemon.pokedex_id),
    isShiny,
    hasEvolution: Boolean(pokemon.evolution?.next?.length),
    evolvesFromSpecies: pokemon.evolution?.pre?.[0]?.name || null,
    evolutionStage: pokemon.evolution?.pre?.length || 0,
    cryUrl: getCryUrl(pokemon.name.en),
    frenchFlavorText,
    englishFlavorText,
  };
};

export const pokemonApi = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://tyradex.vercel.app/api/v1/' }),
  endpoints: (builder) => ({
    getAllPokemonNames: builder.query<Pokemon[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          // Check in-memory cache first
          if (inMemoryPokemonCache && Date.now() - inMemoryCacheTimestamp < CACHE_DURATION) {
            return { data: inMemoryPokemonCache };
          }

          // Check localStorage cache
          const cachedData = getFromStorage(POKEMON_NAMES_CACHE_KEY);
          if (cachedData) {
            const { timestamp, names } = JSON.parse(cachedData) as CachedNamesData;
            if (Date.now() - timestamp < CACHE_DURATION) {
              const pokemonList = names.map(p => ({
                id: p.id,
                name: p.name,
                englishName: p.englishName,
                frenchName: p.frenchName,
                frenchFlavorText: '',
                englishFlavorText: '',
                sprite: `https://raw.githubusercontent.com/Yarkis01/TyraDex/images/sprites/${p.id}/regular.png`,
                evolvesFromSpecies: null,
                hasEvolution: false,
                evolutionStage: 1,
                isLegendary: LEGENDARY_POKEMON_IDS.has(p.id),
                isMythical: MYTHICAL_POKEMON_IDS.has(p.id),
                cryUrl: getCryUrl(p.name),
                isShiny: false
              }));
              inMemoryPokemonCache = pokemonList;
              inMemoryCacheTimestamp = Date.now();
              return { data: pokemonList };
            }
          }

          const response = await fetchWithBQ('pokemon');
          if (response.error) throw response.error;

          const pokemonPromises = (response.data as TyradexPokemon[])
            .filter(p => p.pokedex_id > 0)
            .map(p => transformTyradexPokemon(p, false)); // Don't fetch flavor text for the list

          const pokemonData = await Promise.all(pokemonPromises);

          inMemoryPokemonCache = pokemonData;
          inMemoryCacheTimestamp = Date.now();

          const cacheData: CachedNamesData = {
            timestamp: Date.now(),
            names: pokemonData.map(p => ({
              id: p.id,
              name: p.name,
              englishName: p.englishName,
              frenchName: p.frenchName
            }))
          };
          setToStorage(POKEMON_NAMES_CACHE_KEY, JSON.stringify(cacheData));

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
          if (inMemoryPokemonCache && Date.now() - inMemoryCacheTimestamp < CACHE_DURATION) {
            const pokemon = inMemoryPokemonCache.find(p => p.id === pokemonId);
            if (pokemon) {
              // If we have the Pokemon in cache but no flavor text, fetch it
              if (!pokemon.englishFlavorText || !pokemon.frenchFlavorText) {
                const [frenchFlavorText, englishFlavorText] = await Promise.all([
                  fetchFlavorText(pokemonId, 'fr'),
                  fetchFlavorText(pokemonId, 'en')
                ]);
                return { 
                  data: {
                    ...pokemon,
                    frenchFlavorText,
                    englishFlavorText
                  }
                };
              }
              return { data: pokemon };
            }
          }

          const response = await fetchWithBQ('pokemon');
          if (response.error) throw response.error;

          const pokemonData = (response.data as TyradexPokemon[]).find(p => p.pokedex_id === pokemonId);
          
          if (!pokemonData) {
            throw new Error(`Pokemon with ID ${pokemonId} not found`);
          }

          const pokemon = await transformTyradexPokemon(pokemonData, true); // Fetch flavor text for individual Pokemon
          return { data: pokemon };
        } catch (error) {
          return { error: error as ApiError };
        }
      }
    })
  })
});

export const { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } = pokemonApi; 