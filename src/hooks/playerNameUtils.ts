import type { Generation } from "@/components/pokemon-game/generations";

const SPECIAL_CHARS = {
	é: "e",
	è: "e",
	ê: "e",
	ë: "e",
	à: "a",
	â: "a",
	ä: "a",
	î: "i",
	ï: "i",
	ô: "o",
	ö: "o",
	ù: "u",
	û: "u",
	ü: "u",
	ÿ: "y",
	ñ: "n",
	ç: "c",
} as const satisfies Record<string, string>;

type SpecialChar = keyof typeof SPECIAL_CHARS;

const isSpecialChar = (char: string): char is SpecialChar =>
	char in SPECIAL_CHARS;

export const convertToStoredFormat = (name: string): string =>
	name
		.trim()
		.toLowerCase()
		.replace(/[éèêëàâäîïôöùûüÿñç]/g, (char) =>
			isSpecialChar(char) ? SPECIAL_CHARS[char] : char,
		)
		.replace(/\s+/g, "_");

export const convertToDisplayFormat = (name: string): string =>
	name.replace(/_/g, " ");

export const formatDisplayName = (
	name: string | null | undefined,
	email: string | null | undefined,
): string => {
	if (!name) {
		return "";
	}

	const isGmailUser = email?.includes("@gmail.com");

	if (isGmailUser && name.includes(" ")) {
		const nameParts = name.split(" ");
		const firstName = nameParts[0];
		const lastPart = nameParts[nameParts.length - 1];
		const lastInitial = lastPart?.[0]?.toUpperCase();
		if (!firstName || !lastInitial) {
			return name;
		}
		return `${firstName} .${lastInitial}`;
	}

	return name;
};

export const getRankingsCollectionName = (generation: Generation): string =>
	`rankings_gen${generation.startId}_${generation.endId}`;

export const shouldAllowAuthenticatedDisplayName = (
	displayName: string | null | undefined,
	name: string,
): boolean => displayName === name;

export const NAME_ALREADY_USED_ERROR =
	"Ce nom est déjà utilisé. Veuillez en choisir un autre.";

export const NAME_CHECK_ERROR = "Erreur lors de la vérification du nom";

export interface NameValidationResult {
	available: boolean;
	errorMessage: string | null;
}

export const validateNameAcrossGenerations = (
	generationOccupied: readonly boolean[],
	isAuthenticated: boolean,
): NameValidationResult => {
	if (isAuthenticated) {
		return { available: true, errorMessage: null };
	}

	const isTaken = generationOccupied.some((occupied) => occupied);
	if (isTaken) {
		return { available: false, errorMessage: NAME_ALREADY_USED_ERROR };
	}

	return { available: true, errorMessage: null };
};
