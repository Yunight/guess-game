import type { RefObject } from "react";
import type { Pokemon } from "./types";

export interface GameScreenGuessProps {
	guessTimeLeft: number;
	hintsLeft: number;
	guess: string;
	handleGuessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	suggestions: string[];
	handleSuggestionClick: (suggestion: string) => void;
	highlightedIndex: number;
	showHint: boolean;
	useHint: () => void;
	inputRef: RefObject<HTMLInputElement>;
	suggestionsRef: RefObject<HTMLDivElement>;
	formatTime: (seconds: number) => string;
	isMuted: boolean;
}

export interface GameScreenPlayAreaProps extends GameScreenGuessProps {
	currentPokemon: Pokemon | undefined;
	isPokemonLoading: boolean;
	isCorrect: boolean | null;
	score: number;
	bestScore: number;
	bestTime: number;
	remainingCount: number;
	totalCount: number;
	showCriticalSuccess: boolean;
	showCriticalHit: boolean;
	showHypeTrain: boolean;
	consecutiveFastAnswers: number;
	criticalSuccessLabel: string;
	criticalHitLabel: string;
	hypeTrainLabel: string;
}
