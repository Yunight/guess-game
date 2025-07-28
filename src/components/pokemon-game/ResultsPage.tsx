import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
	Check,
	Clock,
	Copy,
	Crown,
	Gem,
	Home,
	Share2,
	Star,
	Trophy,
	Zap,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
	type GameResult,
	gameResultsService,
} from "../../services/gameResultsService";
import { StaticPokemonDisplay } from "./StaticPokemonDisplay";

// Get available titles based on achievement level (lower percentage = more titles available)
const getAvailableTitles = (
	percentageRemaining: number,
	t: (key: string) => string,
): string[] => {
	const allTitles: string[] = [];

	// Add titles based on achievement level (better achievements unlock more titles)
	if (percentageRemaining <= 50) {
		allTitles.push(
			t("prestigeTitles.beginner.0"),
			t("prestigeTitles.beginner.1"),
			t("prestigeTitles.beginner.2"),
			t("prestigeTitles.beginner.3"),
			t("prestigeTitles.beginner.4"),
		);
	}
	if (percentageRemaining <= 45) {
		allTitles.push(
			t("prestigeTitles.novice.0"),
			t("prestigeTitles.novice.1"),
			t("prestigeTitles.novice.2"),
			t("prestigeTitles.novice.3"),
			t("prestigeTitles.novice.4"),
		);
	}
	if (percentageRemaining <= 40) {
		allTitles.push(
			t("prestigeTitles.intermediate.0"),
			t("prestigeTitles.intermediate.1"),
			t("prestigeTitles.intermediate.2"),
			t("prestigeTitles.intermediate.3"),
			t("prestigeTitles.intermediate.4"),
		);
	}
	if (percentageRemaining <= 35) {
		allTitles.push(
			t("prestigeTitles.experienced.0"),
			t("prestigeTitles.experienced.1"),
			t("prestigeTitles.experienced.2"),
			t("prestigeTitles.experienced.3"),
			t("prestigeTitles.experienced.4"),
		);
	}
	if (percentageRemaining <= 30) {
		allTitles.push(
			t("prestigeTitles.skilled.0"),
			t("prestigeTitles.skilled.1"),
			t("prestigeTitles.skilled.2"),
			t("prestigeTitles.skilled.3"),
			t("prestigeTitles.skilled.4"),
		);
	}
	if (percentageRemaining <= 25) {
		allTitles.push(
			t("prestigeTitles.expert.0"),
			t("prestigeTitles.expert.1"),
			t("prestigeTitles.expert.2"),
			t("prestigeTitles.expert.3"),
			t("prestigeTitles.expert.4"),
		);
	}
	if (percentageRemaining <= 20) {
		allTitles.push(
			t("prestigeTitles.master.0"),
			t("prestigeTitles.master.1"),
			t("prestigeTitles.master.2"),
			t("prestigeTitles.master.3"),
			t("prestigeTitles.master.4"),
		);
	}
	if (percentageRemaining <= 10) {
		allTitles.push(
			t("prestigeTitles.champion.0"),
			t("prestigeTitles.champion.1"),
			t("prestigeTitles.champion.2"),
			t("prestigeTitles.champion.3"),
			t("prestigeTitles.champion.4"),
		);
	}
	if (percentageRemaining <= 5) {
		allTitles.push(
			t("prestigeTitles.legendary.0"),
			t("prestigeTitles.legendary.1"),
			t("prestigeTitles.legendary.2"),
			t("prestigeTitles.legendary.3"),
			t("prestigeTitles.legendary.4"),
		);
	}

	return allTitles.length > 0 ? allTitles : [t("prestigeTitles.beginner.0")];
};

// Get random title from available titles
const getRandomTitle = (availableTitles: string[]): string => {
	const randomIndex = Math.floor(Math.random() * availableTitles.length);
	return availableTitles[randomIndex];
};

