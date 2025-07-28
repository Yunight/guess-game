import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Check,
	Clock,
	Copy,
	Crown,
	Home,
	RefreshCcw,
	Share2,
	Trophy,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	type GameResult,
	gameResultsService,
} from "../../services/gameResultsService";
import { StaticPokemonDisplay } from "./StaticPokemonDisplay";

const ResultsPage = () => {
	const { resultId } = useParams<{ resultId: string }>();
	const navigate = useNavigate();
	const { t, i18n } = useTranslation();
	const [gameResult, setGameResult] = useState<GameResult | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [urlCopied, setUrlCopied] = useState(false);
	const [isNetworkError, setIsNetworkError] = useState(false);

	useEffect(() => {
		const loadResult = async () => {
			if (!resultId) {
				setError("No result ID provided");
				setLoading(false);
				return;
			}

			try {
				const result = await gameResultsService.getGameResult(resultId);
				if (result) {
					setGameResult(result);
				} else {
					setError("Result not found");
				}
			} catch (err) {
				console.error("Error loading result:", err);

				// Check if it's a network error
				const networkError =
					err instanceof Error &&
					(err.message.includes("fetch") ||
						err.message.includes("network") ||
						err.message.includes("offline") ||
						!navigator.onLine);

				setIsNetworkError(networkError);

				if (networkError) {
					setError(
						"Network connection required. Please check your internet connection and try again.",
					);
				} else {
					setError("Failed to load result");
				}
			} finally {
				setLoading(false);
			}
		};

		loadResult();
	}, [resultId]);

	const handleRetry = () => {
		setLoading(true);
		setError(null);
		setIsNetworkError(false);

		// Trigger reload
		window.location.reload();
	};

	const formatTime = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	const copyUrl = async () => {
		if (!gameResult) return;

		const shareUrl = gameResultsService.generateShareableUrl(gameResult.id);

		try {
			await navigator.clipboard.writeText(shareUrl);
			setUrlCopied(true);
			setTimeout(() => setUrlCopied(false), 2000); // Reset after 2 seconds
		} catch (error) {
			console.error("Failed to copy URL:", error);
			// Fallback: select text for manual copy
			const textArea = document.createElement("textarea");
			textArea.value = shareUrl;
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand("copy");
				setUrlCopied(true);
				setTimeout(() => setUrlCopied(false), 2000);
			} catch (fallbackError) {
				console.error("Fallback copy failed:", fallbackError);
			}
			document.body.removeChild(textArea);
		}
	};

	const handleShare = async () => {
		if (!gameResult) return;

		const shareUrl = gameResultsService.generateShareableUrl(gameResult.id);
		const genNumber =
			gameResult.selectedGeneration.name.match(/\d+/)?.[0] || "1";
		const genName =
			i18n.language === "fr"
				? `${genNumber}ère Génération`
				: `Generation ${genNumber}`;

		const shareText = `${t("checkOutResult")}

👤 ${gameResult.playerName}
🎯 ${t("score")}: ${gameResult.score}
⏱️ ${t("time")}: ${formatTime(gameResult.totalTimeElapsed)}
🌐 ${genName}
${gameResult.userRanking ? `👑 ${t("ranking")} #${gameResult.userRanking}` : ""}

${shareUrl}

#PokemonGuesserGame #Pokemon`;

		try {
			if (navigator.share) {
				await navigator.share({
					text: shareText,
					url: shareUrl,
				});
			} else {
				await navigator.clipboard.writeText(shareUrl);
				alert("Link copied to clipboard!");
			}
		} catch (err) {
			// Fallback: copy to clipboard
			try {
				await navigator.clipboard.writeText(shareUrl);
				alert("Link copied to clipboard!");
			} catch (clipboardErr) {
				console.error("Failed to copy to clipboard:", clipboardErr);
			}
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
				<div className="text-white text-xl">{t("loadingResult")}</div>
			</div>
		);
	}

	if (error || !gameResult) {
		return (
			<div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
				<Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 text-center">
					<h1 className="text-2xl font-bold text-white mb-4">
						{isNetworkError ? "Connection Error" : t("resultNotFound")}
					</h1>
					<p className="text-gray-300 mb-6">
						{error || t("resultNotFoundDesc")}
					</p>

					<div className="flex gap-3 justify-center">
						{isNetworkError && (
							<Button
								onClick={handleRetry}
								className="bg-green-500 hover:bg-green-600 text-white"
							>
								<RefreshCcw className="mr-2 h-4 w-4" />
								Retry
							</Button>
						)}
						<Link to="/">
							<Button className="bg-blue-500 hover:bg-blue-600 text-white">
								<Home className="mr-2 h-4 w-4" />
								{t("backToGame")}
							</Button>
						</Link>
					</div>
				</Card>
			</div>
		);
	}

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-4">
			<Card className="w-full max-w-2xl p-8 bg-white/10 backdrop-blur-sm border-white/20">
				<div className="text-center text-white">
					<h1 className="text-3xl font-bold mb-2">{t("gameComplete")}</h1>
					<p className="text-xl mb-6">
						{t("sharedBy", { name: gameResult.playerName })}
					</p>

					{gameResult.rewardPokemon && (
						<div className="mb-6">
							<StaticPokemonDisplay pokemon={gameResult.rewardPokemon} />
						</div>
					)}

					<div className="grid grid-cols-2 gap-4 mb-6">
						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
							<div className="flex items-center gap-2 text-yellow-300">
								<Trophy className="h-5 w-5" />
								<p className="text-sm font-medium">{t("score")}</p>
							</div>
							<p className="text-2xl font-bold">{gameResult.score}</p>
						</div>

						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
							<div className="flex items-center gap-2 text-yellow-300">
								<Clock className="h-5 w-5" />
								<p className="text-sm font-medium">{t("time")}</p>
							</div>
							<p className="text-2xl font-bold">
								{formatTime(gameResult.totalTimeElapsed)}
							</p>
						</div>

						{gameResult.userRanking && (
							<div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
								<div className="flex items-center gap-2 text-yellow-300">
									<Crown className="h-5 w-5" />
									<p className="text-sm font-medium">{t("ranking")}</p>
								</div>
								<p className="text-2xl font-bold">#{gameResult.userRanking}</p>
							</div>
						)}
					</div>

					{/* Game Stats */}
					<div className="grid grid-cols-2 gap-4 mb-6 text-sm">
						<div className="bg-white/5 rounded-lg p-3">
							<div className="font-medium text-yellow-300">
								{t("generation")}
							</div>
							<div>{gameResult.selectedGeneration.name}</div>
						</div>
						<div className="bg-white/5 rounded-lg p-3">
							<div className="font-medium text-yellow-300">
								{t("pokemonLeft")}
							</div>
							<div>{gameResult.remainingPokemon.length}</div>
						</div>
						<div className="bg-white/5 rounded-lg p-3">
							<div className="font-medium text-yellow-300">
								{t("criticalHits")}
							</div>
							<div>{gameResult.criticalHitCount}</div>
						</div>
						<div className="bg-white/5 rounded-lg p-3">
							<div className="font-medium text-yellow-300">
								{t("maxHypeChain")}
							</div>
							<div>{gameResult.maxHypeChain}</div>
						</div>
					</div>

					{/* Copy URL Section */}
					{gameResult && (
						<div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10">
							<div className="text-sm text-yellow-300 font-medium mb-2">
								🔗 {t("shareableLink")}
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									className="text-xs text-gray-300 break-all font-mono bg-black/20 p-2 rounded flex-1 cursor-pointer hover:bg-black/30 transition-colors text-left"
									onClick={copyUrl}
									title={t("copyUrl")}
								>
									{gameResultsService.generateShareableUrl(gameResult.id)}
								</button>
								<button
									type="button"
									onClick={copyUrl}
									className="p-2 bg-black/20 hover:bg-black/40 rounded transition-colors text-gray-300 hover:text-white"
									title={t("copyUrl")}
								>
									{urlCopied ? (
										<Check className="h-4 w-4 text-green-400" />
									) : (
										<Copy className="h-4 w-4" />
									)}
								</button>
							</div>
							{urlCopied && (
								<div className="text-xs text-green-400 mt-2 animate-fade-in">
									✅ {t("urlCopied")}
								</div>
							)}
						</div>
					)}

					<div className="grid grid-cols-2 gap-3">
						<Button
							onClick={handleShare}
							className="bg-green-500 hover:bg-green-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
							size="lg"
						>
							<Share2 className="mr-2 h-4 w-4" />
							{t("share")}
						</Button>
						<Link to="/">
							<Button
								className="w-full bg-blue-500 hover:bg-blue-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
								size="lg"
							>
								<Home className="mr-2 h-4 w-4" />
								{t("playGame")}
							</Button>
						</Link>
					</div>
				</div>
			</Card>
		</div>
	);
};

export default ResultsPage;
