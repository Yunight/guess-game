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

export const pokemonApi = createApi({
  reducerPath: 'pokemonApi',
  baseQuery: fetchBaseQuery({ baseUrl: 'https://pokeapi.co/api/v2/' }),
  endpoints: (builder) => ({
    getAllPokemonNames: builder.query<string[], void>({
      async queryFn(_arg, _queryApi, _extraOptions, fetchWithBQ) {
        try {
          const response = await fetchWithBQ('pokemon-species?limit=1000');
          if (response.error) throw response.error;

          const data = response.data as { results: Array<{ url: string }> };
          const namesPromises = data.results.map(async (pokemon) => {
            const speciesResponse = await fetchWithBQ(pokemon.url.replace('https://pokeapi.co/api/v2/', ''));
            const speciesData = speciesResponse.data as PokemonSpeciesResponse;
            return speciesData.names.find(
              (name) => name.language.name === 'fr'
            )?.name || pokemon.name;
          });

          const names = await Promise.all(namesPromises);
          return { data: names };
        } catch (error) {
          return { error: error as { status: number; data: any } };
        }
      }
    }),
    getPokemonById: builder.query<Pokemon, number>({
      async queryFn(pokemonId, _queryApi, _extraOptions, fetchWithBQ) {
        try {
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

          return {
            data: {
              id: pokemonId,
              name: pokemonData.name,
              frenchName,
              imageUrl: pokemonData.sprites.other['official-artwork'].front_default,
              flavorText: frenchFlavorText,
              cryUrl
            }
          };
        } catch (error) {
          return { error: error as { status: number; data: any } };
        }
      }
    })
  })
});

export const { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } = pokemonApi; 