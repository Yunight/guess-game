import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { ScrollableDialog } from "@/components/ui/scrollable-dialog";
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
import { useCallback, useEffect, useState } from "react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { gameResultsService } from "../../services/gameResultsService";
import { RewardPokemonDisplay } from "./RewardPokemonDisplay";
import type { Pokemon } from "./types";

interface GameOverDialogProps {
	gameOver: boolean;
	setGameOver: (open: boolean) => void;
	playerName: string;
	score: number;
	bestScore: number;
	bestTime: number;
	userRanking: number | null;
	bestRanking: number | null;
	totalTimeElapsed: number;
	formatTimeForRanking: (seconds: number) => string;
	rewardPokemon: { pokemon: Pokemon | undefined; isLoading: boolean };
	remainingPokemon: number[];
	handleRestart: () => void;
	handleBackToMenu: () => void;
	isMuted: boolean;
	criticalHitCount: number;
	criticalSuccessCount: number;
	hyperTrainCount: number;
	maxHypeChain: number;
	selectedGeneration: { name: string; startId: number; endId: number };
	isSlotMachineRunning: boolean;
	spinningPokemon: Pokemon | undefined;
}

const getCachedCryUrl = async (
	pokemonId: number,
): Promise<{ latest: string; legacy: string }> => {
	const POKEAPI_CACHE_KEY = "pokeApiCryCache";
	const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

	try {
		// Check cache first
		const cachedData = localStorage.getItem(POKEAPI_CACHE_KEY);
		if (cachedData) {
			const cache = JSON.parse(cachedData);
			if (
				cache[pokemonId] &&
				Date.now() - cache[pokemonId].timestamp < CACHE_DURATION
			) {
				console.log("📦 Using cached cry URL for Pokemon:", pokemonId);
				return cache[pokemonId].cries;
			}
		}

		// If not in cache, fetch from PokeAPI
		console.log("🔄 Fetching cry from PokeAPI for Pokemon:", pokemonId);
		const response = await fetch(
			`https://pokeapi.co/api/v2/pokemon/${pokemonId}`,
		);
		if (!response.ok) throw new Error("Failed to fetch Pokemon cry");

		const data = await response.json();
		const cries = data.cries as { latest: string; legacy: string };

		// Update cache
		const newCache = cachedData ? JSON.parse(cachedData) : {};
		newCache[pokemonId] = {
			timestamp: Date.now(),
			cries,
		};
		localStorage.setItem(POKEAPI_CACHE_KEY, JSON.stringify(newCache));
		console.log("💾 Cry URL cached successfully");

		return cries;
	} catch (error) {
		console.error("Error fetching cry URL:", error);
		throw error;
	}
};

