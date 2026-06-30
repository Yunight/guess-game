import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getCachedCryUrl,
	playCryAudio,
	resolveCryAudioUrl,
	shouldSkipCryPlayback,
} from "../gameOverCryCache";

const POKEAPI_CACHE_KEY = "pokeApiCryCache";

const validCries = {
	latest: "https://example.com/latest.mp3",
	legacy: "https://example.com/legacy.mp3",
};

describe("resolveCryAudioUrl", () => {
	it("prefers latest cry url", () => {
		expect(resolveCryAudioUrl(validCries)).toBe(validCries.latest);
	});

	it("falls back to legacy cry url", () => {
		expect(
			resolveCryAudioUrl({ latest: "", legacy: validCries.legacy }),
		).toBe(validCries.legacy);
	});
});

describe("shouldSkipCryPlayback", () => {
	it("skips when same pokemon was already played", () => {
		expect(shouldSkipCryPlayback(25, 25, false)).toBe(true);
	});

	it("skips when muted", () => {
		expect(shouldSkipCryPlayback(25, null, true)).toBe(true);
	});

	it("allows playback for new pokemon when not muted", () => {
		expect(shouldSkipCryPlayback(25, 24, false)).toBe(false);
	});
});

describe("getCachedCryUrl", () => {
	beforeEach(() => {
		vi.stubGlobal("fetch", vi.fn());
		localStorage.clear();
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("returns cached cries when cache entry is fresh", async () => {
		localStorage.setItem(
			POKEAPI_CACHE_KEY,
			JSON.stringify({
				"25": {
					timestamp: Date.now(),
					cries: validCries,
				},
			}),
		);

		await expect(getCachedCryUrl(25)).resolves.toEqual(validCries);
		expect(fetch).not.toHaveBeenCalled();
	});

	it("fetches and caches cries when cache is missing", async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async (): Promise<unknown> => ({ cries: validCries }),
		} as Response);

		await expect(getCachedCryUrl(25)).resolves.toEqual(validCries);

		const cached = localStorage.getItem(POKEAPI_CACHE_KEY);
		expect(cached).toContain(validCries.latest);
		expect(fetch).toHaveBeenCalledWith(
			"https://pokeapi.co/api/v2/pokemon/25",
		);
	});

	it("ignores expired cache entries and refetches", async () => {
		const expiredTimestamp = Date.now() - 25 * 60 * 60 * 1000;
		localStorage.setItem(
			POKEAPI_CACHE_KEY,
			JSON.stringify({
				"25": {
					timestamp: expiredTimestamp,
					cries: validCries,
				},
			}),
		);

		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async (): Promise<unknown> => ({
				cries: {
					latest: "https://example.com/new-latest.mp3",
					legacy: "https://example.com/new-legacy.mp3",
				},
			}),
		} as Response);

		await expect(getCachedCryUrl(25)).resolves.toEqual({
			latest: "https://example.com/new-latest.mp3",
			legacy: "https://example.com/new-legacy.mp3",
		});
		expect(fetch).toHaveBeenCalled();
	});

	it("ignores invalid cache data", async () => {
		localStorage.setItem(POKEAPI_CACHE_KEY, "{ invalid json");

		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async (): Promise<unknown> => ({ cries: validCries }),
		} as Response);

		await expect(getCachedCryUrl(25)).resolves.toEqual(validCries);
	});

	it("throws when fetch fails", async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: false,
		} as Response);

		await expect(getCachedCryUrl(25)).rejects.toThrow(
			"Failed to fetch Pokemon cry",
		);
	});

	it("throws when response has invalid cries", async () => {
		vi.mocked(fetch).mockResolvedValue({
			ok: true,
			json: async (): Promise<unknown> => ({ cries: { latest: 1 } }),
		} as Response);

		await expect(getCachedCryUrl(25)).rejects.toThrow(
			"Invalid Pokemon cry response",
		);
	});

	it("wraps non-error throws", async () => {
		vi.mocked(fetch).mockRejectedValue("network down");

		await expect(getCachedCryUrl(25)).rejects.toThrow(
			"Error fetching cry URL",
		);
	});
});

describe("playCryAudio", () => {
	class MockCryAudio {
		public addEventListener = vi.fn();
		public play = vi.fn().mockResolvedValue(undefined);
	}

	beforeEach(() => {
		vi.spyOn(console, "log").mockImplementation(() => undefined);
		vi.spyOn(console, "error").mockImplementation(() => undefined);
		vi.stubGlobal("Audio", MockCryAudio);
	});

	afterEach(() => {
		vi.unstubAllGlobals();
		vi.restoreAllMocks();
	});

	it("logs audio error details from error event handler", async () => {
		const listeners: Record<string, Array<(event: Event) => void>> = {};
		const audioElement = document.createElement("audio");
		audioElement.src = "https://example.com/cry.mp3";
		Object.defineProperty(audioElement, "networkState", { value: 3 });
		Object.defineProperty(audioElement, "readyState", { value: 0 });
		Object.defineProperty(audioElement, "error", {
			value: { code: 4, message: "MEDIA_ERR_SRC_NOT_SUPPORTED" },
		});

		class ErrorMockCryAudio {
			public addEventListener = vi.fn(
				(event: string, handler: (event: Event) => void) => {
					if (!listeners[event]) {
						listeners[event] = [];
					}
					listeners[event].push(handler);
				},
			);

			public play = vi.fn().mockImplementation(async () => {
				const errorEvent = new Event("error");
				Object.defineProperty(errorEvent, "currentTarget", {
					value: audioElement,
				});
				for (const handler of listeners.error ?? []) {
					handler(errorEvent);
				}
			});
		}

		vi.stubGlobal("Audio", ErrorMockCryAudio);

		const result = await playCryAudio("https://example.com/cry.mp3");

		expect(result).toBe(false);
		expect(console.error).toHaveBeenCalledWith(
			"❌ Audio loading error:",
			expect.objectContaining({
				src: "https://example.com/cry.mp3",
				networkState: 3,
				readyState: 0,
				error: { code: 4, message: "MEDIA_ERR_SRC_NOT_SUPPORTED" },
			}),
		);
	});
});
