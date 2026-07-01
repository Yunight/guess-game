import type { Generation } from "@/components/pokemon-game/generations";
import type { Pokemon } from "@/components/pokemon-game/types";
import { useState } from "react";

const MAX_HINTS = 10;

export interface GameProgressState {
	score: number;
	bestScore: number;
	bestTime: number;
	isGameActive: boolean;
	isHardMode: boolean;
	selectedGeneration: Generation;
	remainingPokemon: number[];
	gameOver: boolean;
	isRestarting: boolean;
}

export interface GameProgressSetters {
	setScore: React.Dispatch<React.SetStateAction<number>>;
	setBestScore: React.Dispatch<React.SetStateAction<number>>;
	setBestTime: React.Dispatch<React.SetStateAction<number>>;
	setIsGameActive: React.Dispatch<React.SetStateAction<boolean>>;
	setIsHardMode: React.Dispatch<React.SetStateAction<boolean>>;
	setSelectedGeneration: React.Dispatch<React.SetStateAction<Generation>>;
	setRemainingPokemon: React.Dispatch<React.SetStateAction<number[]>>;
	setGameOver: React.Dispatch<React.SetStateAction<boolean>>;
	setIsRestarting: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useGameProgressState = (
	initialGeneration: Generation,
): { state: GameProgressState; setters: GameProgressSetters } => {
	const [score, setScore] = useState(0);
	const [bestScore, setBestScore] = useState(0);
	const [bestTime, setBestTime] = useState(0);
	const [isGameActive, setIsGameActive] = useState(false);
	const [isHardMode, setIsHardMode] = useState(false);
	const [selectedGeneration, setSelectedGeneration] = useState<Generation>(initialGeneration);
	const [remainingPokemon, setRemainingPokemon] = useState<number[]>([]);
	const [gameOver, setGameOver] = useState(false);
	const [isRestarting, setIsRestarting] = useState(false);

	return {
		state: {
			score,
			bestScore,
			bestTime,
			isGameActive,
			isHardMode,
			selectedGeneration,
			remainingPokemon,
			gameOver,
			isRestarting,
		},
		setters: {
			setScore,
			setBestScore,
			setBestTime,
			setIsGameActive,
			setIsHardMode,
			setSelectedGeneration,
			setRemainingPokemon,
			setGameOver,
			setIsRestarting,
		},
	};
};

export interface GameInputState {
	guess: string;
	isCorrect: boolean | null;
	showHint: boolean;
	hintsLeft: number;
	suggestions: string[];
	highlightedIndex: number;
}

export interface GameInputSetters {
	setGuess: React.Dispatch<React.SetStateAction<string>>;
	setIsCorrect: React.Dispatch<React.SetStateAction<boolean | null>>;
	setShowHint: React.Dispatch<React.SetStateAction<boolean>>;
	setHintsLeft: React.Dispatch<React.SetStateAction<number>>;
	setSuggestions: React.Dispatch<React.SetStateAction<string[]>>;
	setHighlightedIndex: React.Dispatch<React.SetStateAction<number>>;
}

export const useGameInputState = (): {
	state: GameInputState;
	setters: GameInputSetters;
} => {
	const [guess, setGuess] = useState("");
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [showHint, setShowHint] = useState(false);
	const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);

	return {
		state: {
			guess,
			isCorrect,
			showHint,
			hintsLeft,
			suggestions,
			highlightedIndex,
		},
		setters: {
			setGuess,
			setIsCorrect,
			setShowHint,
			setHintsLeft,
			setSuggestions,
			setHighlightedIndex,
		},
	};
};

export interface GameFeedbackState {
	showCriticalSuccess: boolean;
	showCriticalHit: boolean;
	showHypeTrain: boolean;
	consecutiveFastAnswers: number;
	pointsEarned: number;
	criticalHitCount: number;
	criticalSuccessCount: number;
	hyperTrainCount: number;
	maxHypeChain: number;
	userRanking: number | null;
}

export interface GameFeedbackSetters {
	setShowCriticalSuccess: React.Dispatch<React.SetStateAction<boolean>>;
	setShowCriticalHit: React.Dispatch<React.SetStateAction<boolean>>;
	setShowHypeTrain: React.Dispatch<React.SetStateAction<boolean>>;
	setConsecutiveFastAnswers: React.Dispatch<React.SetStateAction<number>>;
	setPointsEarned: React.Dispatch<React.SetStateAction<number>>;
	setCriticalHitCount: React.Dispatch<React.SetStateAction<number>>;
	setCriticalSuccessCount: React.Dispatch<React.SetStateAction<number>>;
	setHyperTrainCount: React.Dispatch<React.SetStateAction<number>>;
	setMaxHypeChain: React.Dispatch<React.SetStateAction<number>>;
	setUserRanking: React.Dispatch<React.SetStateAction<number | null>>;
}

