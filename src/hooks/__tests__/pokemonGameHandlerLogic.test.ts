import { describe, expect, it, vi } from "vite-plus/test";
import {
	applyHypeEffectToSetters,
	buildStartGameState,
	executeCorrectAnswerFlow,
	executeSuggestionSubmission,
	isSuggestionCorrect,
	pickFirstPokemonFromPool,
	resolveCorrectAnswerHypeEffect,
	resolveCorrectAnswerOutcome,
	resolveCorrectAnswerScoring,
	resolveGuessChangeHighlightedIndex,
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
		expect(isSuggestionCorrect("Pikachu", "pikachu", "Pikachu", "Pikachu", identity)).toBe(true);
	});

	it("rejects incorrect suggestions", () => {
		expect(isSuggestionCorrect("Raichu", "raichu", "Pikachu", "Pikachu", identity)).toBe(false);
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
		expect(resolveKeyDownAction("ArrowRight", 1, true, [], -1, "")).toEqual({ type: "use_hint" });
	});

	it("submits highlighted suggestion on enter", () => {
		expect(resolveKeyDownAction("Enter", 0, true, ["Pikachu", "Raichu"], 1, "")).toEqual({
			type: "submit",
			suggestion: "Raichu",
		});
	});

	it("navigates suggestions with arrow keys", () => {
		expect(resolveKeyDownAction("ArrowDown", 0, true, ["A", "B"], 0, "")).toEqual({
			type: "navigate",
			direction: "down",
		});
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

describe("resolveGuessChangeHighlightedIndex", () => {
	it("selects the first suggestion when input and suggestions exist", () => {
		expect(resolveGuessChangeHighlightedIndex(3, 5)).toBe(0);
	});

	it("clears selection when input is empty", () => {
		expect(resolveGuessChangeHighlightedIndex(0, 5)).toBe(-1);
	});

	it("clears selection when no suggestions match", () => {
		expect(resolveGuessChangeHighlightedIndex(3, 0)).toBe(-1);
	});
});

describe("resolveCorrectAnswerHypeEffect", () => {
	it("increments fast answers in hard mode with enough time", () => {
		expect(resolveCorrectAnswerHypeEffect(true, 12, false, 2)).toEqual({
			type: "increment_fast_answers",
			newCount: 3,
			shouldShowHypeTrain: true,
		});
	});

	it("breaks hype train when time runs low", () => {
		expect(resolveCorrectAnswerHypeEffect(true, 8, true, 4)).toEqual({
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

describe("resolveCorrectAnswerOutcome", () => {
	it("returns game complete when pool is exhausted", () => {
		expect(resolveCorrectAnswerOutcome({ type: "game_complete" })).toEqual({
			type: "game_complete",
		});
	});

	it("returns next pokemon when pool continues", () => {
		expect(
			resolveCorrectAnswerOutcome({
				type: "continue",
				nextPokemonId: 7,
				remainingPool: [2, 3],
			}),
		).toEqual({
			type: "next_pokemon",
			nextPokemonId: 7,
			remainingPool: [2, 3],
		});
	});
});

describe("applyHypeEffectToSetters", () => {
	it("applies increment fast answers effect", () => {
		const setConsecutiveFastAnswers = vi.fn();
		const setShowHypeTrain = vi.fn();
		const setMaxHypeChain = vi.fn();
		const setScore = vi.fn();

		applyHypeEffectToSetters(
			{
				type: "increment_fast_answers",
				newCount: 3,
				shouldShowHypeTrain: true,
			},
			{
				setConsecutiveFastAnswers,
				setShowHypeTrain,
				setMaxHypeChain,
				setScore,
			},
		);

		expect(setConsecutiveFastAnswers).toHaveBeenCalledWith(3);
		expect(setShowHypeTrain).toHaveBeenCalledWith(true);
	});
});

describe("executeSuggestionSubmission", () => {
	it("skips when submission is skipped", async () => {
		const setGuess = vi.fn();
		const handleCorrectAnswer = vi.fn();

		await executeSuggestionSubmission(
			{ type: "skip", reason: "time_up" },
			"Pikachu",
			{ setGuess, setSuggestions: vi.fn(), setIsCorrect: vi.fn() },
			{
				delay: vi.fn(),
				handleCorrectAnswer,
				playWrongSound: vi.fn(),
			},
		);

		expect(setGuess).not.toHaveBeenCalled();
		expect(handleCorrectAnswer).not.toHaveBeenCalled();
	});

	it("handles correct submissions", async () => {
		const handleCorrectAnswer = vi.fn().mockResolvedValue(undefined);

		await executeSuggestionSubmission(
			{ type: "correct" },
			"Pikachu",
			{
				setGuess: vi.fn(),
				setSuggestions: vi.fn(),
				setIsCorrect: vi.fn(),
			},
			{
				delay: vi.fn().mockResolvedValue(undefined),
				handleCorrectAnswer,
				playWrongSound: vi.fn(),
			},
		);

		expect(handleCorrectAnswer).toHaveBeenCalled();
	});

	it("handles wrong submissions", async () => {
		const playWrongSound = vi.fn().mockResolvedValue(undefined);
		const setIsCorrect = vi.fn();

		await executeSuggestionSubmission(
			{ type: "wrong" },
			"Raichu",
			{
				setGuess: vi.fn(),
				setSuggestions: vi.fn(),
				setIsCorrect,
			},
			{
				delay: vi.fn().mockResolvedValue(undefined),
				handleCorrectAnswer: vi.fn(),
				playWrongSound,
			},
		);

		expect(setIsCorrect).toHaveBeenCalledWith(false);
		expect(playWrongSound).toHaveBeenCalled();
	});
});

describe("executeCorrectAnswerFlow", () => {
	it("schedules game over when pool is exhausted", async () => {
		const scheduleGameOver = vi.fn();
		const setRemainingPokemon = vi.fn();

		await executeCorrectAnswerFlow(
			{
				isHardMode: false,
				guessTimeLeft: 30,
				showHypeTrain: false,
				score: 0,
				consecutiveFastAnswers: 0,
				remainingPokemon: [1],
				answeredPokemonId: 1,
				isShiny: false,
			},
			{
				setIsCorrect: vi.fn(),
				setHintsLeft: vi.fn(),
				setConsecutiveFastAnswers: vi.fn(),
				setShowHypeTrain: vi.fn(),
				setMaxHypeChain: vi.fn(),
				setScore: vi.fn(),
				setShowCriticalSuccess: vi.fn(),
				setCriticalSuccessCount: vi.fn(),
				setShowCriticalHit: vi.fn(),
				setCriticalHitCount: vi.fn(),
				setPointsEarned: vi.fn(),
				setRemainingPokemon,
				setCurrentPokemonId: vi.fn(),
				setGuess: vi.fn(),
				setSuggestions: vi.fn(),
				setShowHint: vi.fn(),
				setGuessTimeLeft: vi.fn(),
			},
			{
				clearGuessTimer: vi.fn(),
				playCorrectSound: vi.fn().mockResolvedValue(undefined),
				startGuessTimer: vi.fn(),
				focusInput: vi.fn(),
				delay: vi.fn().mockResolvedValue(undefined),
				scheduleGameOver,
			},
		);

		expect(setRemainingPokemon).toHaveBeenCalledWith([]);
		expect(scheduleGameOver).toHaveBeenCalled();
	});
});
