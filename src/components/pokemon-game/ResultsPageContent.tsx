import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Check, Clock, Copy, Crown, Home, Share2, Trophy } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { type GameResult, gameResultsService } from "../../services/gameResultsService";
import {
	computeRemainingPokemon,
	computeTotalPokemonInGeneration,
	formatResultsPageTime,
} from "./resultsPageLoader";
import { getPrestigeTheme } from "./resultsPageThemes";
import { ResultsPageDebugPanel } from "./ResultsPageDebugPanel";
import { StaticPokemonDisplay } from "./StaticPokemonDisplay";

interface ResultsPageContentProps {
	gameResult: GameResult;
	urlCopied: boolean;
	debugMode: boolean;
	debugRemainingPokemon: number | null;
	setDebugRemainingPokemon: (value: number | null) => void;
	copyUrl: () => void;
	handleShare: () => void;
}

export const ResultsPageContent = ({
	gameResult,
	urlCopied,
	debugMode,
	debugRemainingPokemon,
	setDebugRemainingPokemon,
	copyUrl,
	handleShare,
}: ResultsPageContentProps): JSX.Element => {
	const { t } = useTranslation();

	const currentRemainingPokemon = computeRemainingPokemon(
		debugRemainingPokemon,
		gameResult.remainingPokemon.length,
	);

	const totalPokemonInGeneration = computeTotalPokemonInGeneration(
		gameResult.selectedGeneration.startId,
		gameResult.selectedGeneration.endId,
	);

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
			{prestigeTheme.particles && (
				<div className="absolute inset-0 overflow-hidden pointer-events-none">
					{[...Array(20)].map((_, i) => (
						<div
							key={`particle-${gameResult.id}-${i}`}
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

			{debugMode && (
				<ResultsPageDebugPanel
					totalPokemonInGeneration={totalPokemonInGeneration}
					debugRemainingPokemon={debugRemainingPokemon}
					setDebugRemainingPokemon={setDebugRemainingPokemon}
				/>
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
								{formatResultsPageTime(gameResult.totalTimeElapsed)}
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

					<div className="grid grid-cols-2 gap-3 mt-6">
						<Button
							onClick={handleShare}
							className="w-full bg-green-500 hover:bg-green-600 text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
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
