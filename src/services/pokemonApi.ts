import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { Pokemon } from '@/components/pokemon-game/types';

interface PokemonSpeciesResponse {
  name: string;
  names: Array<{
    language: { name: string };
    name: string;
  }>;
  flavor_text_entries: Array<{
    flavor_text: string;
    language: { name: string };
    version: { name: string; url: string };
  }>;
  is_legendary: boolean;
  is_mythical: boolean;
  evolves_from_species: { name: string } | null;
  evolution_chain: { url: string };
  forms_switchable: boolean;
  gender_rate: number;
  has_gender_differences: boolean;
  id: number;
  is_baby: boolean;
  varieties: Array<{
    is_default: boolean;
    pokemon: {
      name: string;
      url: string;
    };
  }>;
  genera: Array<{
    genus: string;
    language: { name: string };
  }>;
  generation: {
    name: string;
    url: string;
  };
}

interface PokemonResponse {
  id: number;
  name: string;
  sprites: {
    other: {
      'official-artwork': {
        front_default: string;
      };
    };
  };
}

interface EvolutionChainNode {
  species: { name: string };
  evolves_to: EvolutionChainNode[];
}

interface EvolutionChain {
  chain: EvolutionChainNode;
}

type EvolutionChainResponse = EvolutionChain;

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

