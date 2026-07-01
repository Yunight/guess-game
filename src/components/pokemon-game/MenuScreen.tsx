import { HelpCircle, Volume2, VolumeX } from "lucide-react";
import { type FC, useState } from "react";
import { useTranslation } from "react-i18next";
import { GameModeDialog } from "@/components/pokemon-game/GameModeDialog";
import { Button } from "@/components/ui/button";
import { LanguageToggle } from "@/components/ui/language-toggle";
import { getGenerationI18nKey } from "./generations";
import { HowToPlay } from "./HowToPlay";
import { MenuGenerationPicker, type MenuGenerationPickerProps } from "./MenuGenerationPicker";
import { MenuPlayerForm, type MenuPlayerFormProps } from "./MenuPlayerForm";
import { MenuRankingsList } from "./MenuRankingsList";
import type { Rankings } from "./types";

const GitHubIcon = ({ className }: { className?: string }): JSX.Element => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className}
		aria-hidden="true"
	>
		<path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12Z" />
	</svg>
);

const XIcon = ({ className }: { className?: string }): JSX.Element => (
	<svg
		xmlns="http://www.w3.org/2000/svg"
		viewBox="0 0 24 24"
		fill="currentColor"
		className={className}
		aria-hidden="true"
	>
		<path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
	</svg>
);

interface MenuAudioProps {
	isMuted: boolean;
	setIsMuted: (muted: boolean) => void;
}

interface MenuRankingsProps {
	rankings: Rankings[];
	rankingError: string | null;
	formatTimeForRanking: (seconds: number) => string;
	formatDate: (timestamp: Date) => string;
}

interface MenuScreenProps {
	player: MenuPlayerFormProps;
	generation: MenuGenerationPickerProps;
	canStartGame: boolean;
	startGame: (isHardMode: boolean) => void;
	onStartMulti: () => void;
	isCreatingMultiRoom: boolean;
	multiError: string | null;
	score: number;
	audio: MenuAudioProps;
	rankings: MenuRankingsProps;
}

