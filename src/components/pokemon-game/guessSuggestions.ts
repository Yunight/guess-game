import type { Pokemon } from "@/components/pokemon-game/types";
import { compareGuessSuggestionPokemon } from "./guessSuggestionScoring";

export interface GuessSuggestionInput {
	value: string;
	pokemonList: readonly Pokemon[];
	startId: number;
	endId: number;
	language: string;
	normalizeName: (name: string) => string;
}

export const buildGuessSuggestions = ({
	value,
	pokemonList,
	startId,
	endId,
	language,
	normalizeName,
}: GuessSuggestionInput): string[] => {
	if (value.length === 0) {
		return [];
	}

	const normalizedValue = normalizeName(value);

	return pokemonList
		.filter((pokemon) => {
			const pokemonNameFr = pokemon.frenchName;
			const pokemonNameEn = pokemon.englishName;
			if (!pokemonNameFr || !pokemonNameEn) {
				return false;
			}

			const normalizedNameFr = normalizeName(pokemonNameFr);
			const normalizedNameEn = normalizeName(pokemonNameEn);

			return (
				(normalizedNameFr.includes(normalizedValue) ||
					normalizedNameEn.includes(normalizedValue)) &&
				pokemon.id >= startId &&
				pokemon.id <= endId
			);
		})
		.sort((a, b) =>
			compareGuessSuggestionPokemon(a, b, {
				normalizedValue,
				normalizeName,
			}),
		)
		.map((pokemon) =>
			language === "fr" ? pokemon.frenchName : pokemon.englishName,
		)
		.filter((name): name is string => Boolean(name))
		.slice(0, 5);
};
