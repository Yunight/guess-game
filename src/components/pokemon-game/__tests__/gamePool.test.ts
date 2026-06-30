import { describe, expect, it } from "vitest";
import {
	pickRandomFromPool,
	removePokemonFromPool,
	resolvePoolAfterCorrectAnswer,
} from "../gamePool";

describe("removePokemonFromPool", () => {
	it("removes the matching id", () => {
		expect(removePokemonFromPool([1, 2, 3], 2)).toEqual([1, 3]);
	});

	it("returns unchanged pool when id is absent", () => {
		expect(removePokemonFromPool([1, 2, 3], 99)).toEqual([1, 2, 3]);
	});
});

describe("pickRandomFromPool", () => {
	it("returns null for an empty pool", () => {
		expect(pickRandomFromPool([])).toBeNull();
	});

	it("picks from the pool using the random function", () => {
		expect(pickRandomFromPool([10, 20, 30], () => 0.5)).toBe(20);
	});
});

describe("resolvePoolAfterCorrectAnswer", () => {
	it("completes the game when only the current pokemon remains", () => {
		const result = resolvePoolAfterCorrectAnswer([], 42);

		expect(result).toEqual({ type: "game_complete" });
	});

	it("continues when pokemon remain in the pool", () => {
		const result = resolvePoolAfterCorrectAnswer([2, 3], 1, () => 0);

		expect(result).toEqual({
			type: "continue",
			nextPokemonId: 2,
			remainingPool: [3],
		});
	});

	it("does not end early when one pokemon is still queued", () => {
		const result = resolvePoolAfterCorrectAnswer([5], 4, () => 0);

		expect(result.type).toBe("continue");
		if (result.type === "continue") {
			expect(result.nextPokemonId).toBe(5);
			expect(result.remainingPool).toEqual([]);
		}
	});

	it("does not re-pick the answered pokemon from stale pool semantics", () => {
		const result = resolvePoolAfterCorrectAnswer([2, 3], 1, () => 0.99);

		expect(result.type).toBe("continue");
		if (result.type === "continue") {
			expect(result.nextPokemonId).toBe(3);
			expect(result.remainingPool).toEqual([2]);
		}
	});
});
