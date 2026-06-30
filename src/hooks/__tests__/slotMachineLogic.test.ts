import { describe, expect, it } from "vitest";
import {
	calculateSpinInterval,
	pickSpinDisplayId,
	shouldContinueSpinning,
	SLOT_MACHINE_MIN_SPINS,
} from "../slotMachineLogic";

describe("shouldContinueSpinning", () => {
	it("continues until minimum spins are reached", () => {
		expect(shouldContinueSpinning(50)).toBe(true);
		expect(shouldContinueSpinning(SLOT_MACHINE_MIN_SPINS)).toBe(false);
	});
});

describe("calculateSpinInterval", () => {
	it("slows down as spins progress", () => {
		const early = calculateSpinInterval(0);
		const late = calculateSpinInterval(90);
		expect(late).toBeGreaterThan(early);
	});
});

describe("pickSpinDisplayId", () => {
	it("returns the only reward when one exists", () => {
		expect(pickSpinDisplayId([25], null, 25, () => 0)).toBe(25);
	});

	it("avoids repeating the last displayed id when possible", () => {
		const rewards = [1, 2, 3, 25];
		const picked = pickSpinDisplayId(rewards, 1, 25, () => 0.34);
		expect(picked).toBe(2);
	});
});
