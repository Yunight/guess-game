import {
	resolvePoolAfterCorrectAnswer,
	type CorrectAnswerPoolResult,
} from "@/components/pokemon-game/gamePool";
import {
	calculateEarnedPoints,
	type ScoringResult,
} from "@/components/pokemon-game/gameScoring";
import type { Generation } from "@/components/pokemon-game/generations";
import { buildGenerationPokemonIds } from "@/components/pokemon-game/generationPool";

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

export interface HypeEffectSetters {
	setConsecutiveFastAnswers: (value: number | ((prev: number) => number)) => void;
	setShowHypeTrain: (value: boolean) => void;
	setMaxHypeChain: (value: number | ((prev: number) => number)) => void;
	setScore: (value: number | ((prev: number) => number)) => void;
}

export const applyHypeEffectToSetters = (
	effect: HypeEffectAction,
	setters: HypeEffectSetters,
): void => {
	if (effect.type === "increment_fast_answers") {
		setters.setConsecutiveFastAnswers(effect.newCount);
		if (effect.shouldShowHypeTrain) {
			setters.setShowHypeTrain(true);
			setters.setMaxHypeChain((prevMax) =>
				Math.max(prevMax, effect.newCount),
			);
		}
		return;
	}

	if (effect.type === "break_hype_train") {
		setters.setShowHypeTrain(false);
		setters.setScore((prev) => prev + effect.bonusScore);
		setters.setConsecutiveFastAnswers(0);
	}
};

export interface ScoringVisualSetters {
	setShowCriticalSuccess: (value: boolean) => void;
	setCriticalSuccessCount: (value: number | ((prev: number) => number)) => void;
	setShowCriticalHit: (value: boolean) => void;
	setCriticalHitCount: (value: number | ((prev: number) => number)) => void;
	setPointsEarned: (value: number) => void;
	setScore: (value: number | ((prev: number) => number)) => void;
}

const applyScoringVisualEffects = (
	scoringResult: ScoringResult,
	setters: ScoringVisualSetters,
): void => {
	if (scoringResult.showCriticalSuccess) {
		setters.setShowCriticalSuccess(true);
		setters.setCriticalSuccessCount((prev) => prev + 1);
		setTimeout(() => {
			setters.setShowCriticalSuccess(false);
		}, 2000);
	}

	if (scoringResult.showCriticalHit) {
		setters.setShowCriticalHit(true);
		setters.setCriticalHitCount((prev) => prev + 1);
		setTimeout(() => {
			setters.setShowCriticalHit(false);
		}, 2000);
	}

	setters.setPointsEarned(scoringResult.earnedPoints);
	setTimeout(() => {
		setters.setPointsEarned(0);
	}, 1000);

	setters.setScore((prev) => prev + scoringResult.earnedPoints);
};

export type CorrectAnswerOutcome =
	| { type: "game_complete" }
	| {
			type: "next_pokemon";
			nextPokemonId: number;
			remainingPool: readonly number[];
	  };

export const resolveCorrectAnswerOutcome = (
	poolResult: CorrectAnswerPoolResult,
): CorrectAnswerOutcome => {
	if (poolResult.type === "game_complete") {
		return { type: "game_complete" };
	}

	return {
		type: "next_pokemon",
		nextPokemonId: poolResult.nextPokemonId,
		remainingPool: poolResult.remainingPool,
	};
};

export interface StartGameGenerationSetters {
	setIsHardMode: (value: boolean) => void;
	setScore: (value: number) => void;
	setHintsLeft: (value: number) => void;
	setGuessTimeLeft: (value: number) => void;
	setTotalTimeElapsed: (value: number) => void;
	setGameOver: (value: boolean) => void;
	setUserRanking: (value: null) => void;
	setHighlightedIndex: (value: number) => void;
	setConsecutiveFastAnswers: (value: number) => void;
	setShowHypeTrain: (value: boolean) => void;
	setPointsEarned: (value: number) => void;
	setCurrentPokemonId: (value: number | null) => void;
	setIsCorrect: (value: boolean | null) => void;
	setGuess: (value: string) => void;
	setSuggestions: (value: string[]) => void;
	setShowHint: (value: boolean) => void;
	setRewardPokemon: (value: {
		pokemon: undefined;
		isLoading: boolean;
	}) => void;
	setRemainingPokemon: (value: number[]) => void;
	setIsGameActive: (value: boolean) => void;
	setIsRestarting: (value: boolean) => void;
}