// Prestige theme definitions based on percentage of Pokemon remaining
const getPrestigeTheme = (
	remainingPokemon: number,
	totalPokemon: number,
	t: (key: string) => string,
) => {
	const percentageRemaining = (remainingPokemon / totalPokemon) * 100;
	const availableTitles = getAvailableTitles(percentageRemaining, t);
	const randomTitle = getRandomTitle(availableTitles);

	if (percentageRemaining === 0) {
		return {
			name: randomTitle,
			bgGradient: "from-yellow-400 via-orange-500 to-red-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-yellow-400/80",
			titleColor: "text-yellow-100",
			accentColor: "text-yellow-300",
			icon: Crown,
			particles: true,
			glow: "shadow-2xl shadow-yellow-500/50",
			animation: "",
		};
	}
	if (percentageRemaining <= 5) {
		return {
			name: randomTitle,
			bgGradient: "from-red-600 via-orange-600 to-yellow-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-red-400/80",
			titleColor: "text-red-100",
			accentColor: "text-orange-300",
			icon: Crown,
			particles: true,
			glow: "shadow-xl shadow-red-500/50",
			animation: "",
		};
	}
	if (percentageRemaining <= 10) {
		return {
			name: randomTitle,
			bgGradient: "from-amber-600 via-yellow-600 to-orange-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-amber-400/80",
			titleColor: "text-amber-100",
			accentColor: "text-yellow-300",
			icon: Gem,
			particles: true,
			glow: "shadow-xl shadow-amber-500/50",
			animation: "",
		};
	}
	if (percentageRemaining <= 20) {
		return {
			name: randomTitle,
			bgGradient: "from-pink-600 via-rose-600 to-red-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-pink-400/70",
			titleColor: "text-pink-100",
			accentColor: "text-rose-300",
			icon: Star,
			particles: false,
			glow: "shadow-lg shadow-pink-500/50",
			animation: "",
		};
	}
	if (percentageRemaining <= 25) {
		return {
			name: randomTitle,
			bgGradient: "from-indigo-600 via-blue-600 to-purple-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-indigo-400/70",
			titleColor: "text-indigo-100",
			accentColor: "text-blue-300",
			icon: Trophy,
			particles: false,
			glow: "shadow-lg shadow-indigo-500/40",
			animation: "",
		};
	}
	if (percentageRemaining <= 30) {
		return {
			name: randomTitle,
			bgGradient: "from-purple-600 via-violet-600 to-indigo-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-purple-400/70",
			titleColor: "text-purple-100",
			accentColor: "text-violet-300",
			icon: Star,
			particles: false,
			glow: "shadow-md shadow-purple-500/40",
			animation: "",
		};
	}
	if (percentageRemaining <= 35) {
		return {
			name: randomTitle,
			bgGradient: "from-teal-600 via-cyan-600 to-blue-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-teal-400/70",
			titleColor: "text-teal-100",
			accentColor: "text-cyan-300",
			icon: Crown,
			particles: false,
			glow: "shadow-md shadow-teal-500/40",
			animation: "",
		};
	}
	if (percentageRemaining <= 40) {
		return {
			name: randomTitle,
			bgGradient: "from-cyan-600 via-teal-600 to-blue-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-cyan-400/70",
			titleColor: "text-cyan-100",
			accentColor: "text-teal-300",
			icon: Trophy,
			particles: false,
			glow: "shadow-md shadow-cyan-500/40",
			animation: "",
		};
	}
	if (percentageRemaining <= 45) {
		return {
			name: randomTitle,
			bgGradient: "from-green-600 via-teal-600 to-cyan-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-green-400/70",
			titleColor: "text-green-100",
			accentColor: "text-teal-300",
			icon: Trophy,
			particles: false,
			glow: "shadow-md shadow-green-500/40",
			animation: "",
		};
	}
	if (percentageRemaining <= 50) {
		return {
			name: randomTitle,
			bgGradient: "from-emerald-600 via-green-600 to-teal-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-emerald-400/70",
			titleColor: "text-emerald-100",
			accentColor: "text-green-300",
			icon: Trophy,
			particles: false,
			glow: "shadow-md shadow-emerald-500/40",
			animation: "",
		};
	}

	return {
		name: randomTitle,
		bgGradient: "from-blue-900 via-purple-900 to-indigo-900",
		cardBg:
			"bg-gradient-to-br from-slate-900/95 via-gray-900/95 to-slate-900/95 backdrop-blur-md border-2 border-blue-400/70",
		titleColor: "text-blue-100",
		accentColor: "text-blue-300",
		icon: Trophy,
		particles: false,
		glow: "shadow-lg shadow-blue-500/30",
		animation: "",
	};
};

