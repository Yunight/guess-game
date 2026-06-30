import { describe, expect, it } from "vitest";
import { GENERATIONS } from "../generations";

describe("GENERATIONS", () => {
	it("contains nine generations in order", () => {
		expect(GENERATIONS).toHaveLength(9);
		expect(GENERATIONS[0]?.startId).toBe(1);
		expect(GENERATIONS[8]?.endId).toBe(1010);
	});

	it("uses contiguous id ranges without gaps", () => {
		for (let index = 1; index < GENERATIONS.length; index += 1) {
			const previous = GENERATIONS[index - 1];
			const current = GENERATIONS[index];
			expect(current.startId).toBe(previous.endId + 1);
		}
	});
});