export const applyStartGameStateToSetters = (
	isHardMode: boolean,
	selectedGeneration: Generation,
	setters: StartGameGenerationSetters,
): readonly number[] => {
	const startState = buildStartGameState(isHardMode);
	setters.setIsHardMode(startState.isHardMode);
	setters.setScore(startState.score);
	setters.setHintsLeft(startState.hintsLeft);
	setters.setGuessTimeLeft(startState.guessTimeLeft);
	setters.setTotalTimeElapsed(startState.totalTimeElapsed);
	setters.setGameOver(startState.gameOver);
	setters.setUserRanking(startState.userRanking);
	setters.setHighlightedIndex(startState.highlightedIndex);
	setters.setConsecutiveFastAnswers(startState.consecutiveFastAnswers);
	setters.setShowHypeTrain(startState.showHypeTrain);
	setters.setPointsEarned(startState.pointsEarned);
	setters.setCurrentPokemonId(startState.currentPokemonId);
	setters.setIsCorrect(startState.isCorrect);
	setters.setGuess(startState.guess);
	setters.setSuggestions([...startState.suggestions]);
	setters.setShowHint(startState.showHint);
	setters.setRewardPokemon({
		pokemon: undefined,
		isLoading: false,
	});
	return buildGenerationPokemonPool(selectedGeneration);
};

export interface StartGameSessionInput {
	isHardMode: boolean;
	selectedGeneration: Generation;
	playerName: string;
	isRestarting: boolean;
	hasAuthUser: boolean;
	storedName: string | null;
}

export interface StartGameSessionDeps {
	checkNameAvailability: (name: string) => Promise<boolean>;
	stopAllTimers: () => void;
	cleanupAllAudio: () => void;
	applyStartState: (
		isHardMode: boolean,
		generation: Generation,
	) => readonly number[];
	startTotalTimer: (setter: (value: number) => void) => void;
	startGuessTimer: (setter: (value: number) => void) => void;
	focusInput: () => void;
	delay: (ms: number) => Promise<void>;
}

export interface StartGameSessionSetters extends StartGameGenerationSetters {
	setRemainingPokemon: (value: number[]) => void;
}

export const validateStartGameSession = async (
	input: StartGameSessionInput,
	deps: Pick<StartGameSessionDeps, "checkNameAvailability">,
): Promise<boolean> => {
	if (!input.playerName) {
		return false;
	}

	const exactName = input.playerName.trim();
	const shouldSkipValidation = shouldSkipNameValidation(
		input.hasAuthUser,
		input.isRestarting,
		exactName,
		input.storedName,
	);

	if (!shouldSkipValidation) {
		return deps.checkNameAvailability(exactName);
	}

	return true;
};

export const executeStartGameSession = async (
	input: StartGameSessionInput,
	setters: StartGameSessionSetters,
	deps: StartGameSessionDeps,
): Promise<void> => {
	const exactName = input.playerName.trim();

	if (shouldUpdateStoredPlayerName(exactName, input.storedName)) {
		localStorage.clear();
		localStorage.setItem("pokemonGamePlayerName", exactName);
	}

	setters.setIsRestarting(true);

	try {
		deps.stopAllTimers();
		deps.cleanupAllAudio();

		const allPokemonIds = deps.applyStartState(
			input.isHardMode,
			input.selectedGeneration,
		);

		setters.setRemainingPokemon([...allPokemonIds]);
		await deps.delay(100);

		setters.setIsGameActive(true);
		deps.startTotalTimer(setters.setTotalTimeElapsed);
		if (input.isHardMode) {
			deps.startGuessTimer(setters.setGuessTimeLeft);
		}

		const { firstPokemonId, remainingPokemon } =
			pickFirstPokemonFromPool(allPokemonIds);

		if (firstPokemonId === null) {
			return;
		}

		setters.setRemainingPokemon([...remainingPokemon]);
		setters.setCurrentPokemonId(firstPokemonId);
		deps.focusInput();
	} finally {
		setters.setIsRestarting(false);
	}
};

