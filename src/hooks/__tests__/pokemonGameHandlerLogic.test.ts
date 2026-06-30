import { describe, expect, it } from "vitest";
import {
	buildStartGameState,
	isSuggestionCorrect,
	pickFirstPokemonFromPool,
	resolveCorrectAnswerHypeEffect,
	resolveCorrectAnswerScoring,
	resolveHighlightedIndex,
	resolveKeyDownAction,
	resolveSuggestionSubmission,
	shouldAwardHintOnCorrectAnswer,
	shouldSkipNameValidation,
	shouldUpdateStoredPlayerName,
} from "../pokemonGameHandlerLogic";

describe("isSuggestionCorrect", () => {
	const identity = (name: string): string => name.toLowerCase();

	it("matches normalized french and english names", () => {
		expect(
			isSuggestionCorrect("Pikachu", "pikachu", "Pikachu", "Pikachu", identity),
		).toBe(true);
	});

	it("rejects incorrect suggestions", () => {
		expect(
			isSuggestionCorrect("Raichu", "raichu", "Pikachu", "Pikachu", identity),
		).toBe(false);
	});
});

describe("resolveSuggestionSubmission", () => {
	const identity = (name: string): string => name.toLowerCase();

	it("skips when time is up", () => {
		expect(
			resolveSuggestionSubmission(0, false, "Pikachu", "Pikachu", "Pikachu", identity),
		).toEqual({ type: "skip", reason: "time_up" });
	});

	it("returns correct for matching names", () => {
		expect(
			resolveSuggestionSubmission(10, false, "Pikachu", "Pikachu", "Pikachu", identity),
		).toEqual({ type: "correct" });
	});

	it("returns wrong for mismatched names", () => {
		expect(
			resolveSuggestionSubmission(10, false, "Raichu", "Pikachu", "Pikachu", identity),
		).toEqual({ type: "wrong" });
	});
});

describe("resolveKeyDownAction", () => {
	it("uses hint on arrow right when hints remain", () => {
		expect(
			resolveKeyDownAction("ArrowRight", 1, true, [], -1, ""),
		).toEqual({ type: "use_hint" });
	});

	it("submits highlighted suggestion on enter", () => {
		expect(
			resolveKeyDownAction("Enter", 0, true, ["Pikachu", "Raichu"], 1, ""),
		).toEqual({ type: "submit", suggestion: "Raichu" });
	});

	it("navigates suggestions with arrow keys", () => {
		expect(
			resolveKeyDownAction("ArrowDown", 0, true, ["A", "B"], 0, ""),
		).toEqual({ type: "navigate", direction: "down" });
	});
});

describe("resolveHighlightedIndex", () => {
	it("wraps around when navigating down", () => {
		expect(resolveHighlightedIndex("down", 1, 2)).toBe(0);
	});

	it("wraps around when navigating up", () => {
		expect(resolveHighlightedIndex("up", 0, 2)).toBe(1);
	});
});

describe("resolveCorrectAnswerHypeEffect", () => {
	it("increments fast answers in hard mode with enough time", () => {
		expect(
			resolveCorrectAnswerHypeEffect(true, 12, false, 2),
		).toEqual({
			type: "increment_fast_answers",
			newCount: 3,
			shouldShowHypeTrain: true,
		});
	});

	it("breaks hype train when time runs low", () => {
		expect(
			resolveCorrectAnswerHypeEffect(true, 8, true, 4),
		).toEqual({
			type: "break_hype_train",
			bonusScore: 4,
		});
	});
});

describe("shouldAwardHintOnCorrectAnswer", () => {
	it("awards a hint every fifth correct answer", () => {
		expect(shouldAwardHintOnCorrectAnswer(4)).toBe(true);
		expect(shouldAwardHintOnCorrectAnswer(3)).toBe(false);
	});
});

describe("resolveCorrectAnswerScoring", () => {
	it("returns scoring and pool results", () => {
		const result = resolveCorrectAnswerScoring({
			isHardMode: false,
			guessTimeLeft: 15,
			isShiny: false,
			showHypeTrain: false,
			remainingPokemon: [1, 2],
			answeredPokemonId: 1,
			random: () => 0,
		});

		expect(result.scoringResult.earnedPoints).toBe(1);
		expect(result.poolResult.type).toBe("continue");
	});
});

describe("shouldSkipNameValidation", () => {
	it("skips when authenticated", () => {
		expect(shouldSkipNameValidation(true, false, "Ash", null)).toBe(true);
	});

	it("skips when name matches stored name", () => {
		expect(shouldSkipNameValidation(false, false, "Ash", "Ash")).toBe(true);
	});

	it("requires validation for new names", () => {
		expect(shouldSkipNameValidation(false, false, "Ash", "Misty")).toBe(false);
	});
});

describe("shouldUpdateStoredPlayerName", () => {
	it("detects name changes", () => {
		expect(shouldUpdateStoredPlayerName("Ash", "Misty")).toBe(true);
		expect(shouldUpdateStoredPlayerName("Ash", "Ash")).toBe(false);
	});
});

describe("buildStartGameState", () => {
	it("builds hard mode values", () => {
		const state = buildStartGameState(true);
		expect(state.hintsLeft).toBe(0);
		expect(state.guessTimeLeft).toBe(15);
	});

	it("builds easy mode values", () => {
		const state = buildStartGameState(false);
		expect(state.hintsLeft).toBe(Number.POSITIVE_INFINITY);
	});
});

describe("pickFirstPokemonFromPool", () => {
	it("picks and removes a pokemon from the pool", () => {
		const result = pickFirstPokemonFromPool([1, 2, 3], () => 0);
		expect(result.firstPokemonId).toBe(1);
		expect(result.remainingPokemon).toEqual([2, 3]);
	});
});
