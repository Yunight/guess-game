import { describe, expect, it, beforeEach, afterEach } from "vite-plus/test";
import { readMutedPreference, writeMutedPreference } from "@/utils/gamePreferencesStorage";

describe("gamePreferencesStorage", () => {
	beforeEach(() => {
		localStorage.clear();
	});

	afterEach(() => {
		localStorage.clear();
	});

	it("reads false when no preference is stored", () => {
		expect(readMutedPreference()).toBe(false);
	});

	it("writes and reads versioned muted preference", () => {
		writeMutedPreference(true);
		expect(readMutedPreference()).toBe(true);
		expect(localStorage.getItem("pokemonGameMuted:v1")).toBe("true");
	});

	it("falls back to legacy json muted preference", () => {
		localStorage.setItem("pokemonGameMuted", JSON.stringify(true));
		expect(readMutedPreference()).toBe(true);
	});

	it("falls back to legacy string muted preference", () => {
		localStorage.setItem("pokemonGameMuted", "true");
		expect(readMutedPreference()).toBe(true);
	});
});
