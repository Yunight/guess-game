import { skipToken } from "@reduxjs/toolkit/query";
import { describe, expect, it } from "vite-plus/test";
import { GENERATIONS } from "@/components/pokemon-game/generations";
import {
	resolveCurrentPokemonQueryArg,
	resolvePokemonNamesQueryArg,
	resolveRewardPokemonQueryArg,
	resolveSpinningPokemonQueryArg,
	shouldSkipCurrentPokemonQuery,
	shouldSkipRewardPokemonQuery,
	shouldSkipSpinningPokemonQuery,
} from "../pokemonGameQueryLogic";

const baseGameState = {
	isGameActive: true,
	gameOver: false,
	currentPokemonId: 25,
	maxHypeChain: 3,
	selectedGeneration: GENERATIONS[0],
};

describe("resolvePokemonNamesQueryArg", () => {
	it("returns skipToken when game is inactive", () => {
		expect(resolvePokemonNamesQueryArg({ ...baseGameState, isGameActive: false })).toBe(skipToken);
	});

	it("returns generation range when game is active", () => {
		expect(resolvePokemonNamesQueryArg(baseGameState)).toEqual({
			startId: baseGameState.selectedGeneration.startId,
			endId: baseGameState.selectedGeneration.endId,
			maxHypeChain: 3,
		});
	});
});

describe("resolveCurrentPokemonQueryArg", () => {
	it("returns skipToken without current pokemon id", () => {
		expect(
			resolveCurrentPokemonQueryArg({
				...baseGameState,
				currentPokemonId: null,
			}),
		).toBe(skipToken);
	});

	it("returns pokemon query arg", () => {
		expect(resolveCurrentPokemonQueryArg(baseGameState)).toEqual({
			id: 25,
			maxHypeChain: 3,
		});
	});
});

describe("shouldSkipCurrentPokemonQuery", () => {
	it("skips without id or inactive game", () => {
		expect(shouldSkipCurrentPokemonQuery(null, true)).toBe(true);
		expect(shouldSkipCurrentPokemonQuery(25, false)).toBe(true);
	});

	it("does not skip when active with id", () => {
		expect(shouldSkipCurrentPokemonQuery(25, true)).toBe(false);
	});
});

describe("resolveRewardPokemonQueryArg", () => {
	it("returns skipToken without reward id", () => {
		expect(resolveRewardPokemonQueryArg(null, 3)).toBe(skipToken);
	});

	it("returns reward query arg", () => {
		expect(resolveRewardPokemonQueryArg(150, 3)).toEqual({
			id: 150,
			maxHypeChain: 3,
		});
	});
});

describe("shouldSkipRewardPokemonQuery", () => {
	it("skips without reward id or when game is not over", () => {
		expect(shouldSkipRewardPokemonQuery(null, true)).toBe(true);
		expect(shouldSkipRewardPokemonQuery(150, false)).toBe(true);
	});
});

describe("resolveSpinningPokemonQueryArg", () => {
	it("returns skipToken without spinning id", () => {
		expect(resolveSpinningPokemonQueryArg(null, 3)).toBe(skipToken);
	});
});

describe("shouldSkipSpinningPokemonQuery", () => {
	it("skips when slot machine is not running", () => {
		expect(shouldSkipSpinningPokemonQuery(7, false)).toBe(true);
	});
});
