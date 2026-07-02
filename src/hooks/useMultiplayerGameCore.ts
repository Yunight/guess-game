import {
	useEffect,
	useRef,
	useState,
	type Dispatch,
	type RefObject,
	type SetStateAction,
} from "react";
import { useGameAudio } from "./useGameAudio";
import { readMutedPreference, writeMutedPreference } from "@/utils/gamePreferencesStorage";

export interface MultiplayerGameCoreState {
	guess: string;
	suggestions: string[];
	highlightedIndex: number;
	isCorrect: boolean | null;
	isMuted: boolean;
	guessTimeLeft: number;
	totalTimeElapsed: number;
	showCriticalSuccess: boolean;
	showCriticalHit: boolean;
	pointsEarned: number;
	isStartingGame: boolean;
	startGameError: string | null;
	roundWinnerName: string | null;
	optimisticScores: Record<string, number>;
	submitError: string | null;
}

export interface MultiplayerGameCoreSetters {
	setGuess: (value: string) => void;
	setSuggestions: (value: string[]) => void;
	setHighlightedIndex: Dispatch<SetStateAction<number>>;
	setIsCorrect: (value: boolean | null) => void;
	setIsMuted: (value: boolean) => void;
	setGuessTimeLeft: (value: number) => void;
	setTotalTimeElapsed: (value: number) => void;
	setShowCriticalSuccess: (value: boolean) => void;
	setShowCriticalHit: (value: boolean) => void;
	setPointsEarned: (value: number) => void;
	setIsStartingGame: (value: boolean) => void;
	setStartGameError: (value: string | null) => void;
	setRoundWinnerName: (value: string | null) => void;
	setOptimisticScores: Dispatch<SetStateAction<Record<string, number>>>;
	setSubmitError: (value: string | null) => void;
}

export interface MultiplayerGameCoreRefs {
	inputRef: RefObject<HTMLInputElement>;
	suggestionsRef: RefObject<HTMLDivElement>;
	advanceTimeoutRef: RefObject<ReturnType<typeof setTimeout> | null>;
	submitErrorTimeoutRef: RefObject<ReturnType<typeof setTimeout> | null>;
	lastProcessedRoundRef: RefObject<number>;
	advanceScheduledForRoundRef: RefObject<number>;
	gameStartTimeRef: RefObject<number | null>;
}

export interface UseMultiplayerGameCoreResult {
	state: MultiplayerGameCoreState;
	setters: MultiplayerGameCoreSetters;
	refs: MultiplayerGameCoreRefs;
	playCorrectSound: () => Promise<void>;
	playWrongSound: () => Promise<void>;
}

export const useMultiplayerGameCore = (): UseMultiplayerGameCoreResult => {
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const submitErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
	const lastProcessedRoundRef = useRef<number>(0);
	const advanceScheduledForRoundRef = useRef<number>(0);
	const gameStartTimeRef = useRef<number | null>(null);

	const [guess, setGuess] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [isMuted, setIsMuted] = useState(() => readMutedPreference());
	const [guessTimeLeft, setGuessTimeLeft] = useState(15);
	const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
	const [showCriticalSuccess, setShowCriticalSuccess] = useState(false);
	const [showCriticalHit, setShowCriticalHit] = useState(false);
	const [pointsEarned, setPointsEarned] = useState(0);
	const [isStartingGame, setIsStartingGame] = useState(false);
	const [startGameError, setStartGameError] = useState<string | null>(null);
	const [roundWinnerName, setRoundWinnerName] = useState<string | null>(null);
	const [optimisticScores, setOptimisticScores] = useState<Record<string, number>>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	const { playCorrectSound, playWrongSound } = useGameAudio(isMuted, false, true, guessTimeLeft);

	useEffect(() => {
		writeMutedPreference(isMuted);
	}, [isMuted]);

	return {
		state: {
			guess,
			suggestions,
			highlightedIndex,
			isCorrect,
			isMuted,
			guessTimeLeft,
			totalTimeElapsed,
			showCriticalSuccess,
			showCriticalHit,
			pointsEarned,
			isStartingGame,
			startGameError,
			roundWinnerName,
			optimisticScores,
			submitError,
		},
		setters: {
			setGuess,
			setSuggestions,
			setHighlightedIndex,
			setIsCorrect,
			setIsMuted,
			setGuessTimeLeft,
			setTotalTimeElapsed,
			setShowCriticalSuccess,
			setShowCriticalHit,
			setPointsEarned,
			setIsStartingGame,
			setStartGameError,
			setRoundWinnerName,
			setOptimisticScores,
			setSubmitError,
		},
		refs: {
			inputRef,
			suggestionsRef,
			advanceTimeoutRef,
			submitErrorTimeoutRef,
			lastProcessedRoundRef,
			advanceScheduledForRoundRef,
			gameStartTimeRef,
		},
		playCorrectSound,
		playWrongSound,
	};
};
