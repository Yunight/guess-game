import { buildGuessSuggestions } from "@/components/pokemon-game/guessSuggestions";
import { calculateEarnedPoints } from "@/components/pokemon-game/gameScoring";
import { resolveSuggestionSubmission } from "@/hooks/pokemonGameHandlerLogic";
import { convertToStoredFormat } from "@/hooks/playerNameUtils";
import {
	advanceRound,
	resolveTimeout,
	startGame,
	submitCorrectGuess,
	syncRoundDuration,
	transferHost,
} from "@/services/multiplayerRoomService";
import { resolveDisplayScore } from "@/services/multiplayerGameStateLogic";
import type { MultiplayerRoom } from "@/services/multiplayerRoomTypes";
import {
	useGetAllPokemonNamesQuery,
	useGetPokemonByIdQuery,
} from "@/services/pokemonApi";
import {
	useCallback,
	useEffect,
	useRef,
	useState,
	type KeyboardEvent,
	type RefObject,
} from "react";
import { useTranslation } from "react-i18next";
import { useNavigate } from "react-router-dom";
import {
	computeGuessTimeLeft,
} from "./multiplayerGameHandlerLogic";
import { useGameAudio } from "./useGameAudio";

const ROUND_TRANSITION_MS = 1000;

interface UseMultiplayerGameControllerParams {
	room: MultiplayerRoom;
	localPlayerId: string;
	isHost: boolean;
}

interface UseMultiplayerGameControllerResult {
	guess: string;
	suggestions: string[];
	highlightedIndex: number;
	isCorrect: boolean | null;
	guessTimeLeft: number;
	totalTimeElapsed: number;
	isMuted: boolean;
	setIsMuted: (muted: boolean) => void;
	localScore: number;
	opponentScore: number;
	hostScore: number;
	guestScore: number;
	hostName: string;
	guestName: string;
	hostPlayerId: string;
	localPlayerName: string;
	opponentName: string;
	roundNumber: number;
	submitError: string | null;
	roundWinnerName: string | null;
	roundPointsEarned: number;
	isPokemonLoading: boolean;
	currentPokemon: ReturnType<typeof useGetPokemonByIdQuery>["data"];
	remainingCount: number;
	totalCount: number;
	showCriticalSuccess: boolean;
	showCriticalHit: boolean;
	pointsEarned: number;
	inputRef: RefObject<HTMLInputElement>;
	suggestionsRef: RefObject<HTMLDivElement>;
	handleGuessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleKeyDown: (e: KeyboardEvent<HTMLInputElement>) => void;
	handleSuggestionClick: (suggestion: string) => void;
	handleQuit: () => void;
	handleStartGame: () => Promise<void>;
	isStartingGame: boolean;
	startGameError: string | null;
}

