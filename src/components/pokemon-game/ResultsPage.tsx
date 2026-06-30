import { Button } from "@/components/ui/button";

import { Card } from "@/components/ui/card";

import { Check, Clock, Copy, Crown, Home, Share2, Trophy } from "lucide-react";

import { useEffect, useState } from "react";

import { useTranslation } from "react-i18next";

import { Link, useParams } from "react-router-dom";

import {

	type GameResult,

	gameResultsService,

} from "../../services/gameResultsService";

import {

	copyTextToClipboard,

	createFallbackCopyHandler,

	shareOrCopyUrl,

} from "./resultsPageCopy";

import {

	computeRemainingPokemon,

	computeTotalPokemonInGeneration,

	formatResultsPageTime,

	loadGameResult,

} from "./resultsPageLoader";

import { buildShareText } from "./resultsPageShare";

import { getPrestigeTheme } from "./resultsPageThemes";

import { StaticPokemonDisplay } from "./StaticPokemonDisplay";



const ResultsPage = (): JSX.Element => {

	const { resultId } = useParams<{ resultId: string }>();

	const { t, i18n } = useTranslation();

	const [gameResult, setGameResult] = useState<GameResult | null>(null);

	const [loading, setLoading] = useState(true);

	const [error, setError] = useState<string | null>(null);

	const [urlCopied, setUrlCopied] = useState(false);



	const [debugMode] = useState(import.meta.env.DEV);

	const [debugRemainingPokemon, setDebugRemainingPokemon] = useState<

		number | null

	>(null);



	useEffect(() => {

		const fetchResult = async (): Promise<void> => {

			const outcome = await loadGameResult(resultId, (id) =>

				gameResultsService.getGameResult(id),

			);



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



	const copyUrl = async (): Promise<void> => {

		if (!gameResult) return;



		const shareUrl = gameResultsService.generateShareableUrl(gameResult.id);

		const fallbackCopy = createFallbackCopyHandler(

			() => document.createElement("textarea"),

			(element) => document.body.appendChild(element),

			(element) => document.body.removeChild(element),

			(command) => document.execCommand(command),

		);



		const result = await copyTextToClipboard(

			shareUrl,

			(text) => navigator.clipboard.writeText(text),

			fallbackCopy,

		);



		if (result !== "failure") {

			setUrlCopied(true);

			setTimeout(() => setUrlCopied(false), 2000);

		}

	};



	const handleShare = async (): Promise<void> => {

		if (!gameResult) return;



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



		const outcome = await shareOrCopyUrl(

			shareText,

			shareUrl,

			Boolean(navigator.share),

			(data) => navigator.share(data),

			(text) => navigator.clipboard.writeText(text),

		);



		if (outcome === "clipboard" || outcome === "clipboardFallback") {

			alert("Link copied to clipboard!");

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

				<div className="absolute top-4 left-4 bg-black/80 p-4 rounded-lg text-white z-50">

					<h3 className="text-lg font-bold mb-2">Debug: Prestige Levels</h3>

					<div className="grid grid-cols-5 gap-2 text-xs">

						{[

							0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 65, 70, 75, 80, 85,

							90, 95,

						].map((percentage) => {

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

						})}

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



export default ResultsPage;

