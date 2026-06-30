import type { Generation } from "@/components/pokemon-game/generations";
import type { Pokemon } from "@/components/pokemon-game/types";
import {
	useGameFeedbackState,
	useGameInputState,
	useGamePlayerState,
	useGamePokemonState,
	useGameProgressState,
	useGameSettingsState,
	useGameTimerState,
} from "./useGameStateSlices";

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

export const useGameState = (
	initialGeneration: Generation,
): {
	state: GameState;
	setters: ReturnType<typeof useGameProgressState>["setters"] &
		ReturnType<typeof useGameInputState>["setters"] &
		ReturnType<typeof useGameFeedbackState>["setters"] &
		ReturnType<typeof useGameTimerState>["setters"] &
		ReturnType<typeof useGamePlayerState>["setters"] &
		ReturnType<typeof useGamePokemonState>["setters"] &
		ReturnType<typeof useGameSettingsState>["setters"];
} => {
	const progress = useGameProgressState(initialGeneration);
	const input = useGameInputState();
	const feedback = useGameFeedbackState();
	const timer = useGameTimerState();
	const player = useGamePlayerState();
	const pokemon = useGamePokemonState();
	const settings = useGameSettingsState();

	return {
		state: {
			...progress.state,
			...input.state,
			...feedback.state,
			...timer.state,
			...player.state,
			...pokemon.state,
			...settings.state,
		},
		setters: {
			...progress.setters,
			...input.setters,
			...feedback.setters,
			...timer.setters,
			...player.setters,
			...pokemon.setters,
			...settings.setters,
		},
	};
};
