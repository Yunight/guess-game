import type { Pokemon } from "@/components/pokemon-game/types";

export interface GuessSuggestionCompareContext {
	normalizedValue: string;
	normalizeName: (name: string) => string;
}

export const compareGuessSuggestionPokemon = (
	a: Pokemon,
	b: Pokemon,
	{ normalizedValue, normalizeName }: GuessSuggestionCompareContext,
): number => {
	const aNameFr = normalizeName(a.frenchName);
	const aNameEn = normalizeName(a.englishName);
	const bNameFr = normalizeName(b.frenchName);
	const bNameEn = normalizeName(b.englishName);

	const aStartsWithFr = aNameFr.startsWith(normalizedValue);
	const aStartsWithEn = aNameEn.startsWith(normalizedValue);
	const bStartsWithFr = bNameFr.startsWith(normalizedValue);
	const bStartsWithEn = bNameEn.startsWith(normalizedValue);

	if ((aStartsWithFr || aStartsWithEn) && !(bStartsWithFr || bStartsWithEn)) {
		return -1;
	}
	if (!(aStartsWithFr || aStartsWithEn) && (bStartsWithFr || bStartsWithEn)) {
		return 1;
	}

	const aExactMatch =
		aNameFr === normalizedValue || aNameEn === normalizedValue;
	const bExactMatch =
		bNameFr === normalizedValue || bNameEn === normalizedValue;

	if (aExactMatch && !bExactMatch) {
		return -1;
	}
	if (!aExactMatch && bExactMatch) {
		return 1;
	}

	return a.englishName.localeCompare(b.englishName);
};
