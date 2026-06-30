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

const getRankingsCollectionName = (generation: Generation): string =>
	`rankings_gen${generation.startId}_${generation.endId}`;

export interface GenerationOccupancyDeps {
	query: (
		collectionRef: unknown,
		...constraints: unknown[]
	) => unknown;
	where: (field: string, op: string, value: string) => unknown;
	getDocs: (queryRef: unknown) => Promise<{ empty: boolean }>;
	getCollection: (name: string) => unknown;
}

export const fetchGenerationOccupancy = async (
	generations: readonly Generation[],
	storedName: string,
	uid: string | undefined,
	deps: GenerationOccupancyDeps,
): Promise<boolean[]> => {
	const generationOccupied: boolean[] = [];

	for (const gen of generations) {
		const collectionName = getRankingsCollectionName(gen);
		const rankingsRef = deps.getCollection(collectionName);
		const q = deps.query(
			rankingsRef,
			uid ? deps.where("uid", "==", uid) : deps.where("name", "==", storedName),
		);
		const querySnapshot = await deps.getDocs(q);
		generationOccupied.push(!querySnapshot.empty);
	}

	return generationOccupied;
};

const shouldAllowAuthenticatedDisplayName = (
	displayName: string | null | undefined,
	name: string,
): boolean => displayName === name;

const NAME_ALREADY_USED_ERROR =
	"Ce nom est déjà utilisé. Veuillez en choisir un autre.";

export const NAME_CHECK_ERROR = "Erreur lors de la vérification du nom";

interface NameValidationResult {
	available: boolean;
	errorMessage: string | null;
}

const validateNameAcrossGenerations = (
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

export interface NameAvailabilityCheckResult {
	available: boolean;
	errorMessage: string | null;
	shouldClearStorage: boolean;
}

export const resolveNameAvailabilityCheck = (
	storedName: string,
	displayName: string,
	authDisplayName: string | null | undefined,
	generationOccupied: readonly boolean[],
	isAuthenticated: boolean,
): NameAvailabilityCheckResult => {
	if (!storedName) {
		return { available: false, errorMessage: null, shouldClearStorage: true };
	}

	if (shouldAllowAuthenticatedDisplayName(authDisplayName, displayName)) {
		return { available: true, errorMessage: null, shouldClearStorage: false };
	}

	const validation = validateNameAcrossGenerations(
		generationOccupied,
		isAuthenticated,
	);

	return {
		available: validation.available,
		errorMessage: validation.errorMessage,
		shouldClearStorage: !validation.available,
	};
};

export interface AuthStatePlayerNameResult {
	playerName: string | null;
	isAuthName: boolean;
	shouldPersist: boolean;
}

export const resolveAuthStatePlayerName = (
	user: { displayName: string | null; email: string | null } | null,
	savedName: string | null,
): AuthStatePlayerNameResult => {
	if (user?.displayName) {
		const formattedName = formatDisplayName(user.displayName, user.email);
		return {
			playerName: formattedName,
			isAuthName: true,
			shouldPersist: true,
		};
	}

	if (!user && savedName) {
		return {
			playerName: savedName,
			isAuthName: false,
			shouldPersist: false,
		};
	}

	return {
		playerName: null,
		isAuthName: false,
		shouldPersist: false,
	};
};

export type PerformNameAvailabilityCheckDeps = GenerationOccupancyDeps;

export const performNameAvailabilityCheck = async (
	name: string,
	generations: readonly Generation[],
	authDisplayName: string | null | undefined,
	isAuthenticated: boolean,
	uid: string | undefined,
	deps: PerformNameAvailabilityCheckDeps,
): Promise<NameAvailabilityCheckResult> => {
	const storedName = convertToStoredFormat(name.trim());

	if (!storedName) {
		return { available: false, errorMessage: null, shouldClearStorage: true };
	}

	if (shouldAllowAuthenticatedDisplayName(authDisplayName, name.trim())) {
		return { available: true, errorMessage: null, shouldClearStorage: false };
	}

	const generationOccupied = await fetchGenerationOccupancy(
		generations,
		storedName,
		uid,
		deps,
	);

	return resolveNameAvailabilityCheck(
		storedName,
		name.trim(),
		authDisplayName,
		generationOccupied,
		isAuthenticated,
	);
};

export interface NameCheckStateSetters {
	setNameError: (value: string | null) => void;
	setIsCheckingName: (value: boolean) => void;
}

export const applyNameAvailabilityCheckResult = (
	result: NameAvailabilityCheckResult,
	setters: NameCheckStateSetters,
): boolean => {
	if (!result.available) {
		setters.setNameError(result.errorMessage);
		if (result.shouldClearStorage) {
			localStorage.removeItem("pokemonGamePlayerName");
		}
		setters.setIsCheckingName(false);
		return false;
	}

	setters.setNameError(null);
	setters.setIsCheckingName(false);
	return true;
};
