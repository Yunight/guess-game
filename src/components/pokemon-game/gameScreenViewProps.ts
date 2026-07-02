import type { RefObject } from "react";
import type { Pokemon } from "./types";
import type { GameScreenPlayAreaProps } from "./gameScreenTypes";

export interface GameScreenTopBarConfig {
	currentPokemon: Pokemon | undefined;
	totalTimeElapsed: number;
	formatTime: (seconds: number) => string;
	audioState: "muted" | "unmuted";
	setIsMuted: (value: boolean) => void;
	difficultyMode: "hard" | "normal";
	onQuit: () => void;
	pointsEarned: number;
}

export interface GameScreenPokemonSectionConfig {
	pokemonDisplayProps: {
		currentPokemon: Pokemon | undefined;
		loadingState: "loading" | "ready";
		answerState: "unknown" | "correct" | "incorrect";
		audioState: "muted" | "unmuted";
		guessTimeLeft: number;
		remainingCount: number;
		totalCount: number;
		progressCounterState?: "visible" | "hidden";
	};
	banner: {
		type: "none" | "critical_success" | "critical_hit" | "hype_train";
		criticalSuccessLabel: string;
		criticalHitLabel: string;
		hypeTrainLabel: string;
	};
}

export interface GameScreenViewProps {
	topBar: GameScreenTopBarConfig;
	hypeOverlayState: "active" | "inactive";
	pokemonSection: GameScreenPokemonSectionConfig;
	controlsSection: GameScreenPlayAreaProps;
}

interface BuildGameScreenViewPropsInput {
	currentPokemon: Pokemon | undefined;
	isPokemonLoading: boolean;
	isCorrect: boolean | null;
	isMuted: boolean;
	setIsMuted: (value: boolean) => void;
	isHardMode: boolean;
	showCriticalSuccess: boolean;
	showCriticalHit: boolean;
	showHypeTrain: boolean;
	consecutiveFastAnswers: number;
	showProgressCounter?: boolean;
	totalTimeElapsed: number;
	formatTime: (seconds: number) => string;
	onQuit: () => void;
	pointsEarned: number;
	guessTimeLeft: number;
	remainingCount: number;
	totalCount: number;
	criticalSuccessLabel: string;
	criticalHitLabel: string;
	hypeTrainLabel: string;
	controlsSection: GameScreenPlayAreaProps;
}

export const buildGameScreenViewProps = (
	input: BuildGameScreenViewPropsInput,
): GameScreenViewProps => ({
	topBar: {
		currentPokemon: input.currentPokemon,
		totalTimeElapsed: input.totalTimeElapsed,
		formatTime: input.formatTime,
		audioState: input.isMuted ? "muted" : "unmuted",
		setIsMuted: input.setIsMuted,
		difficultyMode: input.isHardMode ? "hard" : "normal",
		onQuit: input.onQuit,
		pointsEarned: input.pointsEarned,
	},
	hypeOverlayState: input.showHypeTrain ? "active" : "inactive",
	pokemonSection: {
		pokemonDisplayProps: {
			currentPokemon: input.currentPokemon,
			loadingState: input.isPokemonLoading ? "loading" : "ready",
			answerState:
				input.isCorrect === null
					? "unknown"
					: input.isCorrect
						? "correct"
						: "incorrect",
			audioState: input.isMuted ? "muted" : "unmuted",
			guessTimeLeft: input.guessTimeLeft,
			remainingCount: input.remainingCount,
			totalCount: input.totalCount,
			progressCounterState: input.showProgressCounter === false ? "hidden" : "visible",
		},
		banner: {
			type: input.showCriticalSuccess
				? "critical_success"
				: input.showCriticalHit
					? "critical_hit"
					: input.showHypeTrain
						? "hype_train"
						: "none",
			criticalSuccessLabel: input.criticalSuccessLabel,
			criticalHitLabel: input.criticalHitLabel,
			hypeTrainLabel: input.hypeTrainLabel,
		},
	},
	controlsSection: input.controlsSection,
});

