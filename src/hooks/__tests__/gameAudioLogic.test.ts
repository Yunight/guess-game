import { describe, expect, it } from "vitest";
import {
	shouldPlayLowLifeSound,
	shouldPlayTrainHorn,
	shouldStopLowLifeSound,
	shouldStopTrainHorn,
} from "../gameAudioLogic";

describe("shouldPlayTrainHorn", () => {
	it("plays during hype train when not muted", () => {
		expect(shouldPlayTrainHorn(true, false, false, 15)).toBe(true);
	});

	it("does not play in hard mode with low time remaining", () => {
		expect(shouldPlayTrainHorn(true, false, true, 8)).toBe(false);
	});
});

describe("shouldStopTrainHorn", () => {
	it("stops when hype train ends or time is low", () => {
		expect(shouldStopTrainHorn(false, 15)).toBe(true);
		expect(shouldStopTrainHorn(true, 8)).toBe(true);
		expect(shouldStopTrainHorn(true, 12)).toBe(false);
	});
});

describe("shouldPlayLowLifeSound", () => {
	it("plays only in hard mode with low remaining time", () => {
		expect(shouldPlayLowLifeSound(true, 4, false)).toBe(true);
		expect(shouldPlayLowLifeSound(true, 6, false)).toBe(false);
		expect(shouldPlayLowLifeSound(false, 4, false)).toBe(false);
	});
});

describe("shouldStopLowLifeSound", () => {
	it("stops outside the low-life window", () => {
		expect(shouldStopLowLifeSound(true, 6)).toBe(true);
		expect(shouldStopLowLifeSound(true, 0)).toBe(true);
		expect(shouldStopLowLifeSound(true, 4)).toBe(false);
	});
});