// Helper function to format time in mm:ss format
const formatTime = (timeInSeconds: number): string => {
	// Ensure we have a valid number
	if (typeof timeInSeconds !== "number" || Number.isNaN(timeInSeconds)) {
		return "0:00";
	}

	const minutes = Math.floor(timeInSeconds / 60);
	const seconds = Math.floor(timeInSeconds % 60);

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

export const GameOverDialog: FC<GameOverDialogProps> = ({
	gameOver,
	setGameOver,
	playerName,
	score,
	bestScore,
	bestTime,
	userRanking,
	bestRanking,
	totalTimeElapsed,
	formatTimeForRanking,
	rewardPokemon,
	remainingPokemon,
	handleRestart,
	handleBackToMenu,
	isMuted,
	criticalHitCount,
	criticalSuccessCount,
	hyperTrainCount,
	maxHypeChain,
	selectedGeneration,
	isSlotMachineRunning,
	spinningPokemon,
}) => {
	const { t, i18n } = useTranslation();
	const [lastPlayedId, setLastPlayedId] = useState<number | null>(null);
	const [finalTime, setFinalTime] = useState(0);
	const [shareableUrl, setShareableUrl] = useState<string | null>(null);
	const [isSavingResult, setIsSavingResult] = useState(false);
	const [urlCopied, setUrlCopied] = useState(false);

	// Update finalTime when game ends
	useEffect(() => {
		if (gameOver && totalTimeElapsed > 0) {
			console.log("Storing final time:", totalTimeElapsed);
			setFinalTime(totalTimeElapsed);
		}
	}, [gameOver, totalTimeElapsed]);

	// Save game result when game ends
	useEffect(() => {
		const saveGameResult = async () => {
			if (
				gameOver &&
				!shareableUrl &&
				!isSavingResult &&
				rewardPokemon.pokemon
			) {
				setIsSavingResult(true);
				try {
					const resultData = {
						playerName,
						score,
						totalTimeElapsed: finalTime > 0 ? finalTime : totalTimeElapsed,
						userRanking,
						selectedGeneration,
						rewardPokemon: rewardPokemon.pokemon,
						remainingPokemon,
						criticalHitCount,
						criticalSuccessCount,
						hyperTrainCount,
						maxHypeChain,
					};

					const resultId = await gameResultsService.saveGameResult(resultData);
					const url = gameResultsService.generateShareableUrl(resultId);
					setShareableUrl(url);
					console.log("Game result saved! Shareable URL:", url);
				} catch (error) {
					console.error("Failed to save game result:", error);
				} finally {
					setIsSavingResult(false);
				}
			}
		};

		saveGameResult();
	}, [
		gameOver,
		shareableUrl,
		isSavingResult,
		rewardPokemon.pokemon,
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

	// Use finalTime for display if available, otherwise use totalTimeElapsed
	const displayTime = finalTime > 0 ? finalTime : totalTimeElapsed;

	// Copy URL function
	const copyUrl = async () => {
		if (!shareableUrl) return;

		try {
			await navigator.clipboard.writeText(shareableUrl);
			setUrlCopied(true);
			setTimeout(() => setUrlCopied(false), 2000); // Reset after 2 seconds
		} catch (error) {
			console.error("Failed to copy URL:", error);
			// Fallback: select text for manual copy
			const textArea = document.createElement("textarea");
			textArea.value = shareableUrl;
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

	const playPokemonCry = useCallback(
		async (pokemonId: number) => {
			if (pokemonId === lastPlayedId) {
				console.log(
					"⏭️ Skip playing cry - same Pokémon as last time:",
					lastPlayedId,
				);
				return;
			}

			if (isMuted) {
				console.log(
					"🔇 Audio is muted, setting last played ID without playing",
				);
				setLastPlayedId(pokemonId);
				return;
			}

			try {
				// Get cry URL from cache or PokeAPI
				const cries = await getCachedCryUrl(pokemonId);
				const [latestCry, legacyCry] = [cries.latest, cries.legacy];

				console.log("🔊 Playing cry URL:", latestCry);
				const cryAudio = new Audio(latestCry || legacyCry);
				let hasError = false;

				// Add event listeners for debugging
				cryAudio.addEventListener("loadstart", () =>
					console.log("🎵 Started loading audio"),
				);
				cryAudio.addEventListener("canplay", () =>
					console.log("✅ Audio can start playing"),
				);
				cryAudio.addEventListener("loadeddata", () =>
					console.log("✅ Audio data loaded successfully"),
				);
				cryAudio.addEventListener("error", (e) => {
					hasError = true;
					const audio = e.currentTarget as HTMLAudioElement;
					console.error("❌ Audio loading error:", {
						src: audio.src,
						networkState: audio.networkState,
						readyState: audio.readyState,
						error: audio.error
							? {
									code: audio.error.code,
									message: audio.error.message,
								}
							: null,
					});
				});

				console.log("⏳ Attempting to play audio...");
				await cryAudio.play();

				// Only set lastPlayedId if there was no error
				if (!hasError) {
					setLastPlayedId(pokemonId);
					console.log("✅ Reward Pokemon cry played successfully");
				} else {
					console.log("❌ Not setting lastPlayedId due to error");
				}
			} catch (err) {
				const error = err as Error;
				console.error("❌ Error playing reward Pokemon cry:", {
					name: error.name,
					message: error.message,
					stack: error.stack,
					type: Object.prototype.toString.call(error),
				});
				// Don't set lastPlayedId on error
				console.log("❌ Not setting lastPlayedId due to error");
			}
		},
		[lastPlayedId, isMuted],
	);

	// Effect to play reward Pokemon cry
	useEffect(() => {
		// Reset last played ID when slot machine starts
		if (isSlotMachineRunning) {
			setLastPlayedId(null);
			return;
		}

		// Don't play if basic conditions aren't met
		if (
			!gameOver ||
			isMuted ||
			!rewardPokemon.pokemon ||
			rewardPokemon.isLoading
		) {
			return;
		}

		// Add a delay to ensure the slot machine has completely finished
		const timeoutId = setTimeout(() => {
			const pokemonId = rewardPokemon.pokemon?.id;
			if (!pokemonId) return;

			console.log("🎵 Attempting to play reward Pokemon cry:", {
				pokemonId,
				pokemonName: rewardPokemon.pokemon?.englishName,
				frenchName: rewardPokemon.pokemon?.frenchName,
			});

			playPokemonCry(pokemonId);
		}, 500); // Delay to ensure everything has settled

		return () => clearTimeout(timeoutId);
	}, [
		gameOver,
		isMuted,
		rewardPokemon.pokemon,
		rewardPokemon.isLoading,
		isSlotMachineRunning,
		playPokemonCry,
	]);

	const handleShare = async () => {
		const getClickbaitMessage = () => {
			// Get generation name in correct language
			const genNumber = selectedGeneration.name.match(/\d+/)?.[0] || "1";
			const genName =
				i18n.language === "fr"
					? `${genNumber}ère Génération`
					: `Generation ${genNumber}`;

			if (remainingPokemon.length === 0) {
				return t("shareMsgAllPokemon", { gen: genName });
			}

			if (score >= 2500) {
				return t("shareMsg2500", { gen: genName });
			}
			if (score >= 2250) {
				return t("shareMsg2250", { gen: genName });
			}
			if (score >= 2000) {
				return t("shareMsg2000", { gen: genName });
			}
			if (score >= 1800) {
				return t("shareMsg1800", { gen: genName });
			}
			if (score >= 1600) {
				return t("shareMsg1600", { gen: genName });
			}
			if (score >= 1500) {
				return t("shareMsg1500", { gen: genName });
			}
			if (score >= 1400) {
				return t("shareMsg1400", { gen: genName });
			}
			if (score >= 1300) {
				return t("shareMsg1300", { gen: genName });
			}
			if (score >= 1200) {
				return t("shareMsg1200", { gen: genName });
			}
			if (score >= 1100) {
				return t("shareMsg1100", { gen: genName });
			}
			if (score >= 1000) {
				return t("shareMsg1000", { gen: genName });
			}
			if (score >= 900) {
				return t("shareMsg900", { gen: genName });
			}
			if (score >= 800) {
				return t("shareMsg800", { gen: genName });
			}
			if (score >= 750) {
				return t("shareMsg750", { gen: genName });
			}
			if (score >= 700) {
				return t("shareMsg700", { gen: genName });
			}
			if (score >= 600) {
				return t("shareMsg600", { gen: genName });
			}
			if (score >= 500) {
				return t("shareMsg500", { gen: genName });
			}
			if (score >= 450) {
				return t("shareMsg450", { gen: genName });
			}
			if (score >= 400) {
				return t("shareMsg400", { gen: genName });
			}
			if (score >= 350) {
				return t("shareMsg350", { gen: genName });
			}
			if (score >= 300) {
				return t("shareMsg300", { gen: genName });
			}
			if (score >= 250) {
				return t("shareMsg250", { gen: genName });
			}
			if (score >= 200) {
				return t("shareMsg200", { gen: genName });
			}
			if (score >= 150) {
				return t("shareMsg150", { gen: genName });
			}
			if (score >= 100) {
				return t("shareMsg100", { gen: genName });
			}
			if (score >= 75) {
				return t("shareMsg75", { gen: genName });
			}
			if (score >= 50) {
				return t("shareMsg50", { gen: genName });
			}
			if (userRanking === 1) {
				return t("shareMsgChampion", { gen: genName });
			}
			if (userRanking && userRanking <= 3) {
				return t("shareMsgTop3", { gen: genName });
			}
			if (userRanking && userRanking <= 10) {
				return t("shareMsgTop10", { gen: genName });
			}
			if (maxHypeChain >= 10) {
				return t("shareMsgHypeLegend", { gen: genName, count: maxHypeChain });
			}
			if (maxHypeChain >= 5) {
				return t("shareMsgHype", { gen: genName, count: maxHypeChain });
			}
			if (criticalHitCount >= 3) {
				return t("shareMsgCriticalHit", { gen: genName });
			}
			if (criticalSuccessCount >= 2) {
				return t("shareMsgCriticalSuccess", { gen: genName });
			}
			if (hyperTrainCount >= 3) {
				return t("shareMsgHypeTrain", { gen: genName });
			}
			if (rewardPokemon.pokemon?.isLegendary) {
				return t("shareMsgLegendary", {
					gen: genName,
					pokemon: rewardPokemon.pokemon.frenchName,
				});
			}
			if (rewardPokemon.pokemon?.isMythical) {
				return t("shareMsgMythical", {
					gen: genName,
					pokemon: rewardPokemon.pokemon.frenchName,
				});
			}
			return t("shareMsgDefault", { gen: genName });
		};

		const clickbaitMsg = getClickbaitMessage();
		// Get generation name in correct language for the share text
		const genNumber = selectedGeneration.name.match(/\d+/)?.[0] || "1";
		const genName =
			i18n.language === "fr"
				? `${genNumber}ère Génération`
				: `Generation ${genNumber}`;

		const shinyText = rewardPokemon.pokemon?.isShiny
			? i18n.language === "fr"
				? "✨ CHROMATIQUE ✨"
				: "✨ SHINY ✨"
			: "";
		const pokemonName =
			i18n.language === "fr"
				? rewardPokemon.pokemon?.frenchName
					? rewardPokemon.pokemon.frenchName.charAt(0).toUpperCase() +
						rewardPokemon.pokemon.frenchName.slice(1)
					: ""
				: rewardPokemon.pokemon?.englishName
					? rewardPokemon.pokemon.englishName.charAt(0).toUpperCase() +
						rewardPokemon.pokemon.englishName.slice(1)
					: "";

		// Use shareable URL if available, otherwise fallback to main site
		const urlToShare =
			shareableUrl || "https://pokemon-guesser-game.vercel.app/";

		const shareText = `${clickbaitMsg}

👤 ${playerName}
🎯 ${t("score")}: ${score}
⏱️ ${t("time")}: ${formatTimeForRanking(totalTimeElapsed)}
🌐 ${genName}
${userRanking ? `👑 ${t("myRank")} # ${userRanking}!` : ""}
${rewardPokemon.pokemon ? `✨ ${i18n.language === "fr" ? "Je suis un" : "I am"} ${pokemonName} ${shinyText}!` : ""}

${shareableUrl ? `${t("viewMyResult")} ${urlToShare}` : urlToShare}

#PokemonGuesserGame #Pokemon #Yunight #Gaming`;

		try {
			if (navigator.share) {
				await navigator.share({
					text: shareText,
					url: urlToShare,
				});
			} else {
				// Fallback to Twitter
				const twitterText = encodeURIComponent(shareText);
				const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}`;
				window.open(twitterUrl, "_blank");
			}
		} catch (error) {
			console.error("Error sharing:", error);
			// Fallback to Twitter if share fails
			const twitterText = encodeURIComponent(shareText);
			const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}`;
			window.open(twitterUrl, "_blank");
		}
	};

	return (
		<Dialog open={gameOver} onOpenChange={setGameOver}>
			<ScrollableDialog
				className={`sm:max-w-md ${remainingPokemon.length === 0 ? "bg-gradient-to-b from-yellow-500 to-yellow-600" : "bg-gradient-to-b from-red-500 to-red-600"} border-none text-white`}
			>
				<div className="absolute inset-0 bg-[url('/pokeball-pattern.png')] opacity-5 bg-repeat" />
				<div className="relative">
					<DialogHeader className="space-y-4">
						<div className="flex justify-center -mt-5">
							<div className="bg-white p-4 rounded-full shadow-xl relative overflow-visible">
								{remainingPokemon.length === 0 && (
									<>
										{/* Outer spinning fireworks */}
										<div className="absolute inset-[-150%] animate-spin-slow">
											{[...Array(12)].map((_, i) => (
												<div
													key={`firework-outer-${selectedGeneration.name}-${i}`}
													className="absolute w-1 h-10 bg-gradient-to-t from-yellow-500 to-yellow-200 rounded-full"
													style={{
														top: "50%",
														left: "50%",
														transform: `rotate(${i * 30}deg)`,
														transformOrigin: "0 0",
														animation: "firework 2s ease-in-out infinite",
														animationDelay: `${i * 0.2}s`,
													}}
												/>
											))}
										</div>
										{/* Middle spinning stars */}
										<div className="absolute inset-[-120%] animate-spin-slow-reverse">
											{[...Array(8)].map((_, i) => (
												<div
													key={`star-middle-${selectedGeneration.name}-${i}`}
													className="absolute w-1 h-8 bg-gradient-to-t from-blue-500 to-blue-200 rounded-full"
													style={{
														top: "50%",
														left: "50%",
														transform: `rotate(${i * 45 + 22.5}deg)`,
														transformOrigin: "0 0",
														animation: "firework 3s ease-in-out infinite",
														animationDelay: `${i * 0.3}s`,
													}}
												/>
											))}
										</div>
										{/* Inner spinning sparkles */}
										<div className="absolute inset-[-80%] animate-spin-slow">
											{[...Array(6)].map((_, i) => (
												<div
													key={`sparkle-inner-${selectedGeneration.name}-${i}`}
													className="absolute w-1.5 h-6 bg-gradient-to-t from-white to-yellow-100 rounded-full"
													style={{
														top: "50%",
														left: "50%",
														transform: `rotate(${i * 60}deg)`,
														transformOrigin: "0 0",
														animation: "firework 1.5s ease-in-out infinite",
														animationDelay: `${i * 0.4}s`,
													}}
												/>
											))}
										</div>
									</>
								)}
								{/* Master Ball with glow effect - Always shown */}
								<div
									className={`relative h-12 w-12 ${remainingPokemon.length === 0 ? "animate-bounce" : "animate-pulse"}`}
								>
									{/* Purple glow effect */}
									<div className="absolute inset-[-25%] bg-purple-400/30 rounded-full blur-md" />

									{/* Ball body - white base */}
									<div className="absolute inset-0 bg-white rounded-full shadow-lg border border-gray-200" />

									{/* Purple top half */}
									<div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-purple-500 to-purple-600 rounded-t-full" />

									{/* Black middle band */}
									<div className="absolute top-[45%] left-0 right-0 h-[10%] bg-black shadow-sm" />

									{/* Center button - silver with M */}
									<div className="absolute top-[37%] left-[37%] w-[26%] h-[26%] bg-gradient-to-b from-gray-300 to-gray-500 rounded-full border-2 border-black shadow-inner flex items-center justify-center">
										<span className="text-black font-bold text-xs leading-none">
											M
										</span>
									</div>

									{/* Button highlight */}
									<div className="absolute top-[39%] left-[39%] w-[22%] h-[22%] bg-white/40 rounded-full" />

									{/* Shine effect on ball */}
									<div className="absolute top-[15%] left-[25%] w-[20%] h-[20%] bg-white/50 rounded-full blur-sm" />
								</div>
							</div>
						</div>
						<DialogTitle className="text-2xl font-bold text-center">
							{remainingPokemon.length === 0 ? (
								<div className="space-y-2">
									<div className="text-3xl font-extrabold text-yellow-100 animate-pulse">
										{i18n.language === "fr"
											? "MAÎTRE POKÉMON LÉGENDAIRE!"
											: "LEGENDARY POKÉMON MASTER!"}
									</div>
									<div className="text-lg font-medium text-yellow-200">
										{i18n.language === "fr"
											? "Génération Complétée!"
											: "Generation Completed!"}
									</div>
								</div>
							) : (
								t("gameOver")
							)}
						</DialogTitle>
						<DialogDescription className="text-center text-gray-200">
							{remainingPokemon.length === 0 ? (
								<div className="space-y-2">
									<p className="text-yellow-100">
										{t("congratulations", { name: playerName })}
									</p>
									<p className="text-yellow-200">
										{t("congratsAllPokemon", {
											region: selectedGeneration.name,
										})}
									</p>
								</div>
							) : (
								t("gameOverDesc")
							)}
						</DialogDescription>
					</DialogHeader>

					<div className="mt-6 space-y-6">
						<RewardPokemonDisplay
							pokemon={rewardPokemon.pokemon}
							isLoading={rewardPokemon.isLoading}
							selectedGeneration={selectedGeneration}
							isSlotMachineRunning={isSlotMachineRunning}
							spinningPokemon={spinningPokemon}
						/>

						<div className="grid grid-cols-2 gap-4">
							<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
								<div className="flex items-center gap-2 text-yellow-300">
									<Trophy className="h-5 w-5" />
									<p className="text-sm font-medium">{t("score")}</p>
								</div>
								<div className="space-y-1">
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-200">
											{t("current")}:
										</span>
										<p className="text-lg font-bold">{score}</p>
									</div>
									{bestScore > 0 && (
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-200">
												{t("best")}:
											</span>
											<p className="text-lg font-bold text-yellow-300">
												{bestScore}
											</p>
										</div>
									)}
								</div>
							</div>

							<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
								<div className="flex items-center gap-2 text-yellow-300">
									<Clock className="h-5 w-5" />
									<p className="text-sm font-medium">{t("time")}</p>
								</div>
								<div className="space-y-1">
									<div className="flex items-center justify-between">
										<span className="text-sm text-gray-200">
											{t("current")}:
										</span>
										<p className="text-lg font-bold">
											{formatTime(displayTime)}
										</p>
									</div>
									{bestTime > 0 && (
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-200">
												{t("best")}:
											</span>
											<p className="text-lg font-bold text-yellow-300">
												{formatTime(bestTime)}
											</p>
										</div>
									)}
								</div>
							</div>

							{(userRanking || bestRanking) && (
								<div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
									<div className="flex items-center gap-2 text-yellow-300">
										<Crown className="h-5 w-5" />
										<p className="text-sm font-medium">{t("ranking")}</p>
									</div>
									<div className="space-y-1">
										{userRanking && (
											<div className="flex items-center justify-between">
												<span className="text-sm text-gray-200">
													{t("current")}:
												</span>
												<p className="text-2xl font-bold">#{userRanking}</p>
											</div>
										)}
										{bestRanking && bestScore > score && (
											<div className="flex items-center justify-between">
												<span className="text-sm text-gray-200">
													{t("best")}:
												</span>
												<p className="text-lg font-bold text-yellow-300">
													#{bestRanking}
												</p>
											</div>
										)}
									</div>
								</div>
							)}

							{/* Game Stats */}
							<div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
								<div className="flex items-center gap-2 text-yellow-300">
									<Trophy className="h-5 w-5" />
									<p className="text-sm font-medium">{t("statistics")}</p>
								</div>
								<div className="grid grid-cols-2 gap-3">
									<div className="space-y-1">
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-200">
												{t("criticalHits")}:
											</span>
											<p className="text-lg font-bold text-yellow-300">
												{criticalHitCount}
											</p>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-200">
												{t("criticalSuccesses")}:
											</span>
											<p className="text-lg font-bold text-yellow-300">
												{criticalSuccessCount}
											</p>
										</div>
									</div>
									<div className="space-y-1">
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-200">
												{t("hypeTrain_stat")}:
											</span>
											<p className="text-lg font-bold text-yellow-300">
												{hyperTrainCount}
											</p>
										</div>
										<div className="flex items-center justify-between">
											<span className="text-sm text-gray-200">
												{t("maxHype")}:
											</span>
											<p className="text-lg font-bold text-yellow-300">
												{maxHypeChain}
											</p>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>

					{/* Shareable URL Display */}
					{shareableUrl && (
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
									{shareableUrl}
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

					<div className="grid grid-cols-3 gap-3 mt-6">
						<Button
							onClick={handleRestart}
							className={`${
								remainingPokemon.length === 0
									? "bg-yellow-400 hover:bg-yellow-500"
									: "bg-yellow-400 hover:bg-yellow-500"
							} text-gray-900 border-none shadow-lg hover:shadow-xl transition-all duration-300 font-bold`}
							size="lg"
						>
							<RefreshCcw className="mr-2 h-4 w-4" />
							{t("replay_button")}
						</Button>
						<Button
							onClick={handleShare}
							className={`${
								remainingPokemon.length === 0
									? "bg-green-400 hover:bg-green-500"
									: "bg-green-500 hover:bg-green-600"
							} text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 font-bold`}
							size="lg"
							disabled={isSavingResult}
						>
							<Share2 className="mr-2 h-4 w-4" />
							{isSavingResult ? t("saving") : t("share")}
						</Button>
						<Button
							onClick={handleBackToMenu}
							className={`${
								remainingPokemon.length === 0
									? "bg-blue-400 hover:bg-blue-500"
									: "bg-blue-500 hover:bg-blue-600"
							} text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 font-bold`}
							size="lg"
						>
							<Home className="mr-2 h-4 w-4" />
							{t("menu")}
						</Button>
					</div>
				</div>
			</ScrollableDialog>
		</Dialog>
	);
};
