import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";
import { type GameResult, gameResultsService } from "../../services/gameResultsService";
import { copyTextToClipboard, createFallbackCopyHandler, shareOrCopyUrl } from "./resultsPageCopy";
import { loadGameResult } from "./resultsPageLoader";
import { buildShareText } from "./resultsPageShare";

export interface UseResultsPageResult {
	gameResult: GameResult | null;
	loading: boolean;
	error: string | null;
	urlCopied: boolean;
	debugMode: boolean;
	debugRemainingPokemon: number | null;
	setDebugRemainingPokemon: (value: number | null) => void;
	copyUrl: () => void;
	handleShare: () => void;
}

export const useResultsPage = (): UseResultsPageResult => {
	const { resultId } = useParams<{ resultId: string }>();
	const { t, i18n } = useTranslation();
	const [gameResult, setGameResult] = useState<GameResult | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [urlCopied, setUrlCopied] = useState(false);
	const [debugMode] = useState(import.meta.env.DEV);
	const [debugRemainingPokemon, setDebugRemainingPokemon] = useState<number | null>(null);

	useEffect(() => {
		const fetchResult = async (): Promise<void> => {
			const outcome = await loadGameResult(resultId, (id) => gameResultsService.getGameResult(id));

			if (outcome.status === "missingId") {
				setError("No result ID provided");
			} else if (outcome.status === "success") {
				setGameResult(outcome.result);
			} else if (outcome.status === "notFound") {
				setError("Result not found");
			} else {
				setError("Failed to load result");
			}

			setLoading(false);
		};

		void fetchResult();
	}, [resultId]);

	const copyUrl = (): void => {
		if (!gameResult) {
			return;
		}

		const shareUrl = gameResultsService.generateShareableUrl(gameResult.id);
		const fallbackCopy = createFallbackCopyHandler(
			() => document.createElement("textarea"),
			(element) => document.body.appendChild(element),
			(element) => document.body.removeChild(element),
			(command) => document.execCommand(command),
		);

		void copyTextToClipboard(
			shareUrl,
			(text) => navigator.clipboard.writeText(text),
			fallbackCopy,
		).then((result) => {
			if (result !== "failure") {
				setUrlCopied(true);
				setTimeout(() => setUrlCopied(false), 2000);
			}
		});
	};

	const handleShare = (): void => {
		if (!gameResult) {
			return;
		}

		const shareUrl = gameResultsService.generateShareableUrl(gameResult.id);
		const shareText = buildShareText({
			t,
			playerName: gameResult.playerName,
			score: gameResult.score,
			totalTimeElapsed: gameResult.totalTimeElapsed,
			generationName: gameResult.selectedGeneration.name,
			language: i18n.language,
			userRanking: gameResult.userRanking,
			shareUrl,
		});

		void shareOrCopyUrl(
			shareText,
			shareUrl,
			Boolean(navigator.share),
			(data) => navigator.share(data),
			(text) => navigator.clipboard.writeText(text),
		).then((outcome) => {
			if (outcome === "clipboard" || outcome === "clipboardFallback") {
				alert("Link copied to clipboard!");
			}
		});
	};

	return {
		gameResult,
		loading,
		error,
		urlCopied,
		debugMode,
		debugRemainingPokemon,
		setDebugRemainingPokemon,
		copyUrl,
		handleShare,
	};
};