export const MenuScreen: FC<MenuScreenProps> = ({
	player,
	generation,
	canStartGame,
	startGame,
	onStartMulti,
	isCreatingMultiRoom,
	multiError,
	score,
	audio,
	rankings: rankingsProps,
}) => {
	const { t } = useTranslation();
	const [showHowToPlay, setShowHowToPlay] = useState(false);
	const [showGameModeDialog, setShowGameModeDialog] = useState(false);
	const { isMuted, setIsMuted } = audio;
	const { rankings, rankingError, formatTimeForRanking, formatDate } = rankingsProps;
	const { selectedGeneration } = generation;

	const handleStartGameClick = (): void => {
		setShowGameModeDialog(true);
	};

	const handleMultiClick = (): void => {
		onStartMulti();
	};

	const handleGameModeSelect = (isHardMode: boolean): void => {
		setShowGameModeDialog(false);
		startGame(isHardMode);
	};

	return (
		<div className="w-full max-w-[1200px] px-4 sm:px-6 lg:px-8">
			<div className="text-center mb-8 relative pt-4">
				<h1 className="text-4xl sm:text-5xl md:text-6xl font-pokemon text-center relative">
					<span className="relative bg-gradient-to-br from-red-400 via-red-500 to-purple-600 text-transparent bg-clip-text drop-shadow-lg transform hover:scale-105 transition-transform duration-300">
						{t("title")}
					</span>
				</h1>
				<div className="flex justify-center gap-4 mt-6">
					<div className="w-8 h-8 rounded-full relative shadow-md">
						<div className="absolute inset-0 bg-gradient-to-b from-red-600 to-red-500 rounded-t-full h-[50%]" />
						<div className="absolute inset-0 bg-white rounded-b-full top-[50%]" />
						<div className="absolute inset-x-0 top-[46%] h-[3px] bg-gray-800" />
						<div className="absolute inset-[25%] bg-white rounded-full border-[3px] border-gray-800" />
						<div className="absolute inset-[35%] bg-white rounded-full border-2 border-gray-800" />
					</div>
					<div className="w-8 h-8 rounded-full relative shadow-md">
						<div className="absolute inset-0 bg-gradient-to-b from-blue-600 to-blue-500 rounded-t-full h-[50%]" />
						<div className="absolute inset-0 bg-white rounded-b-full top-[50%]" />
						<div className="absolute inset-x-0 top-[46%] h-[3px] bg-gray-800" />
						<div className="absolute inset-[25%] bg-white rounded-full border-[3px] border-gray-800" />
						<div className="absolute inset-[35%] bg-white rounded-full border-2 border-gray-800" />
					</div>
					<div className="w-8 h-8 rounded-full relative shadow-md">
						<div className="absolute inset-0 bg-gradient-to-b from-yellow-500 to-yellow-400 rounded-t-full h-[50%]" />
						<div className="absolute inset-0 bg-white rounded-b-full top-[50%]" />
						<div className="absolute inset-x-0 top-[46%] h-[3px] bg-gray-800" />
						<div className="absolute inset-[25%] bg-white rounded-full border-[3px] border-gray-800" />
						<div className="absolute inset-[35%] bg-white rounded-full border-2 border-gray-800" />
					</div>
				</div>
				<div className="absolute -top-4 -right-4 w-24 h-24 bg-yellow-400/20 rounded-full blur-2xl animate-pulse-slow pointer-events-none" />
				<div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl animate-pulse-slow delay-500 pointer-events-none" />
			</div>

			<div className="flex flex-col lg:flex-row justify-center items-stretch gap-6">
				<div className="w-full lg:w-[550px] bg-red-500 rounded-3xl p-6 relative min-h-[600px]">
					<div className="absolute top-4 left-4 flex gap-2">
						<div className="w-3 h-3 rounded-full bg-gray-700" />
						<div className="w-3 h-3 rounded-full bg-yellow-400" />
						<div className="w-3 h-3 rounded-full bg-green-500" />
					</div>

					<div className="absolute top-2 left-24 w-10 h-10 rounded-full bg-blue-400 border-4 border-white" />

					<div className="absolute top-4 right-4 flex items-center gap-2">
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setShowHowToPlay(true)}
							className="hover:bg-white/20 bg-white/10 text-gray-800 hover:text-gray-900 transition-colors"
						>
							<HelpCircle className="h-5 w-5" />
						</Button>
						<LanguageToggle />
						<Button
							variant="ghost"
							size="icon"
							onClick={() => setIsMuted(!isMuted)}
							className="hover:bg-white/20 bg-white/10 text-gray-800 hover:text-gray-900 transition-colors"
						>
							{isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
						</Button>
					</div>

					<div className="mt-16 space-y-8 h-[calc(100%-5rem)] flex flex-col">
						<div className="bg-white rounded-xl p-3 sm:p-4 shadow-inner space-y-3 flex-1">
							<MenuPlayerForm {...player} />
							<MenuGenerationPicker {...generation} />
						</div>

						<div className="flex flex-col sm:flex-row gap-3 mb-4">
							<Button
								variant="ghost"
								onClick={handleStartGameClick}
								disabled={!canStartGame}
								className={`flex-1 h-16 sm:h-24 text-lg sm:text-xl font-bold transition-all duration-500 ease-out relative overflow-hidden rounded-xl
                ${
									canStartGame
										? "bg-white/10 text-white shadow-xl hover:bg-white/20 transform hover:scale-[1.02] border-4 border-white hover:text-white"
										: "bg-gray-400/40 text-gray-200 border-4 border-white/40"
								}
                before:content-[""] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent
                ${canStartGame ? "before:animate-shine-slow" : ""}
              `}
							>
								<span className="text-3xl sm:text-4xl font-pokemon">
									{score > 0 ? t("replay") : t("solo")}
								</span>
							</Button>

							<Button
								variant="ghost"
								onClick={handleMultiClick}
								disabled={!canStartGame || isCreatingMultiRoom}
								className={`flex-1 h-16 sm:h-24 text-lg sm:text-xl font-bold transition-all duration-500 ease-out relative overflow-hidden rounded-xl
                ${
									canStartGame
										? "bg-purple-500/30 text-white shadow-xl hover:bg-purple-500/40 transform hover:scale-[1.02] border-4 border-white hover:text-white"
										: "bg-gray-400/40 text-gray-200 border-4 border-white/40"
								}
              `}
							>
								<span className="text-3xl sm:text-4xl font-pokemon">{t("multi")}</span>
							</Button>
						</div>
						{multiError && (
							<p className="text-sm text-yellow-100 text-center mb-2">{t(multiError)}</p>
						)}
					</div>
				</div>

				<div className="w-full lg:w-[550px] bg-red-500 rounded-3xl p-6 relative min-h-[600px]">
					<div className="bg-gray-800 rounded-xl p-4 mb-4 relative overflow-hidden">
						<div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20" />
						<div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400" />
						<div className="relative flex flex-col items-center justify-center gap-1">
							<div className="flex items-center gap-3">
								<div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-white animate-spin-slow" />
								<h2 className="text-2xl font-bold text-center text-white">{t("bestScores")}</h2>
								<div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-white animate-spin-slow" />
							</div>
							<h3 className="text-xl font-bold text-center text-white/80">
								{t(getGenerationI18nKey(selectedGeneration.startId))}
							</h3>
						</div>
					</div>

					{rankingError && (
						<p className="mb-3 text-center text-sm text-yellow-100 bg-red-700/80 rounded-lg px-3 py-2">
							{t(rankingError)}
						</p>
					)}

					<div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-inner overflow-hidden border-4 border-blue-500">
						<div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 grid grid-cols-12 gap-2 text-sm relative">
							<div className="absolute inset-0 bg-grid-pattern bg-[length:20px_20px] opacity-10" />
							<div className="col-span-1 font-bold relative">
								<span className="relative z-10">#</span>
							</div>
							<div className="col-span-4 font-bold relative">
								<span className="relative z-10">{t("trainer")}</span>
							</div>
							<div className="col-span-2 font-bold text-center relative">
								<span className="relative z-10">{t("score")}</span>
							</div>
							<div className="col-span-2 font-bold text-center relative">
								<span className="relative z-10">{t("time")}</span>
							</div>
							<div className="col-span-3 font-bold text-center hidden sm:block relative">
								<span className="relative z-10">{t("date")}</span>
							</div>
						</div>

						<MenuRankingsList
							rankings={rankings}
							playerName={player.playerName}
							formatTimeForRanking={formatTimeForRanking}
							formatDate={formatDate}
						/>
					</div>

					<div className="mt-4 flex justify-end gap-4">
						<div className="w-12 h-6 bg-gray-800 rounded-lg" />
						<div className="w-12 h-6 bg-gray-800 rounded-lg" />
					</div>
				</div>
			</div>

			<div className="mt-6 text-center text-sm text-gray-500">
				<div className="flex flex-col sm:flex-row justify-center items-center gap-4">
					<p>© 2024 Pokémon. © 1995-2024 Nintendo/Creatures Inc./GAME FREAK inc.</p>
					<div className="flex items-center gap-2">
						<span>Developed by</span>
						<a
							href="https://github.com/Yunight"
							target="_blank"
							rel="noopener noreferrer"
							className="text-blue-500 hover:text-blue-600 transition-colors"
						>
							Yunight
						</a>
						<a
							href="https://github.com/Yunight"
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-500 hover:text-gray-700 transition-colors"
						>
							<GitHubIcon className="h-5 w-5" />
						</a>
						<a
							href="https://x.com/NightOfLunaTV"
							target="_blank"
							rel="noopener noreferrer"
							className="text-gray-500 hover:text-gray-700 transition-colors"
						>
							<XIcon className="h-5 w-5" />
						</a>
						<a
							href="https://paypal.me/yunight?country.x=FR&locale.x=fr_FR"
							target="_blank"
							rel="noopener noreferrer"
							className="inline-flex items-center h-8 px-4 bg-[#FFC439] hover:bg-[#FFB700] rounded-sm shadow-sm transition-colors duration-200"
							title="Support via PayPal"
						>
							<img
								src="https://www.paypalobjects.com/paypal-ui/logos/svg/paypal-color.svg"
								alt="PayPal"
								className="h-5"
							/>
						</a>
					</div>
				</div>
			</div>

			<HowToPlay isOpen={showHowToPlay} onClose={() => setShowHowToPlay(false)} />
			<GameModeDialog
				isOpen={showGameModeDialog}
				onClose={() => setShowGameModeDialog(false)}
				onSelectMode={handleGameModeSelect}
			/>
		</div>
	);
};
