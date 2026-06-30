import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	CACHE_DURATION,
	CRY_URL_CACHE_KEY,
	FLAVOR_TEXT_CACHE_KEY,
	TYRADEX_CACHE_KEY,
	fetchTyradexPokemonList,
	getCryUrl,
	getFlavorText,
} from "../pokemonApiFetch";

const mockFetch = vi.fn();

const tyradexPokemon = {
	pokedex_id: 25,
	name: { fr: "Pikachu", en: "Pikachu" },
	sprites: {
		regular: "https://example.com/pikachu.png",
		shiny: null,
		gmax: null,
	},
};

const createJsonResponse = (
	data: unknown,
	ok = true,
): { ok: boolean; json: () => Promise<unknown> } => ({
	ok,
	json: (): Promise<unknown> => Promise.resolve(data),
});

describe("getCryUrl", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal("fetch", mockFetch);
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns cached cry url when cache is valid", async () => {
		const cacheKey = `${CRY_URL_CACHE_KEY}_25`;
		localStorage.setItem(
			cacheKey,
			JSON.stringify({
				timestamp: Date.now(),
				cryUrl: "https://cached|https://legacy",
			}),
		);

		const result = await getCryUrl(25);

		expect(result).toBe("https://cached|https://legacy");
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("fetches cry url and caches result when cache is missing", async () => {
		mockFetch.mockResolvedValue(
			createJsonResponse({
				cries: {
					latest: "https://latest",
					legacy: "https://legacy",
				},
			}),
		);

		const result = await getCryUrl(25);

		expect(result).toBe("https://latest|https://legacy");
		expect(mockFetch).toHaveBeenCalledWith(
			"https://pokeapi.co/api/v2/pokemon/25",
		);

		const cacheKey = `${CRY_URL_CACHE_KEY}_25`;
		const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "");
		expect(cached.cryUrl).toBe("https://latest|https://legacy");
		expect(typeof cached.timestamp).toBe("number");
	});

	it("returns empty string when fetch fails", async () => {
		mockFetch.mockResolvedValue(createJsonResponse({}, false));

		const result = await getCryUrl(25);

		expect(result).toBe("");
	});

	it("refetches when cache is expired", async () => {
		const cacheKey = `${CRY_URL_CACHE_KEY}_25`;
		localStorage.setItem(
			cacheKey,
			JSON.stringify({
				timestamp: Date.now() - CACHE_DURATION - 1,
				cryUrl: "https://stale|https://legacy",
			}),
		);

		mockFetch.mockResolvedValue(
			createJsonResponse({
				cries: {
					latest: "https://fresh",
					legacy: "https://legacy",
				},
			}),
		);

		const result = await getCryUrl(25);

		expect(result).toBe("https://fresh|https://legacy");
		expect(mockFetch).toHaveBeenCalled();
	});
});

describe("getFlavorText", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal("fetch", mockFetch);
		mockFetch.mockReset();
		vi.spyOn(Math, "random").mockReturnValue(0);
	});

	afterEach(() => {
		vi.restoreAllMocks();
		vi.unstubAllGlobals();
	});

	it("returns cached flavor text when cache is valid", async () => {
		const cacheKey = `${FLAVOR_TEXT_CACHE_KEY}_25`;
		localStorage.setItem(
			cacheKey,
			JSON.stringify({
				timestamp: Date.now(),
				french: "Texte français",
				english: "English text",
			}),
		);

		const result = await getFlavorText(25);

		expect(result).toEqual({
			french: "Texte français",
			english: "English text",
		});
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("fetches flavor text and caches result when cache is missing", async () => {
		mockFetch.mockResolvedValue(
			createJsonResponse({
				flavor_text_entries: [
					{
						flavor_text: "Français",
						language: { name: "fr" },
						version: { name: "red" },
					},
					{
						flavor_text: "English",
						language: { name: "en" },
						version: { name: "red" },
					},
				],
			}),
		);

		const result = await getFlavorText(25);

		expect(result).toEqual({ french: "Français", english: "English" });
		expect(mockFetch).toHaveBeenCalledWith(
			"https://pokeapi.co/api/v2/pokemon-species/25",
		);

		const cacheKey = `${FLAVOR_TEXT_CACHE_KEY}_25`;
		const cached = JSON.parse(localStorage.getItem(cacheKey) ?? "");
		expect(cached.french).toBe("Français");
		expect(cached.english).toBe("English");
	});

	it("returns empty strings when fetch fails", async () => {
		mockFetch.mockResolvedValue(createJsonResponse({}, false));

		const result = await getFlavorText(25);

		expect(result).toEqual({ french: "", english: "" });
	});
});

describe("fetchTyradexPokemonList", () => {
	beforeEach(() => {
		localStorage.clear();
		vi.stubGlobal("fetch", mockFetch);
		mockFetch.mockReset();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
	});

	it("returns cached tyradex data when cache is valid", async () => {
		localStorage.setItem(
			TYRADEX_CACHE_KEY,
			JSON.stringify({
				timestamp: Date.now(),
				tyradexData: [tyradexPokemon],
			}),
		);

		const result = await fetchTyradexPokemonList();

		expect(result).toEqual([tyradexPokemon]);
		expect(mockFetch).not.toHaveBeenCalled();
	});

	it("fetches tyradex list and caches result when cache is missing", async () => {
		mockFetch.mockResolvedValue(createJsonResponse([tyradexPokemon]));

		const result = await fetchTyradexPokemonList();

		expect(result).toEqual([tyradexPokemon]);
		expect(mockFetch).toHaveBeenCalledWith(
			"https://tyradex.app/api/v1/pokemon",
			expect.objectContaining({ signal: expect.any(AbortSignal) }),
		);

		const cached = JSON.parse(localStorage.getItem(TYRADEX_CACHE_KEY) ?? "");
		expect(cached.tyradexData).toEqual([tyradexPokemon]);
		expect(typeof cached.timestamp).toBe("number");
	});

	it("throws when tyradex fetch fails", async () => {
		mockFetch.mockResolvedValue(createJsonResponse({}, false));

		await expect(fetchTyradexPokemonList()).rejects.toThrow(
			"Failed to fetch from Tyradex API",
		);
	});

	it("refetches when cache is expired", async () => {
		localStorage.setItem(
			TYRADEX_CACHE_KEY,
			JSON.stringify({
				timestamp: Date.now() - CACHE_DURATION - 1,
				tyradexData: [{ ...tyradexPokemon, pokedex_id: 1 }],
			}),
		);

		mockFetch.mockResolvedValue(createJsonResponse([tyradexPokemon]));

		const result = await fetchTyradexPokemonList();

		expect(result).toEqual([tyradexPokemon]);
		expect(mockFetch).toHaveBeenCalled();
	});
});
