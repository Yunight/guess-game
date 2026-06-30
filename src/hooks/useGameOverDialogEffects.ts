import {
	executeRewardCryPlayback,
	REWARD_CRY_PLAYBACK_DELAY_MS,
} from "@/components/pokemon-game/gameOverCryPlayback";
import {
	buildShareText,
	copyTextToClipboard,
	getShareUrl,
	shareGameResult,
} from "@/components/pokemon-game/gameOverDialogShare";
import {
	SAVE_SCHEDULE_DELAY_MS,
	SAVE_SETTLE_DELAY_MS,
	createGameSessionId,
	persistGameResult,
	shouldAbortSaveAfterDelay,
	shouldProceedWithGameSave,
	shouldScheduleGameSave,
} from "@/components/pokemon-game/gameOverDialogSave";
import type { GameOverDialogProps } from "@/components/pokemon-game/GameOverDialog";
import { useCallback, useEffect, useState } from "react";
import { useTranslation } from "react-i18next";

export type UseGameOverDialogEffectsParams = Pick<
	GameOverDialogProps,
	| "gameOver"
	| "playerName"
	| "score"
	| "totalTimeElapsed"
	| "userRanking"
	| "remainingPokemon"
	| "rewardPokemon"
	| "isSlotMachineRunning"
	| "isMuted"
	| "selectedGeneration"
	| "criticalHitCount"
	| "criticalSuccessCount"
	| "hyperTrainCount"
	| "maxHypeChain"
	| "formatTimeForRanking"
>;

export interface UseGameOverDialogEffectsResult {
	shareableUrl: string | null;
	isSavingResult: boolean;
	urlCopied: boolean;
	displayTime: number;
	onCopyUrl: () => void;
	onShare: () => void;
}