const advanceToNextPokemonRound = async (
	outcome: Extract<CorrectAnswerOutcome, { type: "next_pokemon" }>,
	isHardMode: boolean,
	setters: {
		setRemainingPokemon: (value: number[]) => void;
		setCurrentPokemonId: (value: number | null) => void;
		setIsCorrect: (value: boolean | null) => void;
		setGuess: (value: string) => void;
		setSuggestions: (value: string[]) => void;
		setShowHint: (value: boolean) => void;
		setGuessTimeLeft: (value: number) => void;
	},
	startGuessTimer: (setter: (value: number) => void) => void,
	focusInput: () => void,
	delay: (ms: number) => Promise<void>,
): Promise<void> => {
	setters.setRemainingPokemon([...outcome.remainingPool]);
	await delay(1000);

	setters.setCurrentPokemonId(null);
	setters.setIsCorrect(null);
	setters.setGuess("");
	setters.setSuggestions([]);
	setters.setShowHint(false);

	await delay(50);
	await delay(300);

	setters.setCurrentPokemonId(outcome.nextPokemonId);

	if (isHardMode) {
		startGuessTimer(setters.setGuessTimeLeft);
	}

	focusInput();
};

export interface CorrectAnswerFlowInput {
	isHardMode: boolean;
	guessTimeLeft: number;
	showHypeTrain: boolean;
	score: number;
	consecutiveFastAnswers: number;
	remainingPokemon: readonly number[];
	answeredPokemonId: number;
	isShiny: boolean;
}

export interface CorrectAnswerFlowSetters
	extends HypeEffectSetters,
		ScoringVisualSetters {
	setIsCorrect: (value: boolean | null) => void;
	setRemainingPokemon: (value: number[]) => void;
	setHintsLeft: (value: number | ((prev: number) => number)) => void;
	setCurrentPokemonId: (value: number | null) => void;
	setGuess: (value: string) => void;
	setSuggestions: (value: string[]) => void;
	setShowHint: (value: boolean) => void;
	setGuessTimeLeft: (value: number) => void;
}

export interface CorrectAnswerFlowDeps {
	clearGuessTimer: () => void;
	playCorrectSound: () => Promise<void>;
	startGuessTimer: (setter: (value: number) => void) => void;
	focusInput: () => void;
	delay: (ms: number) => Promise<void>;
	scheduleGameOver: () => void;
}

export const executeCorrectAnswerFlow = async (
	input: CorrectAnswerFlowInput,
	setters: CorrectAnswerFlowSetters,
	deps: CorrectAnswerFlowDeps,
): Promise<void> => {
	if (input.isHardMode) {
		deps.clearGuessTimer();
	}

	setters.setIsCorrect(true);
	await deps.playCorrectSound();

	if (shouldAwardHintOnCorrectAnswer(input.score)) {
		setters.setHintsLeft((prev) => prev + 1);
	}

	const hypeEffect = resolveCorrectAnswerHypeEffect(
		input.isHardMode,
		input.guessTimeLeft,
		input.showHypeTrain,
		input.consecutiveFastAnswers,
	);

	applyHypeEffectToSetters(hypeEffect, setters);

	const { scoringResult, poolResult } = resolveCorrectAnswerScoring({
		isHardMode: input.isHardMode,
		guessTimeLeft: input.guessTimeLeft,
		isShiny: input.isShiny,
		showHypeTrain: input.showHypeTrain,
		remainingPokemon: input.remainingPokemon,
		answeredPokemonId: input.answeredPokemonId,
	});

	applyScoringVisualEffects(scoringResult, setters);

	const outcome = resolveCorrectAnswerOutcome(poolResult);

	if (outcome.type === "game_complete") {
		setters.setRemainingPokemon([]);
		deps.scheduleGameOver();
		return;
	}

	await advanceToNextPokemonRound(
		outcome,
		input.isHardMode,
		setters,
		deps.startGuessTimer,
		deps.focusInput,
		deps.delay,
	);
};

export interface SuggestionSubmissionSetters {
	setGuess: (value: string) => void;
	setSuggestions: (value: string[]) => void;
	setIsCorrect: (value: boolean | null) => void;
}

export interface SuggestionSubmissionDeps {
	delay: (ms: number) => Promise<void>;
	handleCorrectAnswer: () => Promise<void>;
	playWrongSound: () => Promise<void>;
}

export const executeSuggestionSubmission = async (
	submission: SuggestionSubmissionResult,
	suggestion: string,
	setters: SuggestionSubmissionSetters,
	deps: SuggestionSubmissionDeps,
): Promise<void> => {
	if (submission.type === "skip") {
		return;
	}

	setters.setGuess(suggestion);
	setters.setSuggestions([]);

	await deps.delay(50);

	if (submission.type === "correct") {
		await deps.handleCorrectAnswer();
		return;
	}

	setters.setIsCorrect(false);
	await deps.playWrongSound();
};

const buildGenerationPokemonPool = (
	selectedGeneration: Generation,
): readonly number[] =>
	buildGenerationPokemonIds(
		selectedGeneration.startId,
		selectedGeneration.endId,
	);
