import { describe, expect, it } from "vitest";
import {
	buildGenerationPokemonIds,
	generateRewardCandidates,
	pickRandomPokemonId,
} from "../generationPool";

describe("buildGenerationPokemonIds", () => {
	it("builds a contiguous id range", () => {
		expect(buildGenerationPokemonIds(1, 3)).toEqual([1, 2, 3]);
	});
});

describe("pickRandomPokemonId", () => {
	it("returns null for an empty list", () => {
		expect(pickRandomPokemonId([])).toBeNull();
	});

	it("picks using the provided random function", () => {
		expect(pickRandomPokemonId([10, 20, 30], () => 0.5)).toBe(20);
	});
});

describe("generateRewardCandidates", () => {
	it("includes the final pokemon id and excludes duplicates", () => {
		let callIndex = 0;
		const randomValues = [0, 0.2, 0.4, 0.6, 0.8];
		const rewards = generateRewardCandidates(1, 5, 3, 3, () => {
			const value = randomValues[callIndex % randomValues.length] ?? 0;
			callIndex += 1;
			return value;
		});

		expect(rewards).toHaveLength(4);
		expect(rewards.at(-1)).toBe(3);
		expect(new Set(rewards).size).toBe(rewards.length);
	});
});