export const useGameFeedbackState = (): {
	state: GameFeedbackState;
	setters: GameFeedbackSetters;
} => {
	const [showCriticalSuccess, setShowCriticalSuccess] = useState(false);
	const [showCriticalHit, setShowCriticalHit] = useState(false);
	const [showHypeTrain, setShowHypeTrain] = useState(false);
	const [consecutiveFastAnswers, setConsecutiveFastAnswers] = useState(0);
	const [pointsEarned, setPointsEarned] = useState(0);
	const [criticalHitCount, setCriticalHitCount] = useState(0);
	const [criticalSuccessCount, setCriticalSuccessCount] = useState(0);
	const [hyperTrainCount, setHyperTrainCount] = useState(0);
	const [maxHypeChain, setMaxHypeChain] = useState(0);
	const [userRanking, setUserRanking] = useState<number | null>(null);

	return {
		state: {
			showCriticalSuccess,
			showCriticalHit,
			showHypeTrain,
			consecutiveFastAnswers,
			pointsEarned,
			criticalHitCount,
			criticalSuccessCount,
			hyperTrainCount,
			maxHypeChain,
			userRanking,
		},
		setters: {
			setShowCriticalSuccess,
			setShowCriticalHit,
			setShowHypeTrain,
			setConsecutiveFastAnswers,
			setPointsEarned,
			setCriticalHitCount,
			setCriticalSuccessCount,
			setHyperTrainCount,
			setMaxHypeChain,
			setUserRanking,
		},
	};
};

export interface GameTimerState {
	guessTimeLeft: number;
	totalTimeElapsed: number;
}

export interface GameTimerSetters {
	setGuessTimeLeft: React.Dispatch<React.SetStateAction<number>>;
	setTotalTimeElapsed: React.Dispatch<React.SetStateAction<number>>;
}

export const useGameTimerState = (): {
	state: GameTimerState;
	setters: GameTimerSetters;
} => {
	const [guessTimeLeft, setGuessTimeLeft] = useState<number>(Number.POSITIVE_INFINITY);
	const [totalTimeElapsed, setTotalTimeElapsed] = useState<number>(0);

	return {
		state: { guessTimeLeft, totalTimeElapsed },
		setters: { setGuessTimeLeft, setTotalTimeElapsed },
	};
};

export interface GamePlayerState {
	playerName: string;
	nameError: string | null;
	isCheckingName: boolean;
	isAuthName: boolean;
}

export interface GamePlayerSetters {
	setPlayerName: React.Dispatch<React.SetStateAction<string>>;
	setNameError: React.Dispatch<React.SetStateAction<string | null>>;
	setIsCheckingName: React.Dispatch<React.SetStateAction<boolean>>;
	setIsAuthName: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useGamePlayerState = (): {
	state: GamePlayerState;
	setters: GamePlayerSetters;
} => {
	const [playerName, setPlayerName] = useState("");
	const [nameError, setNameError] = useState<string | null>(null);
	const [isCheckingName, setIsCheckingName] = useState(false);
	const [isAuthName, setIsAuthName] = useState(false);

	return {
		state: { playerName, nameError, isCheckingName, isAuthName },
		setters: { setPlayerName, setNameError, setIsCheckingName, setIsAuthName },
	};
};

export interface RewardPokemonState {
	pokemon: Pokemon | undefined;
	isLoading: boolean;
}

export interface GamePokemonState {
	currentPokemonId: number | null;
	currentPokemon: Pokemon | undefined;
	rewardPokemon: RewardPokemonState;
}

export interface GamePokemonSetters {
	setCurrentPokemonId: React.Dispatch<React.SetStateAction<number | null>>;
	setCurrentPokemon: React.Dispatch<React.SetStateAction<Pokemon | undefined>>;
	setRewardPokemon: React.Dispatch<React.SetStateAction<RewardPokemonState>>;
}

export const useGamePokemonState = (): {
	state: GamePokemonState;
	setters: GamePokemonSetters;
} => {
	const [currentPokemonId, setCurrentPokemonId] = useState<number | null>(null);
	const [currentPokemon, setCurrentPokemon] = useState<Pokemon | undefined>(undefined);
	const [rewardPokemon, setRewardPokemon] = useState<RewardPokemonState>({
		pokemon: undefined,
		isLoading: true,
	});

	return {
		state: { currentPokemonId, currentPokemon, rewardPokemon },
		setters: { setCurrentPokemonId, setCurrentPokemon, setRewardPokemon },
	};
};

export interface GameSettingsState {
	isMuted: boolean;
}

export interface GameSettingsSetters {
	setIsMuted: React.Dispatch<React.SetStateAction<boolean>>;
}

export const useGameSettingsState = (): {
	state: GameSettingsState;
	setters: GameSettingsSetters;
} => {
	const [isMuted, setIsMuted] = useState(() => {
		const savedMute = localStorage.getItem("pokemonGameMuted");
		return savedMute ? JSON.parse(savedMute) : false;
	});

	return {
		state: { isMuted },
		setters: { setIsMuted },
	};
};
