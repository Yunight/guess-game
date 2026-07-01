import type { TyradexPokemon } from "./pokemonApiValidators";

export interface CachedData {
	timestamp: number;
	tyradexData: TyradexPokemon[];
}

export interface CachedFlavorText {
	timestamp: number;
	french: string;
	english: string;
}

export interface CachedCryUrl {
	timestamp: number;
	cryUrl: string;
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

export const getFromStorage = (key: string): unknown => {
	if (typeof window === "undefined") return null;
	try {
		const item = localStorage.getItem(key);
		return item ? JSON.parse(item) : null;
	} catch (error) {
		console.error("Error accessing localStorage:", error);
		try {
			localStorage.removeItem(key);
		} catch {
			void 0;
		}
		return null;
	}
};

export const setToStorage = (key: string, value: unknown): void => {
	if (typeof window === "undefined") return;
	try {
		localStorage.setItem(key, JSON.stringify(value));
	} catch (error) {
		console.error("Error writing to localStorage:", error);
		try {
			const keys = Object.keys(localStorage);
			const cacheKeys = keys.filter((k) => k.includes("Cache"));
			for (const k of cacheKeys) {
				localStorage.removeItem(k);
			}
			localStorage.setItem(key, JSON.stringify(value));
		} catch {
			void 0;
		}
	}
};

export const isCachedData = (value: unknown): value is CachedData => {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.timestamp === "number" &&
		Array.isArray(value.tyradexData) &&
		value.tyradexData.every((entry) => typeof entry === "object")
	);
};

export const isCachedFlavorText = (value: unknown): value is CachedFlavorText => {
	if (!isRecord(value)) {
		return false;
	}
	return (
		typeof value.timestamp === "number" &&
		typeof value.french === "string" &&
		typeof value.english === "string"
	);
};

export const isCachedCryUrl = (value: unknown): value is CachedCryUrl => {
	if (!isRecord(value)) {
		return false;
	}
	return typeof value.timestamp === "number" && typeof value.cryUrl === "string";
};
