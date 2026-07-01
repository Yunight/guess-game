import { Timestamp } from "firebase/firestore";
import { describe, expect, it } from "vite-plus/test";
import {
	computeGuessTimeLeft,
	shouldScheduleAdvanceRound,
} from "@/hooks/multiplayerGameHandlerLogic";

const mockNow = new Date("2026-06-30T12:00:00Z").getTime();

describe("computeGuessTimeLeft", () => {
	it("returns full duration when roundStartedAt is in the future", () => {
		const roundStartedAt = Timestamp.fromMillis(mockNow + 32_000);
		expect(computeGuessTimeLeft(roundStartedAt, 15, mockNow)).toBe(15);
	});

	it("never exceeds roundDurationSeconds", () => {
		const roundStartedAt = Timestamp.fromMillis(mockNow - 5_000);
		expect(computeGuessTimeLeft(roundStartedAt, 15, mockNow)).toBe(10);
	});

	it("returns zero when the round has expired", () => {
		const roundStartedAt = Timestamp.fromMillis(mockNow - 20_000);
		expect(computeGuessTimeLeft(roundStartedAt, 15, mockNow)).toBe(0);
	});
});

describe("shouldScheduleAdvanceRound", () => {
	it("returns true when round is resolved and not yet advanced", () => {
		expect(shouldScheduleAdvanceRound(0, 1, true)).toBe(true);
		expect(shouldScheduleAdvanceRound(2, 3, true)).toBe(true);
	});

	it("returns false when round is not resolved", () => {
		expect(shouldScheduleAdvanceRound(0, 1, false)).toBe(false);
	});

	it("returns false when round was already advanced", () => {
		expect(shouldScheduleAdvanceRound(3, 3, true)).toBe(false);
		expect(shouldScheduleAdvanceRound(5, 3, true)).toBe(false);
	});
});
