const MUTED_STORAGE_KEY = "pokemonGameMuted:v1";
const LEGACY_MUTED_STORAGE_KEY = "pokemonGameMuted";

const parseLegacyMutedValue = (value: string): boolean => {
	try {
		return JSON.parse(value) as boolean;
	} catch {
		return value === "true";
	}
};

export const readMutedPreference = (): boolean => {
	const savedValue = localStorage.getItem(MUTED_STORAGE_KEY);
	if (savedValue !== null) {
		return savedValue === "true";
	}

	const legacyValue = localStorage.getItem(LEGACY_MUTED_STORAGE_KEY);
	if (legacyValue === null) {
		return false;
	}

	return parseLegacyMutedValue(legacyValue);
};

export const writeMutedPreference = (isMuted: boolean): void => {
	localStorage.setItem(MUTED_STORAGE_KEY, String(isMuted));
};
