import { describe, expect, it } from "vitest";
import {
	convertToDisplayFormat,
	convertToStoredFormat,
	formatDisplayName,
	getRankingsCollectionName,
	NAME_ALREADY_USED_ERROR,
	shouldAllowAuthenticatedDisplayName,
	validateNameAcrossGenerations,
} from "../playerNameUtils";

describe("convertToStoredFormat", () => {
	it("normalizes accents and spaces", () => {
		expect(convertToStoredFormat("  Évoli  ")).toBe("evoli");
		expect(convertToStoredFormat("Mr Mime")).toBe("mr_mime");
	});
});

describe("convertToDisplayFormat", () => {
	it("replaces underscores with spaces", () => {
		expect(convertToDisplayFormat("mr_mime")).toBe("mr mime");
	});
});

describe("formatDisplayName", () => {
	it("formats gmail names with last initial", () => {
		expect(
			formatDisplayName("Ash Ketchum", "ash@gmail.com"),
		).toBe("Ash .K");
	});

	it("returns the original name for non-gmail users", () => {
		expect(formatDisplayName("Ash Ketchum", "ash@example.com")).toBe(
			"Ash Ketchum",
		);
	});
});

describe("getRankingsCollectionName", () => {
	it("builds the collection name for a generation", () => {
		expect(
			getRankingsCollectionName({ name: "Gen 1", startId: 1, endId: 151 }),
		).toBe("rankings_gen1_151");
	});
});

describe("shouldAllowAuthenticatedDisplayName", () => {
	it("allows matching authenticated display names", () => {
		expect(shouldAllowAuthenticatedDisplayName("Ash", "Ash")).toBe(true);
		expect(shouldAllowAuthenticatedDisplayName("Ash", "Misty")).toBe(false);
	});
});

describe("validateNameAcrossGenerations", () => {
	it("allows authenticated users", () => {
		expect(validateNameAcrossGenerations([true], true)).toEqual({
			available: true,
			errorMessage: null,
		});
	});

	it("rejects taken names for guests", () => {
		expect(validateNameAcrossGenerations([false, true], false)).toEqual({
			available: false,
			errorMessage: NAME_ALREADY_USED_ERROR,
		});
	});

	it("accepts available guest names", () => {
		expect(validateNameAcrossGenerations([false, false], false)).toEqual({
			available: true,
			errorMessage: null,
		});
	});
});
