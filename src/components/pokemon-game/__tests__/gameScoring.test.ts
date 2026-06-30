import { describe, expect, it } from "vitest";
import { calculateEarnedPoints } from "../gameScoring";

describe("calculateEarnedPoints", () => {
	it("awards 1 point in easy mode", () => {
		expect(
			calculateEarnedPoints({
				isHardMode: false,
				guessTimeLeft: 10,
				isShiny: false,
				showHypeTrain: false,
			}),
		).toEqual({
			earnedPoints: 1,
			showCriticalSuccess: false,
			showCriticalHit: false,
		});
	});

	it("awards 5 points for shiny pokemon", () => {
		expect(
			calculateEarnedPoints({
				isHardMode: true,
				guessTimeLeft: 0,
				isShiny: true,
				showHypeTrain: false,
			}).earnedPoints,
		).toBe(5);
	});

	it("shows critical success at zero seconds in hard mode", () => {
		expect(
			calculateEarnedPoints({
				isHardMode: true,
				guessTimeLeft: 0,
				isShiny: false,
				showHypeTrain: false,
			}),
		).toEqual({
			earnedPoints: 1,
			showCriticalSuccess: true,
			showCriticalHit: false,
		});
	});

	it("adds a critical hit bonus when random succeeds", () => {
		expect(
			calculateEarnedPoints({
				isHardMode: true,
				guessTimeLeft: 12,
				isShiny: false,
				showHypeTrain: false,
				random: () => 0,
			}),
		).toEqual({
			earnedPoints: 4,
			showCriticalSuccess: false,
			showCriticalHit: true,
		});
	});

	it("awards points when guessTimeLeft exceeds default max after clamp", () => {
		expect(
			calculateEarnedPoints({
				isHardMode: true,
				guessTimeLeft: 47,
				isShiny: false,
				showHypeTrain: false,
				roundDurationSeconds: 15,
			}).earnedPoints,
		).toBe(3);
	});

	it("skips random critical hit in multiplayer mode", () => {
		expect(
			calculateEarnedPoints({
				isHardMode: true,
				guessTimeLeft: 12,
				isShiny: false,
				showHypeTrain: false,
				isMultiplayer: true,
				random: () => 0,
			}),
		).toEqual({
			earnedPoints: 3,
			showCriticalSuccess: false,
			showCriticalHit: false,
		});
	});
});
