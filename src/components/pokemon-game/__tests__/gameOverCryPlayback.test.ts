import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import {
	executeRewardCryPlayback,
	getRewardCryPokemonId,
	shouldScheduleRewardCry,
} from "../gameOverCryPlayback";
vi.mock("../gameOverCryCache", () => ({
	shouldSkipCryPlayback: vi.fn(
		(pokemonId: number, lastPlayedId: number | null, isMuted: boolean) =>
			isMuted || pokemonId === lastPlayedId,
	),
	getCachedCryUrl: vi.fn().mockResolvedValue([{ latest: "cry.mp3" }]),
	resolveCryAudioUrl: vi.fn().mockReturnValue("cry.mp3"),
	playCryAudio: vi.fn().mockResolvedValue(true),
}));

describe("executeRewardCryPlayback", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns pokemon id when muted without playing", async () => {
		const result = await executeRewardCryPlayback(25, null, true);
		expect(result).toBe(25);
	});

	it("returns pokemon id after successful playback", async () => {
		const result = await executeRewardCryPlayback(25, null, false);
		expect(result).toBe(25);
	});

	it("returns null when playback fails", async () => {
		const { playCryAudio } = await import("../gameOverCryCache");
		vi.mocked(playCryAudio).mockResolvedValueOnce(false);

		const result = await executeRewardCryPlayback(25, null, false);
		expect(result).toBeNull();
	});
});

describe("shouldScheduleRewardCry", () => {
	const baseInput = {
		gameOver: true,
		isMuted: false,
		isSlotMachineRunning: false,
		rewardPokemon: { pokemon: { id: 25 }, isLoading: false },
	};

	it("returns true when all conditions are met", () => {
		expect(shouldScheduleRewardCry(baseInput)).toBe(true);
	});

	it("returns false when slot machine is running", () => {
		expect(
			shouldScheduleRewardCry({ ...baseInput, isSlotMachineRunning: true }),
		).toBe(false);
	});

	it("returns false when muted or loading", () => {
		expect(shouldScheduleRewardCry({ ...baseInput, isMuted: true })).toBe(
			false,
		);
		expect(
			shouldScheduleRewardCry({
				...baseInput,
				rewardPokemon: { pokemon: { id: 25 }, isLoading: true },
			}),
		).toBe(false);
	});
});

describe("getRewardCryPokemonId", () => {
	it("returns pokemon id when defined", () => {
		expect(getRewardCryPokemonId({ id: 25 })).toBe(25);
	});

	it("returns null when pokemon is undefined", () => {
		expect(getRewardCryPokemonId(undefined)).toBeNull();
	});
});
