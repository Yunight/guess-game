import { describe, expect, it, vi } from "vitest";
import {
	shouldPlayLowLifeSound,
	shouldPlayTrainHorn,
	shouldStopLowLifeSound,
	shouldStopTrainHorn,
	syncAmbientGameAudio,
} from "../gameAudioLogic";

describe("shouldPlayTrainHorn", () => {
	it("plays when hype train is active and not muted", () => {
		expect(shouldPlayTrainHorn(true, false, false, 15)).toBe(true);
	});

	it("does not play when muted", () => {
		expect(shouldPlayTrainHorn(true, true, false, 15)).toBe(false);
	});
});

describe("shouldStopTrainHorn", () => {
	it("stops when hype train ends", () => {
		expect(shouldStopTrainHorn(false, 15)).toBe(true);
	});
});

describe("shouldPlayLowLifeSound", () => {
	it("plays in hard mode with low time remaining", () => {
		expect(shouldPlayLowLifeSound(true, 3, false)).toBe(true);
	});
});

describe("shouldStopLowLifeSound", () => {
	it("stops when time is above threshold", () => {
		expect(shouldStopLowLifeSound(true, 10)).toBe(true);
	});
});

describe("syncAmbientGameAudio", () => {
	it("starts train horn when hype train is active", () => {
		const trainHorn = {
			paused: true,
			loop: false,
			currentTime: 5,
			play: vi.fn().mockResolvedValue(undefined),
			pause: vi.fn(),
		};
		const lowLife = {
			paused: true,
			loop: false,
			currentTime: 0,
			play: vi.fn().mockResolvedValue(undefined),
			pause: vi.fn(),
		};

		syncAmbientGameAudio(true, false, false, 15, {
			trainHorn: trainHorn as never,
			lowLife: lowLife as never,
		});

		expect(trainHorn.loop).toBe(true);
		expect(trainHorn.play).toHaveBeenCalled();
	});

	it("stops low life sound when timer is above threshold", () => {
		const trainHorn = {
			paused: true,
			loop: false,
			currentTime: 0,
			play: vi.fn().mockResolvedValue(undefined),
			pause: vi.fn(),
		};
		const lowLife = {
			paused: false,
			loop: true,
			currentTime: 3,
			play: vi.fn().mockResolvedValue(undefined),
			pause: vi.fn(),
		};

		syncAmbientGameAudio(false, false, true, 10, {
			trainHorn: trainHorn as never,
			lowLife: lowLife as never,
		});

		expect(lowLife.pause).toHaveBeenCalled();
		expect(lowLife.currentTime).toBe(0);
	});
});