const getEvolutionStage = async (pokemonName: string): Promise<number> => {
  try {
    const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${pokemonName}`);
    const speciesData = await speciesResponse.json();
    const evolutionChainUrl = speciesData.evolution_chain.url;
    
    const evolutionResponse = await fetch(evolutionChainUrl);
    const evolutionData: EvolutionChain = await evolutionResponse.json();
    
    // Check first stage
    if (evolutionData.chain.species.name === pokemonName) {
      return 1;
    }
    
    // Check second stage
    for (const firstEvo of evolutionData.chain.evolves_to) {
      if (firstEvo.species.name === pokemonName) {
        return 2;
      }
      
      // Check third stage
      for (const secondEvo of firstEvo.evolves_to) {
        if (secondEvo.species.name === pokemonName) {
          return 3;
        }
      }
    }
    
    return 1;
  } catch (error) {
    console.error('Error fetching evolution stage:', error);
    return 1;
  }
};

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

export const transformPokemonData = async (data: PokemonResponse & { species: { url: string } }): Promise<Pokemon> => {
  const speciesResponse = await fetch(data.species.url);
  const speciesData = await speciesResponse.json() as PokemonSpeciesResponse;

  const frenchName = speciesData.names.find((name) => name.language.name === 'fr')?.name || data.name;
  const frenchFlavorText = speciesData.flavor_text_entries.find(
    (entry) => entry.language.name === 'fr'
  )?.flavor_text || '';
  const englishFlavorText = speciesData.flavor_text_entries.find(
    (entry) => entry.language.name === 'en'
  )?.flavor_text || '';

  const evolutionStage = await getEvolutionStage(data.name);

  return {
    id: data.id,
    name: data.name,
    frenchName,
    frenchFlavorText: frenchFlavorText.replace(/\n/g, ' ').replace(/\f/g, ' '),
    englishFlavorText: englishFlavorText.replace(/\n/g, ' ').replace(/\f/g, ' '),
    sprite: data.sprites.other['official-artwork'].front_default,
    evolvesFromSpecies: speciesData.evolves_from_species?.name || null,
    hasEvolution: evolutionStage < 3,
    evolutionStage,
    isLegendary: speciesData.is_legendary,
    isMythical: speciesData.is_mythical,
    cryUrl: getCryUrl(data.name)
  };
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
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
  endpoints: (builder) => ({
    getAllPokemonNames: builder.query<Pokemon[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          // Check cache first
          const cachedData = getFromStorage(POKEMON_NAMES_CACHE_KEY);
          if (cachedData) {
            const { timestamp, names } = JSON.parse(cachedData) as CachedNamesData;
            if (Date.now() - timestamp < CACHE_DURATION) {
              // Map cached data to Pokemon objects
              const pokemonList = names.map(p => ({
                id: p.id,
                name: p.name,
                frenchName: p.frenchName || p.name,
                frenchFlavorText: '',
                englishFlavorText: '',
                sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${p.id}.png`,
                evolvesFromSpecies: null,
                hasEvolution: false,
                evolutionStage: 1,
                isLegendary: false,
                isMythical: false,
                cryUrl: getCryUrl(p.name)
              }));
              return { data: pokemonList };
            }
          }

          // If no cache or expired, fetch all pokemon species at once
          const response = await fetchWithBQ('pokemon-species?limit=1025');
          if (response.error) throw response.error;

          const data = response.data as { results: Array<{ name: string; url: string }> };
          
          // Fetch all species data and evolution chains in parallel
          const speciesPromises = data.results.map((_pokemon, index) => 
            fetchWithBQ(`pokemon-species/${index + 1}`)
          );
          
          const speciesResponses = await Promise.all(speciesPromises);
          const evolutionChainPromises = speciesResponses.map(response => {
            const speciesData = response.data as PokemonSpeciesResponse;
            return fetchWithBQ(speciesData.evolution_chain.url.replace('https://pokeapi.co/api/v2/', ''));
          });
          
          const evolutionChainResponses = await Promise.all(evolutionChainPromises);
          
          const pokemonPromises = speciesResponses.map(async (response, index) => {
            const speciesData = response.data as PokemonSpeciesResponse;
            const evolutionChainData = evolutionChainResponses[index].data as EvolutionChainResponse;
            
            let hasEvolution = false;
            const checkEvolutions = (node: EvolutionChainNode) => {
              if (node.species.name === speciesData.name) {
                hasEvolution = node.evolves_to.length > 0;
              } else {
                node.evolves_to.forEach((evolution) => {
                  checkEvolutions(evolution);
                });
              }
            };
            checkEvolutions(evolutionChainData.chain);

            const evolutionStage = await getEvolutionStage(speciesData.name);
            const frenchNameData = speciesData.names.find(n => n.language.name === 'fr');
            const frenchName = frenchNameData ? frenchNameData.name : speciesData.name;

            return {
              id: index + 1,
              name: speciesData.name,
              frenchName,
              frenchFlavorText: speciesData.flavor_text_entries.find(entry => entry.language.name === 'fr')?.flavor_text || '',
              englishFlavorText: speciesData.flavor_text_entries.find(entry => entry.language.name === 'en')?.flavor_text || '',
              sprite: `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${index + 1}.png`,
              isLegendary: speciesData.is_legendary,
              isMythical: speciesData.is_mythical,
              evolvesFromSpecies: speciesData.evolves_from_species?.name || null,
              hasEvolution,
              evolutionStage,
              cryUrl: `https://play.pokemonshowdown.com/audio/cries/${speciesData.name.toLowerCase()}.mp3`
            };
          });

          const pokemonData = await Promise.all(pokemonPromises);

          // Cache the data
          const cacheData: CachedNamesData = {
            timestamp: Date.now(),
            names: pokemonData.map(p => ({
              id: p.id,
              name: p.name,
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
          // Check cache first
          const cachedData = getFromStorage(POKEMON_CACHE_KEY);
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

          const pokemon: Pokemon = {
            id: pokemonId,
            name: pokemonData.name,
            frenchName,
            frenchFlavorText,
            englishFlavorText,
            sprite: pokemonData.sprites.other['official-artwork'].front_default,
            evolvesFromSpecies: speciesData.evolves_from_species?.name || null,
            hasEvolution: false,
            evolutionStage: await getEvolutionStage(pokemonData.name),
            isLegendary: speciesData.is_legendary,
            isMythical: speciesData.is_mythical,
            cryUrl: getCryUrl(pokemonData.name)
          };

          // Update cache with new pokemon data
          const existingCache = getFromStorage(POKEMON_CACHE_KEY);
          const cache: CachedPokemonData = existingCache 
            ? JSON.parse(existingCache)
            : { timestamp: Date.now(), pokemons: {} };

          if (Date.now() - cache.timestamp >= CACHE_DURATION) {
            cache.timestamp = Date.now();
            cache.pokemons = {};
          }

          cache.pokemons[pokemonId] = pokemon;
          setToStorage(POKEMON_CACHE_KEY, JSON.stringify(cache));

          return { data: pokemon };
        } catch (error) {
          return { error: error as ApiError };
        }
      }
    })
  })
});

export const { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } = pokemonApi; 