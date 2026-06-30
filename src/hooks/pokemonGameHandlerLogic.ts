import {
	resolvePoolAfterCorrectAnswer,
	type CorrectAnswerPoolResult,
} from "@/components/pokemon-game/gamePool";
import {
	calculateEarnedPoints,
	type ScoringResult,
} from "@/components/pokemon-game/gameScoring";

export const isSuggestionCorrect = (
	suggestion: string,
	normalizedSuggestion: string,
	pokemonNameFr: string,
	pokemonNameEn: string,
	convertToStoredFormat: (name: string) => string,
): boolean => {
	const normalizedAnswerFr = convertToStoredFormat(pokemonNameFr);
	const normalizedAnswerEn = convertToStoredFormat(pokemonNameEn);

	return (
		normalizedSuggestion === normalizedAnswerFr ||
		normalizedSuggestion === normalizedAnswerEn ||
		suggestion.toLowerCase() === pokemonNameFr.toLowerCase() ||
		suggestion.toLowerCase() === pokemonNameEn.toLowerCase()
	);
};

export type SuggestionSubmissionResult =
	| { type: "skip"; reason: "time_up" | "loading" | "missing_names" }
	| { type: "correct" }
	| { type: "wrong" };

export const resolveSuggestionSubmission = (
	guessTimeLeft: number,
	isPokemonLoading: boolean,
	suggestion: string,
	pokemonNameFr: string | undefined,
	pokemonNameEn: string | undefined,
	convertToStoredFormat: (name: string) => string,
): SuggestionSubmissionResult => {
	if (guessTimeLeft <= 0 || isPokemonLoading) {
		return { type: "skip", reason: guessTimeLeft <= 0 ? "time_up" : "loading" };
	}

	if (!pokemonNameFr || !pokemonNameEn) {
		return { type: "skip", reason: "missing_names" };
	}

	const normalizedSuggestion = convertToStoredFormat(suggestion);

	if (
		isSuggestionCorrect(
			suggestion,
			normalizedSuggestion,
			pokemonNameFr,
			pokemonNameEn,
			convertToStoredFormat,
		)
	) {
		return { type: "correct" };
	}

	return { type: "wrong" };
};

export type KeyDownAction =
	| { type: "use_hint" }
	| { type: "submit"; suggestion: string }
	| { type: "navigate"; direction: "up" | "down" }
	| { type: "none" };

const resolveEnterKeyAction = (
	suggestions: readonly string[],
	highlightedIndex: number,
	guess: string,
): KeyDownAction => {
	if (suggestions.length > 0 && highlightedIndex >= 0) {
		const suggestion = suggestions[highlightedIndex];
		if (suggestion) {
			return { type: "submit", suggestion };
		}
	}
	if (guess.trim()) {
		return { type: "submit", suggestion: guess };
	}
	return { type: "none" };
};

const resolveArrowNavigationAction = (key: string): KeyDownAction => {
	if (key === "ArrowDown") {
		return { type: "navigate", direction: "down" };
	}
	if (key === "ArrowUp") {
		return { type: "navigate", direction: "up" };
	}
	return { type: "none" };
};

export const resolveKeyDownAction = (
	key: string,
	hintsLeft: number,
	hasCurrentPokemon: boolean,
	suggestions: readonly string[],
	highlightedIndex: number,
	guess: string,
): KeyDownAction => {
	if (key === "ArrowRight") {
		if (hintsLeft > 0 && hasCurrentPokemon) {
			return { type: "use_hint" };
		}
		return { type: "none" };
	}

	if (key === "Enter") {
		return resolveEnterKeyAction(suggestions, highlightedIndex, guess);
	}

	if (suggestions.length === 0) {
		return { type: "none" };
	}

	return resolveArrowNavigationAction(key);
};

export const resolveHighlightedIndex = (
	direction: "up" | "down",
	currentIndex: number,
	suggestionsLength: number,
): number => {
	if (direction === "down") {
		return currentIndex < suggestionsLength - 1 ? currentIndex + 1 : 0;
	}
	return currentIndex > 0 ? currentIndex - 1 : suggestionsLength - 1;
};

