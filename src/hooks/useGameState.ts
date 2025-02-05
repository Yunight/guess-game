import { useState } from "react";
import type { Generation, Pokemon } from "@/components/pokemon-game/types";

interface GameState {
	score: number;
	bestScore: number;
	bestTime: number;
	guess: string;
	isCorrect: boolean | null;
	showHint: boolean;
	hintsLeft: number;
	isGameActive: boolean;
	isHardMode: boolean;
	playerName: string;
	selectedGeneration: Generation;
	remainingPokemon: number[];
	gameOver: boolean;
	suggestions: string[];
	highlightedIndex: number;
	userRanking: number | null;
	showCriticalSuccess: boolean;
	showCriticalHit: boolean;
	showHypeTrain: boolean;
	consecutiveFastAnswers: number;
	pointsEarned: number;
	criticalHitCount: number;
	criticalSuccessCount: number;
	hyperTrainCount: number;
	maxHypeChain: number;
	guessTimeLeft: number;
	totalTimeElapsed: number;
	nameError: string | null;
	isCheckingName: boolean;
	currentPokemonId: number | null;
	currentPokemon: Pokemon | undefined;
	isMuted: boolean;
	isAuthName: boolean;
	isRestarting: boolean;
	rewardPokemon: {
		pokemon: Pokemon | undefined;
		isLoading: boolean;
	};
}

const MAX_HINTS = 10;

export const useGameState = (initialGeneration: Generation) => {
	const [score, setScore] = useState(0);
	const [bestScore, setBestScore] = useState(0);
	const [bestTime, setBestTime] = useState(0);
	const [guess, setGuess] = useState("");
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [showHint, setShowHint] = useState(false);
	const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
	const [isGameActive, setIsGameActive] = useState(false);
	const [isHardMode, setIsHardMode] = useState(false);
	const [playerName, setPlayerName] = useState("");
	const [selectedGeneration, setSelectedGeneration] =
		useState<Generation>(initialGeneration);
	const [remainingPokemon, setRemainingPokemon] = useState<number[]>([]);
	const [gameOver, setGameOver] = useState(false);
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [userRanking, setUserRanking] = useState<number | null>(null);
	const [showCriticalSuccess, setShowCriticalSuccess] = useState(false);
	const [showCriticalHit, setShowCriticalHit] = useState(false);
	const [showHypeTrain, setShowHypeTrain] = useState(false);
	const [consecutiveFastAnswers, setConsecutiveFastAnswers] = useState(0);
	const [pointsEarned, setPointsEarned] = useState(0);
	const [criticalHitCount, setCriticalHitCount] = useState(0);
	const [criticalSuccessCount, setCriticalSuccessCount] = useState(0);
	const [hyperTrainCount, setHyperTrainCount] = useState(0);
	const [maxHypeChain, setMaxHypeChain] = useState(0);
	const [guessTimeLeft, setGuessTimeLeft] = useState<number>(
		Number.POSITIVE_INFINITY,
	);
	const [totalTimeElapsed, setTotalTimeElapsed] = useState<number>(0);
	const [nameError, setNameError] = useState<string | null>(null);
	const [isCheckingName, setIsCheckingName] = useState(false);
	const [currentPokemonId, setCurrentPokemonId] = useState<number | null>(null);
	const [currentPokemon, setCurrentPokemon] = useState<Pokemon | undefined>(
		undefined,
	);
	const [isMuted, setIsMuted] = useState(() => {
		const savedMute = localStorage.getItem("pokemonGameMuted");
		return savedMute ? JSON.parse(savedMute) : false;
	});
	const [isAuthName, setIsAuthName] = useState(false);
	const [isRestarting, setIsRestarting] = useState(false);
	const [rewardPokemon, setRewardPokemon] = useState<{
		pokemon: Pokemon | undefined;
		isLoading: boolean;
	}>({
		pokemon: undefined,
		isLoading: true,
	});

	return {
		state: {
			score,
			bestScore,
			bestTime,
			guess,
			isCorrect,
			showHint,
			hintsLeft,
			isGameActive,
			isHardMode,
			playerName,
			selectedGeneration,
			remainingPokemon,
			gameOver,
			suggestions,
			highlightedIndex,
			userRanking,
			showCriticalSuccess,
			showCriticalHit,
			showHypeTrain,
			consecutiveFastAnswers,
			pointsEarned,
			criticalHitCount,
			criticalSuccessCount,
			hyperTrainCount,
			maxHypeChain,
			guessTimeLeft,
			totalTimeElapsed,
			nameError,
			isCheckingName,
			currentPokemonId,
			currentPokemon,
			isMuted,
			isAuthName,
			isRestarting,
			rewardPokemon,
		},
		setters: {
			setScore,
			setBestScore,
			setBestTime,
			setGuess,
			setIsCorrect,
			setShowHint,
			setHintsLeft,
			setIsGameActive,
			setIsHardMode,
			setPlayerName,
			setSelectedGeneration,
			setRemainingPokemon,
			setGameOver,
			setSuggestions,
			setHighlightedIndex,
			setUserRanking,
			setShowCriticalSuccess,
			setShowCriticalHit,
			setShowHypeTrain,
			setConsecutiveFastAnswers,
			setPointsEarned,
			setCriticalHitCount,
			setCriticalSuccessCount,
			setHyperTrainCount,
			setMaxHypeChain,
			setGuessTimeLeft,
			setTotalTimeElapsed,
			setNameError,
			setIsCheckingName,
			setCurrentPokemonId,
			setCurrentPokemon,
			setIsMuted,
			setIsAuthName,
			setIsRestarting,
			setRewardPokemon,
		},
	};
};