const ResultsPage = () => {
	const { resultId } = useParams<{ resultId: string }>();
	const navigate = useNavigate();
	const { t, i18n } = useTranslation();
	const [gameResult, setGameResult] = useState<GameResult | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [urlCopied, setUrlCopied] = useState(false);

	// Debug mode for testing different prestige levels
	const [debugMode, setDebugMode] = useState(import.meta.env.DEV);
	const [debugRemainingPokemon, setDebugRemainingPokemon] = useState<
		number | null
	>(null);

	useEffect(() => {
		const loadResult = async () => {
			if (!resultId) {
				console.error("❌ No result ID provided in URL");
				setError("No result ID provided");
				setLoading(false);
				return;
			}

			console.log("🔍 Loading result for ID:", resultId);

			try {
				const result = await gameResultsService.getGameResult(resultId);
				if (result) {
					console.log("📊 Retrieved game result from Firebase:", {
						resultId,
						playerName: result.playerName,
						score: result.score,
						rewardPokemon: {
							id: result.rewardPokemon?.id,
							englishName: result.rewardPokemon?.englishName,
							frenchName: result.rewardPokemon?.frenchName,
							isShiny: result.rewardPokemon?.isShiny,
						},
						createdAt: result.createdAt,
						gameMode: result.gameMode,
					});
					setGameResult(result);
				} else {
					console.warn("⚠️ Result not found for ID:", resultId);
					setError("Result not found");
				}
			} catch (err) {
				console.error("❌ Error loading result:", err);
				setError("Failed to load result");
			} finally {
				setLoading(false);
			}
		};

		loadResult();
	}, [resultId]);

	const formatTime = (seconds: number): string => {
		const minutes = Math.floor(seconds / 60);
		const remainingSeconds = seconds % 60;
		return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
	};

	const copyUrl = async () => {
		if (!gameResult) return;

		const shareUrl = gameResultsService.generateShareableUrl(gameResult.id);
		console.log("📋 Copying URL to clipboard:", shareUrl);

		try {
			await navigator.clipboard.writeText(shareUrl);
			setUrlCopied(true);
			console.log("✅ URL copied successfully");
			setTimeout(() => setUrlCopied(false), 2000); // Reset after 2 seconds
		} catch (error) {
			console.error("❌ Failed to copy URL:", error);
			// Fallback: select text for manual copy
			const textArea = document.createElement("textarea");
			textArea.value = shareUrl;
			document.body.appendChild(textArea);
			textArea.select();
			try {
				document.execCommand("copy");
				setUrlCopied(true);
				console.log("✅ URL copied successfully (fallback method)");
				setTimeout(() => setUrlCopied(false), 2000);
			} catch (fallbackError) {
				console.error("❌ Fallback copy failed:", fallbackError);
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
						{t("resultNotFound")}
					</h1>
					<p className="text-gray-300 mb-6">
						{error || t("resultNotFoundDesc")}
					</p>
					<Link to="/">
						<Button className="bg-blue-500 hover:bg-blue-600 text-white">
							<Home className="mr-2 h-4 w-4" />
							{t("backToGame")}
						</Button>
					</Link>
				</Card>
			</div>
		);
	}

	// Get current prestige theme
	const currentRemainingPokemon =
		debugRemainingPokemon !== null
			? debugRemainingPokemon
			: gameResult.remainingPokemon.length;

	// Calculate total Pokemon in generation
	const totalPokemonInGeneration =
		gameResult.selectedGeneration.endId -
		gameResult.selectedGeneration.startId +
		1;

	const prestigeTheme = getPrestigeTheme(
		currentRemainingPokemon,
		totalPokemonInGeneration,
		t,
	);
	const IconComponent = prestigeTheme.icon;

	return (
		<div
			className={`min-h-screen bg-gradient-to-br ${prestigeTheme.bgGradient} flex items-center justify-center p-4 relative overflow-hidden`}
		>
			{/* Particle Effects for highest tiers */}
			{prestigeTheme.particles && (
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					{[...Array(20)].map((_, i) => (
						<div
							key={`particle-${gameResult?.id || "default"}-${i}`}
							className="absolute w-2 h-2 bg-white/30 rounded-full animate-ping"
							style={{
								left: `${Math.random() * 100}%`,
								top: `${Math.random() * 100}%`,
								animationDelay: `${Math.random() * 2}s`,
								animationDuration: `${2 + Math.random() * 2}s`,
							}}
						/>
					))}
				</div>
			)}

			{/* Debug Controls */}
			{debugMode && (
				<div className="absolute top-4 left-4 bg-black/80 p-4 rounded-lg text-white z-50">
					<h3 className="text-lg font-bold mb-2">Debug: Prestige Levels</h3>
					<div className="grid grid-cols-5 gap-2 text-xs">
						{[0, 2, 5, 8, 12, 18, 22, 28, 32, 38, 42, 48, 55, 65, 75].map(
							(percentage) => {
								const pokemonCount = Math.round(
									(percentage / 100) * totalPokemonInGeneration,
								);
								return (
									<button
										key={percentage}
										type="button"
										onClick={() => setDebugRemainingPokemon(pokemonCount)}
										className={`px-2 py-1 rounded ${debugRemainingPokemon === pokemonCount ? "bg-blue-500" : "bg-gray-600"} hover:bg-blue-400`}
									>
										{percentage}%
									</button>
								);
							},
						)}
					</div>
					<button
						type="button"
						onClick={() => setDebugRemainingPokemon(null)}
						className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
					>
						Reset
					</button>
				</div>
			)}

			<Card
				className={`w-full max-w-2xl p-8 ${prestigeTheme.cardBg} backdrop-blur-sm border-white/20 ${prestigeTheme.glow} ${prestigeTheme.animation}`}
			>
				<div className="text-center">
					<div className="flex justify-center mb-4">
						<div
							className={`p-4 rounded-full bg-white/10 ${prestigeTheme.animation}`}
						>
							<IconComponent
								className={`h-12 w-12 ${prestigeTheme.accentColor}`}
							/>
						</div>
					</div>
					<div
						className={`text-sm font-medium ${prestigeTheme.accentColor} mb-2`}
					>
						{prestigeTheme.name}
					</div>
					<h1 className={`text-3xl font-bold mb-2 ${prestigeTheme.titleColor}`}>
						{t("gameComplete")}
					</h1>
					<p className={`text-xl mb-6 ${prestigeTheme.titleColor}`}>
						{t("sharedBy", { name: gameResult.playerName })}
					</p>

					{gameResult.rewardPokemon && (
						<div className="mb-6">
							<StaticPokemonDisplay pokemon={gameResult.rewardPokemon} />
						</div>
					)}

					<div className="grid grid-cols-2 gap-4 mb-6">
						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
							<div
								className={`flex items-center gap-2 ${prestigeTheme.accentColor}`}
							>
								<Trophy className="h-5 w-5" />
								<p className="text-sm font-medium">{t("score")}</p>
							</div>
							<p className={`text-2xl font-bold ${prestigeTheme.titleColor}`}>
								{gameResult.score}
							</p>
						</div>

						<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
							<div
								className={`flex items-center gap-2 ${prestigeTheme.accentColor}`}
							>
								<Clock className="h-5 w-5" />
								<p className="text-sm font-medium">{t("time")}</p>
							</div>
							<p className={`text-2xl font-bold ${prestigeTheme.titleColor}`}>
								{formatTime(gameResult.totalTimeElapsed)}
							</p>
						</div>

						{gameResult.userRanking && (
							<div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
								<div
									className={`flex items-center gap-2 ${prestigeTheme.accentColor}`}
								>
									<Crown className="h-5 w-5" />
									<p className="text-sm font-medium">{t("ranking")}</p>
								</div>
								<p className={`text-2xl font-bold ${prestigeTheme.titleColor}`}>
									#{gameResult.userRanking}
								</p>
							</div>
						)}
					</div>

					{/* Game Stats */}
					<div className="grid grid-cols-2 gap-4 mb-6 text-sm">
						<div className="bg-white/5 rounded-lg p-3">
							<div className={`font-medium ${prestigeTheme.accentColor}`}>
								{t("generation")}
							</div>
							<div className={prestigeTheme.titleColor}>
								{gameResult.selectedGeneration.name}
							</div>
						</div>
						<div className="bg-white/5 rounded-lg p-3">
							<div className={`font-medium ${prestigeTheme.accentColor}`}>
								{t("pokemonLeft")}
							</div>
							<div className={prestigeTheme.titleColor}>
								{currentRemainingPokemon}
							</div>
						</div>
						<div className="bg-white/5 rounded-lg p-3">
							<div className={`font-medium ${prestigeTheme.accentColor}`}>
								{t("criticalHits")}
							</div>
							<div className={prestigeTheme.titleColor}>
								{gameResult.criticalHitCount}
							</div>
						</div>
						<div className="bg-white/5 rounded-lg p-3">
							<div className={`font-medium ${prestigeTheme.accentColor}`}>
								{t("maxHypeChain")}
							</div>
							<div className={prestigeTheme.titleColor}>
								{gameResult.maxHypeChain}
							</div>
						</div>
					</div>

					{/* Copy URL Section */}
					{gameResult && (
						<div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 relative">
							<div
								className={`text-sm font-medium mb-2 ${prestigeTheme.accentColor}`}
							>
								🔗 {t("shareableLink")}
							</div>
							<div className="flex items-center gap-2">
								<button
									type="button"
									className={`text-xs break-all font-mono bg-black/20 p-2 rounded flex-1 cursor-pointer hover:bg-black/30 transition-colors text-left ${prestigeTheme.titleColor}`}
									onClick={copyUrl}
									title={t("copyUrl")}
								>
									{gameResultsService.generateShareableUrl(gameResult.id)}
								</button>
								<button
									type="button"
									onClick={copyUrl}
									className={`p-2 bg-black/20 hover:bg-black/40 rounded transition-colors hover:text-white relative ${prestigeTheme.titleColor}`}
									title={t("copyUrl")}
								>
									{urlCopied ? (
										<Check className="h-4 w-4 text-green-400" />
									) : (
										<Copy className="h-4 w-4" />
									)}
									{urlCopied && (
										<div className="absolute -left-20 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded shadow-lg animate-fade-in whitespace-nowrap z-50">
											✅ {t("urlCopied")}
										</div>
									)}
								</button>
							</div>
						</div>
					)}

					<div className="grid grid-cols-2 gap-3 mt-6">
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