export type HypeEffectAction =
	| { type: "increment_fast_answers"; newCount: number; shouldShowHypeTrain: boolean }
	| { type: "break_hype_train"; bonusScore: number }
	| { type: "none" };

export const resolveCorrectAnswerHypeEffect = (
	isHardMode: boolean,
	guessTimeLeft: number,
	showHypeTrain: boolean,
	consecutiveFastAnswers: number,
): HypeEffectAction => {
	if (isHardMode && guessTimeLeft >= 10) {
		const newCount = consecutiveFastAnswers + 1;
		return {
			type: "increment_fast_answers",
			newCount,
			shouldShowHypeTrain: newCount >= 3,
		};
	}

	if (isHardMode && guessTimeLeft <= 9 && showHypeTrain) {
		return {
			type: "break_hype_train",
			bonusScore: consecutiveFastAnswers,
		};
	}

	return { type: "none" };
};

export const shouldAwardHintOnCorrectAnswer = (score: number): boolean =>
	(score + 1) % 5 === 0;

export interface CorrectAnswerScoringInput {
	isHardMode: boolean;
	guessTimeLeft: number;
	isShiny: boolean;
	showHypeTrain: boolean;
	remainingPokemon: readonly number[];
	answeredPokemonId: number;
	random?: () => number;
}

export interface CorrectAnswerScoringOutput {
	scoringResult: ScoringResult;
	poolResult: CorrectAnswerPoolResult;
}

export const resolveCorrectAnswerScoring = (
	input: CorrectAnswerScoringInput,
): CorrectAnswerScoringOutput => {
	const scoringResult = calculateEarnedPoints({
		isHardMode: input.isHardMode,
		guessTimeLeft: input.guessTimeLeft,
		isShiny: input.isShiny,
		showHypeTrain: input.showHypeTrain,
		random: input.random,
	});

	const poolResult = resolvePoolAfterCorrectAnswer(
		input.remainingPokemon,
		input.answeredPokemonId,
		input.random,
	);

	return { scoringResult, poolResult };
};

export const shouldSkipNameValidation = (
	hasAuthUser: boolean,
	isRestarting: boolean,
	exactName: string,
	storedName: string | null,
): boolean => hasAuthUser || isRestarting || exactName === storedName;

export const shouldUpdateStoredPlayerName = (
	exactName: string,
	storedName: string | null,
): boolean => storedName !== exactName;

export interface StartGameStateValues {
	isHardMode: boolean;
	score: number;
	hintsLeft: number;
	guessTimeLeft: number;
	totalTimeElapsed: number;
	gameOver: boolean;
	userRanking: null;
	highlightedIndex: number;
	consecutiveFastAnswers: number;
	showHypeTrain: boolean;
	pointsEarned: number;
	currentPokemonId: null;
	isCorrect: null;
	guess: string;
	suggestions: readonly [];
	showHint: boolean;
}

export const buildStartGameState = (isHardMode: boolean): StartGameStateValues => ({
	isHardMode,
	score: 0,
	hintsLeft: isHardMode ? 0 : Number.POSITIVE_INFINITY,
	guessTimeLeft: isHardMode ? 15 : Number.POSITIVE_INFINITY,
	totalTimeElapsed: 0,
	gameOver: false,
	userRanking: null,
	highlightedIndex: -1,
	consecutiveFastAnswers: 0,
	showHypeTrain: false,
	pointsEarned: 0,
	currentPokemonId: null,
	isCorrect: null,
	guess: "",
	suggestions: [],
	showHint: false,
});

export const pickFirstPokemonFromPool = (
	allPokemonIds: readonly number[],
	random: () => number = Math.random,
): { firstPokemonId: number | null; remainingPokemon: readonly number[] } => {
	if (allPokemonIds.length === 0) {
		return { firstPokemonId: null, remainingPokemon: [] };
	}

	const index = Math.floor(random() * allPokemonIds.length);
	const firstPokemonId = allPokemonIds[index] ?? null;

	if (firstPokemonId === null) {
		return { firstPokemonId: null, remainingPokemon: allPokemonIds };
	}

	return {
		firstPokemonId,
		remainingPokemon: allPokemonIds.filter((id) => id !== firstPokemonId),
	};
};
