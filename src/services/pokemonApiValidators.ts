export interface TyradexPokemon {
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

export interface PokemonCries {
	latest: string;
	legacy: string;
}

export interface FlavorTextEntry {
	flavor_text: string;
	language: {
		name: string;
	};
	version: {
		name: string;
	};
}

export interface PokemonSpecies {
	flavor_text_entries: FlavorTextEntry[];
}

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const isString = (value: unknown): value is string => typeof value === "string";

const isNumber = (value: unknown): value is number =>
	typeof value === "number" && Number.isFinite(value);

export const isTyradexPokemon = (value: unknown): value is TyradexPokemon => {
	if (!isRecord(value)) {
		return false;
	}

	if (!isNumber(value.pokedex_id)) {
		return false;
	}

	if (!isRecord(value.name)) {
		return false;
	}

	if (!isString(value.name.fr) || !isString(value.name.en)) {
		return false;
	}

	if (!isRecord(value.sprites) || !isString(value.sprites.regular)) {
		return false;
	}

	return true;
};

export const parseTyradexPokemonList = (value: unknown): TyradexPokemon[] => {
	if (!Array.isArray(value)) {
		throw new Error("Invalid Tyradex response: expected an array");
	}

	const parsed: TyradexPokemon[] = [];
	for (const item of value) {
		if (!isTyradexPokemon(item)) {
			throw new Error("Invalid Tyradex pokemon entry in list response");
		}
		parsed.push(item);
	}

	return parsed;
};

export const parseTyradexPokemon = (value: unknown): TyradexPokemon => {
	if (!isTyradexPokemon(value)) {
		throw new Error("Invalid Tyradex pokemon response");
	}
	return value;
};

export const isPokemonCries = (value: unknown): value is PokemonCries => {
	if (!isRecord(value)) {
		return false;
	}
	return isString(value.latest) && isString(value.legacy);
};

const isFlavorTextEntry = (value: unknown): value is FlavorTextEntry => {
	if (!isRecord(value) || !isString(value.flavor_text)) {
		return false;
	}

	if (!isRecord(value.language) || !isString(value.language.name)) {
		return false;
	}

	if (!isRecord(value.version) || !isString(value.version.name)) {
		return false;
	}

	return true;
};

export const isPokemonSpecies = (value: unknown): value is PokemonSpecies => {
	if (!isRecord(value) || !Array.isArray(value.flavor_text_entries)) {
		return false;
	}

	return value.flavor_text_entries.every(isFlavorTextEntry);
};

export const parsePokemonCries = (value: unknown): PokemonCries => {
	if (!isPokemonCries(value)) {
		throw new Error("Invalid PokeAPI cries response");
	}
	return value;
};

export const parsePokemonSpecies = (value: unknown): PokemonSpecies => {
	if (!isPokemonSpecies(value)) {
		throw new Error("Invalid PokeAPI species response");
	}
	return value;
};
