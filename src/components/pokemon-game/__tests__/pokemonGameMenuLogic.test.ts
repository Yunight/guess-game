import { describe, expect, it } from "vitest";
import { resolveCanStartGame } from "../pokemonGameMenuLogic";

describe("resolveCanStartGame", () => {
	const baseInput = {
		playerName: "",
		nameError: null,
		isCheckingName: false,
		savedName: null,
		isAuthName: false,
	};

	it("allows valid new player names", () => {
		expect(
			resolveCanStartGame({
				...baseInput,
				playerName: "Ash",
			}),
		).toBe(true);
	});

	it("blocks when name is checking or has error", () => {
		expect(
			resolveCanStartGame({
				...baseInput,
				playerName: "Ash",
				isCheckingName: true,
			}),
		).toBe(false);

		expect(
			resolveCanStartGame({
				...baseInput,
				playerName: "Ash",
				nameError: "nameTaken",
			}),
		).toBe(false);
	});

	it("allows saved name match", () => {
		expect(
			resolveCanStartGame({
				...baseInput,
				playerName: "Ash",
				savedName: "Ash",
			}),
		).toBe(true);
	});

	it("allows authenticated names", () => {
		expect(
			resolveCanStartGame({
				...baseInput,
				playerName: "Ash",
				isAuthName: true,
			}),
		).toBe(true);
	});
});
