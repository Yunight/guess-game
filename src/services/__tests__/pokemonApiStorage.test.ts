import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
	getFromStorage,
	isCachedCryUrl,
	isCachedData,
	isCachedFlavorText,
	setToStorage,
} from "../pokemonApiStorage";

describe("getFromStorage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	it("returns parsed JSON for valid stored value", () => {
		const value = { timestamp: 1, cryUrl: "https://cry" };
		localStorage.setItem("testKey", JSON.stringify(value));

		expect(getFromStorage("testKey")).toEqual(value);
	});

	it("returns null when key is missing", () => {
		expect(getFromStorage("missingKey")).toBeNull();
	});

	it("returns null and clears key on parse error", () => {
		localStorage.setItem("badKey", "not-valid-json{");

		expect(getFromStorage("badKey")).toBeNull();
		expect(localStorage.getItem("badKey")).toBeNull();
	});

	it("returns null when window is undefined", () => {
		const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
		Object.defineProperty(globalThis, "window", {
			value: undefined,
			configurable: true,
			writable: true,
		});

		try {
			expect(getFromStorage("testKey")).toBeNull();
		} finally {
			if (windowDescriptor) {
				Object.defineProperty(globalThis, "window", windowDescriptor);
			}
		}
	});
});

describe("setToStorage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("writes JSON value to localStorage", () => {
		const value = { timestamp: 1, french: "Fr", english: "En" };

		setToStorage("flavorKey", value);

		expect(JSON.parse(localStorage.getItem("flavorKey") ?? "")).toEqual(value);
	});

	it("handles quota error by clearing cache keys", () => {
		localStorage.setItem("tyradexCache", '{"old":true}');
		localStorage.setItem("flavorTextCache_1", '{"old":true}');
		localStorage.setItem("keepMe", "value");

		const originalSetItem = Storage.prototype.setItem;
		let firstAttempt = true;
		vi.spyOn(Storage.prototype, "setItem").mockImplementation(function (
			this: Storage,
			key: string,
			value: string,
		) {
			if (firstAttempt) {
				firstAttempt = false;
				throw new DOMException("Quota exceeded", "QuotaExceededError");
			}
			originalSetItem.call(this, key, value);
		});

		setToStorage("newKey", { data: "test" });

		expect(localStorage.getItem("tyradexCache")).toBeNull();
		expect(localStorage.getItem("flavorTextCache_1")).toBeNull();
		expect(localStorage.getItem("keepMe")).toBe("value");
		expect(JSON.parse(localStorage.getItem("newKey") ?? "")).toEqual({
			data: "test",
		});
	});

	it("does nothing when window is undefined", () => {
		const windowDescriptor = Object.getOwnPropertyDescriptor(globalThis, "window");
		Object.defineProperty(globalThis, "window", {
			value: undefined,
			configurable: true,
			writable: true,
		});

		try {
			setToStorage("testKey", { value: 1 });
			expect(localStorage.getItem("testKey")).toBeNull();
		} finally {
			if (windowDescriptor) {
				Object.defineProperty(globalThis, "window", windowDescriptor);
			}
		}
	});
});

describe("isCachedData", () => {
	it("returns true for valid cached data", () => {
		const value = {
			timestamp: Date.now(),
			tyradexData: [{ pokedex_id: 1, name: { fr: "a", en: "b" } }],
		};

		expect(isCachedData(value)).toBe(true);
		if (isCachedData(value)) {
			expect(value.tyradexData).toHaveLength(1);
		}
	});

	it("returns false for null", () => {
		expect(isCachedData(null)).toBe(false);
	});

	it("returns false when timestamp is not a number", () => {
		expect(isCachedData({ timestamp: "1", tyradexData: [] })).toBe(false);
	});

	it("returns false when tyradexData is not an array", () => {
		expect(isCachedData({ timestamp: 1, tyradexData: "bad" })).toBe(false);
	});
});

describe("isCachedFlavorText", () => {
	it("returns true for valid cached flavor text", () => {
		const value = {
			timestamp: Date.now(),
			french: "Français",
			english: "English",
		};

		expect(isCachedFlavorText(value)).toBe(true);
		if (isCachedFlavorText(value)) {
			expect(value.french).toBe("Français");
		}
	});

	it("returns false for null", () => {
		expect(isCachedFlavorText(null)).toBe(false);
	});

	it("returns false when french is not a string", () => {
		expect(
			isCachedFlavorText({ timestamp: 1, french: 1, english: "en" }),
		).toBe(false);
	});
});

describe("isCachedCryUrl", () => {
	it("returns true for valid cached cry url", () => {
		const value = {
			timestamp: Date.now(),
			cryUrl: "https://latest|https://legacy",
		};

		expect(isCachedCryUrl(value)).toBe(true);
		if (isCachedCryUrl(value)) {
			expect(value.cryUrl).toContain("https://");
		}
	});

	it("returns false for null", () => {
		expect(isCachedCryUrl(null)).toBe(false);
	});

	it("returns false when cryUrl is not a string", () => {
		expect(isCachedCryUrl({ timestamp: 1, cryUrl: 42 })).toBe(false);
	});
});
