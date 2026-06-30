import { describe, expect, it, vi } from "vitest";
import {
	fetchGenerationOccupancy,
	resolveAuthStatePlayerName,
	resolveNameAvailabilityCheck,
	applyNameAvailabilityCheckResult,
} from "../playerNameUtils";

describe("resolveNameAvailabilityCheck", () => {
	it("clears storage for empty names", () => {
		expect(
			resolveNameAvailabilityCheck("", " ", null, [], false),
		).toEqual({
			available: false,
			errorMessage: null,
			shouldClearStorage: true,
		});
	});

	it("allows authenticated display names", () => {
		expect(
			resolveNameAvailabilityCheck("ash", "Ash", "Ash", [], false),
		).toEqual({
			available: true,
			errorMessage: null,
			shouldClearStorage: false,
		});
	});
});

describe("resolveAuthStatePlayerName", () => {
	it("formats authenticated user names", () => {
		expect(
			resolveAuthStatePlayerName(
				{ displayName: "Ash Ketchum", email: "ash@example.com" },
				null,
			),
		).toEqual({
			playerName: "Ash Ketchum",
			isAuthName: true,
			shouldPersist: true,
		});
	});

	it("restores saved guest names", () => {
		expect(resolveAuthStatePlayerName(null, "Misty")).toEqual({
			playerName: "Misty",
			isAuthName: false,
			shouldPersist: false,
		});
	});
});

describe("fetchGenerationOccupancy", () => {
	it("marks generations occupied when docs exist", async () => {
		const getDocs = vi
			.fn()
			.mockResolvedValueOnce({ empty: true })
			.mockResolvedValueOnce({ empty: false });

		const result = await fetchGenerationOccupancy(
			[
				{ name: "Gen 1", startId: 1, endId: 151 },
				{ name: "Gen 2", startId: 152, endId: 251 },
			],
			"ash",
			undefined,
			{
				query: vi.fn(),
				where: vi.fn(),
				getDocs,
				getCollection: vi.fn(),
			},
		);

		expect(result).toEqual([false, true]);
	});
});

describe("applyNameAvailabilityCheckResult", () => {
	it("applies unavailable result and clears storage when needed", () => {
		const setNameError = vi.fn();
		const setIsCheckingName = vi.fn();
		localStorage.setItem("pokemonGamePlayerName", "Ash");

		const available = applyNameAvailabilityCheckResult(
			{
				available: false,
				errorMessage: "nameTaken",
				shouldClearStorage: true,
			},
			{ setNameError, setIsCheckingName },
		);

		expect(available).toBe(false);
		expect(setNameError).toHaveBeenCalledWith("nameTaken");
		expect(localStorage.getItem("pokemonGamePlayerName")).toBeNull();
		expect(setIsCheckingName).toHaveBeenCalledWith(false);
	});

	it("applies available result", () => {
		const setNameError = vi.fn();
		const setIsCheckingName = vi.fn();

		const available = applyNameAvailabilityCheckResult(
			{ available: true, errorMessage: null, shouldClearStorage: false },
			{ setNameError, setIsCheckingName },
		);

		expect(available).toBe(true);
		expect(setNameError).toHaveBeenCalledWith(null);
		expect(setIsCheckingName).toHaveBeenCalledWith(false);
	});
});
