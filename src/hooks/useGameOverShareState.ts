import {
	buildShareText,
	copyTextToClipboard,
	getShareUrl,
	shareGameResult,
} from "@/components/pokemon-game/gameOverDialogShare";
import type { GameOverDialogProps } from "@/components/pokemon-game/GameOverDialog";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";

export type GameOverShareStateParams = Pick<
	GameOverDialogProps,
	| "playerName"
	| "score"
	| "totalTimeElapsed"
	| "userRanking"
	| "remainingPokemon"
	| "rewardPokemon"
	| "selectedGeneration"
	| "criticalHitCount"
	| "criticalSuccessCount"
	| "hyperTrainCount"
	| "maxHypeChain"
	| "formatTimeForRanking"
> & {
	shareableUrl: string | null;
};

export interface GameOverShareStateResult {
	urlCopied: boolean;
	onCopyUrl: () => void;
	onShare: () => void;
}

export const useGameOverShareState = (
	params: GameOverShareStateParams,
): GameOverShareStateResult => {
	const {
		playerName,
		score,
		totalTimeElapsed,
		userRanking,
		remainingPokemon,
		rewardPokemon,
		selectedGeneration,
		criticalHitCount,
		criticalSuccessCount,
		hyperTrainCount,
		maxHypeChain,
		shareableUrl,
		formatTimeForRanking,
	} = params;

	const { t, i18n } = useTranslation();
	const [urlCopied, setUrlCopied] = useState(false);

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

	const onCopyUrl = useCallback((): void => {
		void copyUrl();
	}, [copyUrl]);

	const onShare = useCallback((): void => {
		void handleShare();
	}, [handleShare]);

	return { urlCopied, onCopyUrl, onShare };
};
