import { useCallback, useRef, useState } from "react";
import { GENERATIONS } from "@/components/pokemon-game/generations";
import { useGameAudio } from "./useGameAudio";
import { useGameState } from "./useGameState";
import { useGameTimers } from "./useGameTimers";
import { usePlayerName } from "./usePlayerName";
import { useRankings } from "./useRankings";
import { useSlotMachine } from "./useSlotMachine";

export const usePokemonGameCore = () => {
	const inputRef = useRef<HTMLInputElement>(null);
	const suggestionsRef = useRef<HTMLDivElement>(null);
	const savedName = localStorage.getItem("pokemonGamePlayerName");
	const [rewardPokemonId, setRewardPokemonId] = useState<number | null>(null);
	const { state: gameState, setters: gameSetters } = useGameState(
		GENERATIONS[0],
	);

	const slotMachine = useSlotMachine(gameState.selectedGeneration);
	const player = usePlayerName({ GENERATIONS });
	const rankingsState = useRankings({
		selectedGeneration: gameState.selectedGeneration,
		playerName: player.playerName,
		isGameActive: gameState.isGameActive,
	});

	const audio = useGameAudio(
		gameState.isMuted,
		gameState.showHypeTrain,
		gameState.isHardMode,
		gameState.guessTimeLeft,
	);

	const handleWrongAnswer = useCallback((): void => {
		gameSetters.setIsCorrect(false);
		void audio.playWrongSound();
	}, [gameSetters, audio.playWrongSound]);

	const timers = useGameTimers(
		gameState.isGameActive,
		gameState.isHardMode,
		gameState.currentPokemon?.isShiny,
		{
			onGuessTimeEnd: handleWrongAnswer,
			onTotalTimeUpdate: (time) => {
				gameSetters.setTotalTimeElapsed(time);
			},
		},
	);

	return {
		inputRef,
		suggestionsRef,
		savedName,
		gameState,
		gameSetters,
		rewardPokemonId,
		setRewardPokemonId,
		slotMachine,
		player,
		rankingsState,
		audio,
		timers,
	};
};
