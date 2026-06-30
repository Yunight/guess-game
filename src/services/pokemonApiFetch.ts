import {
	extractFlavorTexts,
	formatCryUrl,
} from "./pokemonApiTransform";
import {
	getFromStorage,
	isCachedCryUrl,
	isCachedData,
	isCachedFlavorText,
	setToStorage,
} from "./pokemonApiStorage";
import {
	parsePokemonCries,
	parsePokemonSpecies,
	parseTyradexPokemonList,
	type TyradexPokemon,
} from "./pokemonApiValidators";

export const TYRADEX_BASE_URL = "https://tyradex.app/api/v1";
export const TYRADEX_CACHE_KEY = "tyradexCache";
export const FLAVOR_TEXT_CACHE_KEY = "flavorTextCache";
export const CRY_URL_CACHE_KEY = "cryUrlCache";
export const CACHE_DURATION = 24 * 60 * 60 * 1000;

const isRecord = (value: unknown): value is Record<string, unknown> =>
	typeof value === "object" && value !== null;

const getCriesFromPokemonResponse = (data: unknown): unknown => {
	if (isRecord(data) && "cries" in data) {
		return data.cries;
	}
	return data;
};

export const getCryUrl = async (id: number): Promise<string> => {
	const cacheKey = `${CRY_URL_CACHE_KEY}_${id}`;
	const cached = getFromStorage(cacheKey);

	if (
		isCachedCryUrl(cached) &&
		Date.now() - cached.timestamp < CACHE_DURATION
	) {
		return cached.cryUrl;
	}

	try {
		const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${id}`);
		if (!response.ok) throw new Error("Failed to fetch Pokemon cry");

		const data: unknown = await response.json();
		const cries = parsePokemonCries(getCriesFromPokemonResponse(data));
		const cryUrl = formatCryUrl(cries);

		setToStorage(cacheKey, {
			timestamp: Date.now(),
			cryUrl,
		});

		return cryUrl;
	} catch (error) {
		console.error("Error fetching Pokemon cry:", error);
		return "";
	}
};

export const getFlavorText = async (
	id: number,
): Promise<{ french: string; english: string }> => {
	const cacheKey = `${FLAVOR_TEXT_CACHE_KEY}_${id}`;
	const cached = getFromStorage(cacheKey);

	if (
		isCachedFlavorText(cached) &&
		Date.now() - cached.timestamp < CACHE_DURATION
	) {
		return { french: cached.french, english: cached.english };
	}

	try {
		const response = await fetch(
			`https://pokeapi.co/api/v2/pokemon-species/${id}`,
		);
		if (!response.ok) throw new Error("Failed to fetch Pokemon flavor text");

		const data: unknown = await response.json();
		const species = parsePokemonSpecies(data);
		const result = extractFlavorTexts(species.flavor_text_entries);

		setToStorage(cacheKey, {
			timestamp: Date.now(),
			...result,
		});

		return result;
	} catch (error) {
		console.error("Error fetching Pokemon flavor text:", error);
		return { french: "", english: "" };
	}
};

export const fetchTyradexPokemonList = async (): Promise<TyradexPokemon[]> => {
	const cachedData = getFromStorage(TYRADEX_CACHE_KEY);

	if (
		isCachedData(cachedData) &&
		Date.now() - cachedData.timestamp < CACHE_DURATION
	) {
		return cachedData.tyradexData;
	}

	const response = await fetch(`${TYRADEX_BASE_URL}/pokemon`, {
		signal: AbortSignal.timeout(15000),
	});
	if (!response.ok) {
		throw new Error("Failed to fetch from Tyradex API");
	}

	const tyradexData = parseTyradexPokemonList(await response.json());

	setToStorage(TYRADEX_CACHE_KEY, {
		timestamp: Date.now(),
		tyradexData,
	});

	return tyradexData;
};
