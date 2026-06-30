import { describe, expect, it } from "vitest";
import {
	calculateElapsedTime,
	getInitialGuessTime,
	resolveVisibilityChange,
	shouldStartGuessTimer,
	tickGuessTimer,
} from "../gameTimerLogic";

describe("calculateElapsedTime", () => {
	it("returns zero when the timer has not started", () => {
		expect(calculateElapsedTime(null, 0, 5000)).toBe(0);
	});

	it("subtracts paused time from elapsed time", () => {
		expect(calculateElapsedTime(1000, 2, 6000)).toBe(3);
	});
});

describe("resolveVisibilityChange", () => {
	it("records hidden state without updating total time", () => {
		expect(
			resolveVisibilityChange({
				isHidden: true,
				now: 5000,
				lastVisibilityChange: 1000,
				startTime: 1000,
				pausedTime: 0,
				isGameActive: true,
				hasTotalTimer: true,
			}),
		).toEqual({
			pausedTime: 0,
			lastVisibilityChange: 5000,
			shouldUpdateTotal: false,
			accurateElapsed: 0,
		});
	});

	it("adds pause duration when becoming visible", () => {
		const result = resolveVisibilityChange({
			isHidden: false,
			now: 10000,
			lastVisibilityChange: 4000,
			startTime: 1000,
			pausedTime: 1,
			isGameActive: true,
			hasTotalTimer: true,
		});

		expect(result.pausedTime).toBe(7);
		expect(result.shouldUpdateTotal).toBe(true);
		expect(result.accurateElapsed).toBe(2);
	});
});

describe("getInitialGuessTime", () => {
	it("uses shorter time for shiny pokemon", () => {
		expect(getInitialGuessTime(true)).toBe(10);
		expect(getInitialGuessTime(false)).toBe(15);
	});
});

describe("shouldStartGuessTimer", () => {
	it("only starts in active hard mode games", () => {
		expect(shouldStartGuessTimer(true, true)).toBe(true);
		expect(shouldStartGuessTimer(false, true)).toBe(false);
		expect(shouldStartGuessTimer(true, false)).toBe(false);
	});
});

describe("tickGuessTimer", () => {
	it("decrements time until expiration", () => {
		expect(tickGuessTimer(3)).toEqual({ timeLeft: 2, isExpired: false });
		expect(tickGuessTimer(1)).toEqual({ timeLeft: 0, isExpired: true });
	});
});
