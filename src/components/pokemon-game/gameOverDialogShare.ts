import type { Pokemon } from "./types";
import {
	type GameOverTranslationFn,
	getClickbaitMessage,
	getGenerationName,
	getLocalizedPokemonName,
	getShinyLabel,
} from "./gameOverDialogMessages";

const DEFAULT_SHARE_URL = "https://pokemon-guesser-game.vercel.app/";

export interface BuildShareTextParams {
	playerName: string;
	score: number;
	totalTimeElapsed: number;
	userRanking: number | null;
	remainingPokemon: readonly number[];
	maxHypeChain: number;
	criticalHitCount: number;
	criticalSuccessCount: number;
	hyperTrainCount: number;
	rewardPokemon: Pokemon | undefined;
	selectedGeneration: { name: string };
	shareableUrl: string | null;
	language: string;
	t: GameOverTranslationFn;
	formatTimeForRanking: (seconds: number) => string;
}

export const getShareUrl = (shareableUrl: string | null): string => {
	return shareableUrl ?? DEFAULT_SHARE_URL;
};

export const buildShareText = (params: BuildShareTextParams): string => {
	const {
		playerName,
		score,
		totalTimeElapsed,
		userRanking,
		remainingPokemon,
		maxHypeChain,
		criticalHitCount,
		criticalSuccessCount,
		hyperTrainCount,
		rewardPokemon,
		selectedGeneration,
		shareableUrl,
		language,
		t,
		formatTimeForRanking,
	} = params;

	const clickbaitMsg = getClickbaitMessage({
		score,
		remainingPokemon,
		userRanking,
		maxHypeChain,
		criticalHitCount,
		criticalSuccessCount,
		hyperTrainCount,
		rewardPokemon,
		selectedGeneration,
		language,
		t,
	});

	const genName = getGenerationName(selectedGeneration, language);
	const shinyText = getShinyLabel(rewardPokemon, language);
	const pokemonName = getLocalizedPokemonName(rewardPokemon, language);
	const urlToShare = getShareUrl(shareableUrl);

	return `${clickbaitMsg}

👤 ${playerName}
🎯 ${t("score")}: ${score}
⏱️ ${t("time")}: ${formatTimeForRanking(totalTimeElapsed)}
🌐 ${genName}
${userRanking ? `👑 ${t("myRank")} # ${userRanking}!` : ""}
${rewardPokemon ? `✨ ${language === "fr" ? "Je suis un" : "I am"} ${pokemonName} ${shinyText}!` : ""}

${shareableUrl ? `${t("viewMyResult")} ${urlToShare}` : urlToShare}

#PokemonGuesserGame #Pokemon #Yunight #Gaming`;
};

const buildTwitterShareUrl = (shareText: string): string => {
	const twitterText = encodeURIComponent(shareText);
	return `https://twitter.com/intent/tweet?text=${twitterText}`;
};

const openTwitterShare = (shareText: string): void => {
	const twitterUrl = buildTwitterShareUrl(shareText);
	window.open(twitterUrl, "_blank");
};

export const shareGameResult = async (
	shareText: string,
	urlToShare: string,
): Promise<void> => {
	try {
		if (navigator.share) {
			await navigator.share({
				text: shareText,
				url: urlToShare,
			});
			return;
		}

		openTwitterShare(shareText);
	} catch (error) {
		console.error("Error sharing:", error);
		openTwitterShare(shareText);
	}
};

export const copyTextToClipboard = async (text: string): Promise<boolean> => {
	try {
		await navigator.clipboard.writeText(text);
		return true;
	} catch (error) {
		console.error("Failed to copy URL:", error);

		const textArea = document.createElement("textarea");
		textArea.value = text;
		document.body.appendChild(textArea);
		textArea.select();

		try {
			document.execCommand("copy");
			document.body.removeChild(textArea);
			return true;
		} catch (fallbackError) {
			console.error("Fallback copy failed:", fallbackError);
			document.body.removeChild(textArea);
			return false;
		}
	}
};