export const useMultiplayerGameController = ({
	room,
	localPlayerId,
	isHost,
}: UseMultiplayerGameControllerParams): UseMultiplayerGameControllerResult => {
	const { i18n } = useTranslation();
	const navigate = useNavigate();
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const submitErrorTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(
		null,
	);
	const lastProcessedRoundRef = useRef<number>(0);
	const gameStartTimeRef = useRef<number | null>(null);

	const [guess, setGuess] = useState("");
	const [suggestions, setSuggestions] = useState<string[]>([]);
	const [highlightedIndex, setHighlightedIndex] = useState(-1);
	const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
	const [isMuted, setIsMuted] = useState(
		() => localStorage.getItem("pokemonGameMuted") === "true",
	);
	const [guessTimeLeft, setGuessTimeLeft] = useState(15);
	const [totalTimeElapsed, setTotalTimeElapsed] = useState(0);
	const [showCriticalSuccess, setShowCriticalSuccess] = useState(false);
	const [showCriticalHit, setShowCriticalHit] = useState(false);
	const [pointsEarned, setPointsEarned] = useState(0);
	const [isStartingGame, setIsStartingGame] = useState(false);
	const [startGameError, setStartGameError] = useState<string | null>(null);
	const [roundWinnerName, setRoundWinnerName] = useState<string | null>(
		null,
	);
	const [optimisticScores, setOptimisticScores] = useState<
		Record<string, number>
	>({});
	const [submitError, setSubmitError] = useState<string | null>(null);

	const gameState = room.gameState;
	const currentPokemonId = gameState?.currentPokemonId ?? 0;

	const { data: apiPokemonNames = [] } = useGetAllPokemonNamesQuery(
		{
			startId: room.selectedGeneration.startId,
			endId: room.selectedGeneration.endId,
		},
		{
			refetchOnMountOrArgChange: false,
			refetchOnFocus: false,
			refetchOnReconnect: false,
		},
	);

	const { data: currentPokemon, isFetching: isPokemonLoading } =
		useGetPokemonByIdQuery(
			{ id: currentPokemonId },
			{
				skip: !currentPokemonId || room.status !== "playing",
			},
		);

	const isShiny = currentPokemon?.isShiny ?? false;

	const localPlayerName =
		room.hostPlayer.id === localPlayerId
			? room.hostPlayer.name
			: (room.guestPlayer?.name ?? "");
	const opponentName =
		room.hostPlayer.id === localPlayerId
			? (room.guestPlayer?.name ?? "")
			: room.hostPlayer.name;
	const opponentPlayerId =
		room.hostPlayer.id === localPlayerId
			? room.guestPlayer?.id
			: room.hostPlayer.id;

	const hostName = room.hostPlayer.name;
	const guestName = room.guestPlayer?.name ?? "";
	const hostPlayerId = room.hostPlayer.id;
	const guestPlayerId = room.guestPlayer?.id;

	const resolveScore = (playerId: string | undefined): number => {
		if (!playerId) {
			return 0;
		}
		const firestoreScore = gameState?.scores[playerId] ?? 0;
		return resolveDisplayScore(firestoreScore, optimisticScores[playerId]);
	};

	const hostScore = resolveScore(hostPlayerId);
	const guestScore = resolveScore(guestPlayerId);
	const localScore = resolveScore(localPlayerId);
	const opponentScore = resolveScore(opponentPlayerId);

	const totalCount =
		room.selectedGeneration.endId - room.selectedGeneration.startId + 1;
	const remainingCount = gameState
		? gameState.remainingPokemon.length + 1
		: totalCount;

	useGameAudio(isMuted, false, true, guessTimeLeft);

	useEffect(() => {
		localStorage.setItem("pokemonGameMuted", String(isMuted));
	}, [isMuted]);

	useEffect(() => {
		if (room.status === "playing" && gameStartTimeRef.current === null) {
			gameStartTimeRef.current = Date.now();
		}
	}, [room.status]);

	useEffect(() => {
		if (room.status !== "playing") {
			return;
		}
		const interval = setInterval(() => {
			if (gameStartTimeRef.current !== null) {
				setTotalTimeElapsed(
					Math.floor((Date.now() - gameStartTimeRef.current) / 1000),
				);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [room.status]);

	useEffect(() => {
		if (!gameState || room.status !== "playing") {
			return;
		}
		const tick = (): void => {
			const timeLeft = computeGuessTimeLeft(
				gameState.roundStartedAt,
				gameState.roundDurationSeconds,
			);
			setGuessTimeLeft(timeLeft);
			if (
				isHost &&
				!gameState.roundResolved &&
				timeLeft <= 0
			) {
				void resolveTimeout(room.id, localPlayerId, isShiny);
			}
		};
		tick();
		const interval = setInterval(tick, 200);
		return () => clearInterval(interval);
	}, [
		gameState,
		room.status,
		room.id,
		isHost,
		localPlayerId,
		isShiny,
	]);

	const roundNumber = gameState?.roundNumber ?? 0;

	useEffect(() => {
		if (!gameState?.scores) {
			return;
		}
		setOptimisticScores((previous) => {
			const next: Record<string, number> = { ...previous };
			for (const [playerId, firestoreScore] of Object.entries(
				gameState.scores,
			)) {
				const optimisticScore = next[playerId];
				if (optimisticScore === undefined || firestoreScore >= optimisticScore) {
					delete next[playerId];
				}
			}
			return next;
		});
	}, [gameState?.scores]);

	useEffect(() => {
		if (room.status !== "playing") {
			return;
		}
		void roundNumber;
		setGuess("");
		setSuggestions([]);
		setHighlightedIndex(-1);
		setIsCorrect(null);
		setShowCriticalSuccess(false);
		setShowCriticalHit(false);
		setPointsEarned(0);
		setRoundWinnerName(null);
	}, [roundNumber, room.status]);

	const roundWinnerId = gameState?.roundWinnerId ?? null;

	useEffect(() => {
		if (!gameState || room.status !== "playing") {
			return;
		}
		if (!roundWinnerId) {
			setRoundWinnerName(null);
			return;
		}
		const winnerName =
			roundWinnerId === room.hostPlayer.id
				? room.hostPlayer.name
				: (room.guestPlayer?.name ?? "");
		setRoundWinnerName(winnerName);
	}, [
		gameState,
		roundWinnerId,
		room.status,
		room.hostPlayer,
		room.guestPlayer,
	]);

	useEffect(() => {
		if (!isHost || !gameState || room.status !== "playing" || !currentPokemon) {
			return;
		}
		if (gameState.currentPokemonId !== currentPokemon.id) {
			return;
		}
		void syncRoundDuration(
			room.id,
			localPlayerId,
			gameState.roundNumber,
			currentPokemon.isShiny,
		);
	}, [
		isHost,
		gameState,
		room.status,
		room.id,
		localPlayerId,
		currentPokemon,
	]);

	useEffect(() => {
		if (!isHost || !gameState || room.status !== "playing") {
			return;
		}
		if (!gameState.roundResolved) {
			return;
		}
		if (lastProcessedRoundRef.current >= gameState.roundNumber) {
			return;
		}
		lastProcessedRoundRef.current = gameState.roundNumber;

		if (advanceTimeoutRef.current) {
			clearTimeout(advanceTimeoutRef.current);
		}

		advanceTimeoutRef.current = setTimeout(() => {
			void advanceRound(room.id, localPlayerId, isShiny);
		}, ROUND_TRANSITION_MS);

		return () => {
			if (advanceTimeoutRef.current) {
				clearTimeout(advanceTimeoutRef.current);
			}
		};
	}, [
		isHost,
		gameState,
		room.status,
		room.id,
		localPlayerId,
		isShiny,
	]);

	useEffect(() => {
		if (room.status === "playing") {
			void roundNumber;
			inputRef.current?.focus();
		}
	}, [room.status, roundNumber]);

	const showSubmitError = useCallback((errorKey: string): void => {
		setSubmitError(errorKey);
		if (submitErrorTimeoutRef.current) {
			clearTimeout(submitErrorTimeoutRef.current);
		}
		submitErrorTimeoutRef.current = setTimeout(() => {
			setSubmitError(null);
		}, 2000);
	}, []);

	const submitGuess = useCallback(
		async (suggestion: string): Promise<void> => {
			if (!gameState || room.status !== "playing") {
				return;
			}

			const submission = resolveSuggestionSubmission(
				computeGuessTimeLeft(
					gameState.roundStartedAt,
					gameState.roundDurationSeconds,
				),
				isPokemonLoading,
				suggestion,
				currentPokemon?.frenchName,
				currentPokemon?.englishName,
				convertToStoredFormat,
			);

			if (submission.type === "skip") {
				return;
			}

			if (submission.type === "wrong") {
				setIsCorrect(false);
				setTimeout(() => setIsCorrect(null), 500);
				return;
			}

			const scoring = calculateEarnedPoints({
				isHardMode: true,
				guessTimeLeft: computeGuessTimeLeft(
					gameState.roundStartedAt,
					gameState.roundDurationSeconds,
				),
				isShiny,
				showHypeTrain: false,
			});

			try {
				const result = await submitCorrectGuess(
					room.id,
					localPlayerId,
					scoring.earnedPoints,
				);

				if (result.type === "won_round") {
					setOptimisticScores((previous) => ({
						...previous,
						...result.scores,
					}));
					setIsCorrect(true);
					setShowCriticalSuccess(scoring.showCriticalSuccess);
					setShowCriticalHit(scoring.showCriticalHit);
					setPointsEarned(scoring.earnedPoints);
					setTimeout(() => {
						setIsCorrect(null);
						setShowCriticalSuccess(false);
						setShowCriticalHit(false);
					}, ROUND_TRANSITION_MS);
					return;
				}

				if (result.type === "already_resolved") {
					showSubmitError("multiGuessTooLate");
				}
			} catch {
				showSubmitError("multiGuessFailed");
			}
		},
		[
			gameState,
			room.status,
			room.id,
			isPokemonLoading,
			currentPokemon,
			isShiny,
			localPlayerId,
			showSubmitError,
		],
	);

	const handleGuessChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>): void => {
			const value = e.target.value;
			setGuess(value);
			setSuggestions(
				buildGuessSuggestions({
					value,
					pokemonList: apiPokemonNames,
					startId: room.selectedGeneration.startId,
					endId: room.selectedGeneration.endId,
					language: i18n.language,
					normalizeName: convertToStoredFormat,
				}),
			);
			setHighlightedIndex(-1);
		},
		[apiPokemonNames, room.selectedGeneration, i18n.language],
	);

	const handleSuggestionClick = useCallback(
		(suggestion: string): void => {
			void submitGuess(suggestion);
		},
		[submitGuess],
	);

	const handleKeyDown = useCallback(
		(e: KeyboardEvent<HTMLInputElement>): void => {
			if (e.key === "Enter") {
				e.preventDefault();
				if (suggestions.length > 0 && highlightedIndex >= 0) {
					const suggestion = suggestions[highlightedIndex];
					if (suggestion) {
						void submitGuess(suggestion);
					}
					return;
				}
				if (guess.trim()) {
					void submitGuess(guess.trim());
				}
				return;
			}
			if (e.key === "ArrowDown") {
				e.preventDefault();
				setHighlightedIndex((prev) =>
					suggestions.length === 0
						? -1
						: Math.min(prev + 1, suggestions.length - 1),
				);
			}
			if (e.key === "ArrowUp") {
				e.preventDefault();
				setHighlightedIndex((prev) => Math.max(prev - 1, -1));
			}
		},
		[suggestions, highlightedIndex, guess, submitGuess],
	);

	const handleQuit = useCallback((): void => {
		if (isHost) {
			void transferHost(room.id, localPlayerId);
		}
		navigate("/");
	}, [isHost, room.id, localPlayerId, navigate]);

	const handleStartGame = useCallback(async (): Promise<void> => {
		if (!isHost) {
			return;
		}
		setIsStartingGame(true);
		setStartGameError(null);
		try {
			await startGame(room.id, localPlayerId, false);
		} catch (error: unknown) {
			if (error instanceof Error) {
				setStartGameError(error.message);
			} else {
				setStartGameError("multiplayerStartFailed");
			}
		} finally {
			setIsStartingGame(false);
		}
	}, [isHost, room.id, localPlayerId]);

	const roundPointsEarned = gameState?.roundPointsEarned ?? 0;

	return {
		guess,
		suggestions,
		highlightedIndex,
		isCorrect,
		guessTimeLeft,
		totalTimeElapsed,
		isMuted,
		setIsMuted,
		localScore,
		opponentScore,
		hostScore,
		guestScore,
		hostName,
		guestName,
		hostPlayerId,
		localPlayerName,
		opponentName,
		roundNumber,
		submitError,
		roundWinnerName,
		roundPointsEarned,
		isPokemonLoading,
		currentPokemon,
		remainingCount,
		totalCount,
		showCriticalSuccess,
		showCriticalHit,
		pointsEarned,
		inputRef,
		suggestionsRef,
		handleGuessChange,
		handleKeyDown,
		handleSuggestionClick,
		handleQuit,
		handleStartGame,
		isStartingGame,
		startGameError,
	};
};