export const useGameOverDialogEffects = (
	params: UseGameOverDialogEffectsParams,
): UseGameOverDialogEffectsResult => {
	const {
		gameOver,
		playerName,
		score,
		totalTimeElapsed,
		userRanking,
		remainingPokemon,
		rewardPokemon,
		isSlotMachineRunning,
		isMuted,
		selectedGeneration,
		criticalHitCount,
		criticalSuccessCount,
		hyperTrainCount,
		maxHypeChain,
		formatTimeForRanking,
	} = params;

	const { t, i18n } = useTranslation();
	const [lastPlayedId, setLastPlayedId] = useState<number | null>(null);
	const [finalTime, setFinalTime] = useState(0);
	const [shareableUrl, setShareableUrl] = useState<string | null>(null);
	const [isSavingResult, setIsSavingResult] = useState(false);
	const [urlCopied, setUrlCopied] = useState(false);
	const [gameSessionId, setGameSessionId] = useState<string | null>(null);

	const displayTime = finalTime > 0 ? finalTime : totalTimeElapsed;

	useEffect(() => {
		if (!gameOver) {
			setShareableUrl(null);
			setIsSavingResult(false);
			setUrlCopied(false);
			setFinalTime(0);
			setGameSessionId(null);
		}
	}, [gameOver]);

	useEffect(() => {
		if (gameOver && !gameSessionId && !shareableUrl && !isSavingResult) {
			const newSessionId = createGameSessionId();
			setGameSessionId(newSessionId);
			console.log("🎮 New game session started:", newSessionId);
		}
	}, [gameOver, gameSessionId, shareableUrl, isSavingResult]);

	useEffect(() => {
		if (gameOver && totalTimeElapsed > 0) {
			console.log("Storing final time:", totalTimeElapsed);
			setFinalTime(totalTimeElapsed);
		}
	}, [gameOver, totalTimeElapsed]);

	useEffect(() => {
		if (gameOver && rewardPokemon.pokemon) {
			console.log("🎯 Reward Pokemon updated:", {
				id: rewardPokemon.pokemon.id,
				englishName: rewardPokemon.pokemon.englishName,
				frenchName: rewardPokemon.pokemon.frenchName,
				isSlotMachineRunning,
				isLoading: rewardPokemon.isLoading,
			});
		}
	}, [
		gameOver,
		rewardPokemon.pokemon,
		isSlotMachineRunning,
		rewardPokemon.isLoading,
	]);

	useEffect(() => {
		const saveContext = {
			gameOver,
			shareableUrl,
			isSavingResult,
			rewardPokemon,
			isSlotMachineRunning,
			gameSessionId,
			finalTime,
			totalTimeElapsed,
		};

		const saveResult = async (): Promise<void> => {
			if (!shouldProceedWithGameSave(saveContext)) {
				return;
			}

			console.log(
				"🚀 Starting game result save process for session:",
				gameSessionId,
			);

			await new Promise<void>((resolve) => {
				setTimeout(resolve, SAVE_SETTLE_DELAY_MS);
			});

			if (
				shouldAbortSaveAfterDelay(rewardPokemon, isSlotMachineRunning)
			) {
				console.log(
					"⚠️ Pokemon state changed during save delay, aborting save",
				);
				return;
			}

			const pokemon = rewardPokemon.pokemon;
			if (!pokemon || !gameSessionId) {
				return;
			}

			setIsSavingResult(true);
			try {
				console.log("💾 Saving game result with session:", gameSessionId);
				const url = await persistGameResult({
					playerName,
					score,
					finalTime,
					totalTimeElapsed,
					userRanking,
					selectedGeneration,
					rewardPokemon: pokemon,
					remainingPokemon,
					criticalHitCount,
					criticalSuccessCount,
					hyperTrainCount,
					maxHypeChain,
					gameSessionId,
				});
				console.log("✅ Game result saved successfully. URL:", url);
				setShareableUrl(url);
			} catch (error) {
				console.error("❌ Failed to save game result:", error);
				setIsSavingResult(false);
			} finally {
				if (shareableUrl) {
					setIsSavingResult(false);
				}
			}
		};

		if (shouldScheduleGameSave(saveContext)) {
			console.log(
				"🎰 Slot machine done, scheduling save for session:",
				gameSessionId,
			);
			const timeoutId = setTimeout(() => {
				void saveResult();
			}, SAVE_SCHEDULE_DELAY_MS);
			return () => {
				console.log("🚫 Clearing save timeout for session:", gameSessionId);
				clearTimeout(timeoutId);
			};
		}
	}, [
		gameOver,
		isSlotMachineRunning,
		rewardPokemon,
		shareableUrl,
		isSavingResult,
		gameSessionId,
		playerName,
		score,
		finalTime,
		totalTimeElapsed,
		userRanking,
		selectedGeneration,
		remainingPokemon,
		criticalHitCount,
		criticalSuccessCount,
		hyperTrainCount,
		maxHypeChain,
	]);

	const copyUrl = useCallback(async (): Promise<void> => {
		if (!shareableUrl) {
			return;
		}

		const copied = await copyTextToClipboard(shareableUrl);
		if (copied) {
			setUrlCopied(true);
			setTimeout(() => setUrlCopied(false), 2000);
		}
	}, [shareableUrl]);

	const playPokemonCry = useCallback(
		async (pokemonId: number): Promise<void> => {
			const newLastPlayedId = await executeRewardCryPlayback(
				pokemonId,
				lastPlayedId,
				isMuted,
			);
			if (newLastPlayedId !== null) {
				setLastPlayedId(newLastPlayedId);
			}
		},
		[lastPlayedId, isMuted],
	);

	useEffect(() => {
		if (isSlotMachineRunning) {
			setLastPlayedId(null);
			return;
		}

		if (
			!gameOver ||
			isMuted ||
			!rewardPokemon.pokemon ||
			rewardPokemon.isLoading
		) {
			return;
		}

		const timeoutId = setTimeout(() => {
			const pokemonId = rewardPokemon.pokemon?.id;
			if (!pokemonId) {
				return;
			}

			console.log("🎵 Attempting to play reward Pokemon cry:", {
				pokemonId,
				pokemonName: rewardPokemon.pokemon?.englishName,
				frenchName: rewardPokemon.pokemon?.frenchName,
			});

			void playPokemonCry(pokemonId);
		}, REWARD_CRY_PLAYBACK_DELAY_MS);

		return () => clearTimeout(timeoutId);
	}, [
		gameOver,
		isMuted,
		rewardPokemon.pokemon,
		rewardPokemon.isLoading,
		isSlotMachineRunning,
		playPokemonCry,
	]);

	const handleShare = useCallback(async (): Promise<void> => {
		const shareText = buildShareText({
			playerName,
			score,
			totalTimeElapsed,
			userRanking,
			remainingPokemon,
			maxHypeChain,
			criticalHitCount,
			criticalSuccessCount,
			hyperTrainCount,
			rewardPokemon: rewardPokemon.pokemon,
			selectedGeneration,
			shareableUrl,
			language: i18n.language,
			t,
			formatTimeForRanking,
		});

		const urlToShare = getShareUrl(shareableUrl);
		await shareGameResult(shareText, urlToShare);
	}, [
		playerName,
		score,
		totalTimeElapsed,
		userRanking,
		remainingPokemon,
		maxHypeChain,
		criticalHitCount,
		criticalSuccessCount,
		hyperTrainCount,
		rewardPokemon.pokemon,
		selectedGeneration,
		shareableUrl,
		i18n.language,
		t,
		formatTimeForRanking,
	]);

	return {
		shareableUrl,
		isSavingResult,
		urlCopied,
		displayTime,
		onCopyUrl: () => {
			void copyUrl();
		},
		onShare: () => {
			void handleShare();
		},
	};
};
