import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import {
	ArrowDown,
	ArrowRight,
	ArrowUp,
	Gamepad2,
	Hourglass,
	KeyRound,
	Keyboard,
	Lightbulb,
	Medal,
	Timer,
	Trophy,
} from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

interface GameModeDialogProps {
	isOpen: boolean;
	onClose: () => void;
	onSelectMode: (isHardMode: boolean) => void;
}

export const GameModeDialog: FC<GameModeDialogProps> = ({ isOpen, onClose, onSelectMode }) => {
	const { t } = useTranslation();

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className="sm:max-w-[600px] w-[95vw] bg-white/95 backdrop-blur-sm border-4 border-blue-500 rounded-xl shadow-2xl max-h-[90vh] overflow-y-auto overflow-x-hidden scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent">
				<DialogHeader className="relative">
					<div className="absolute -top-2 -left-2 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl animate-pulse-slow pointer-events-none" />
					<div className="absolute -top-2 -right-2 w-24 h-24 bg-red-400/20 rounded-full blur-2xl animate-pulse-slow delay-500 pointer-events-none" />
					<DialogTitle className="text-center text-2xl font-pokemon bg-gradient-to-br from-blue-500 to-purple-600 text-transparent bg-clip-text">
						{t("gameMode")}
					</DialogTitle>
					<DialogDescription className="text-center text-gray-500">
						{t("selectGameMode")}
					</DialogDescription>
				</DialogHeader>

				<div className="flex flex-col gap-4 overflow-y-auto max-h-[60vh] scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-transparent px-2">
					{/* Pro Tips Section */}
					<div className="bg-yellow-50/90 p-4 rounded-xl border-2 border-yellow-400">
						<div className="flex items-center gap-2 mb-3">
							<span className="text-yellow-600 font-bold text-lg">{t("proTipsPC")}</span>
							<div className="w-2 h-2 bg-yellow-400 rounded-full animate-pulse" />
						</div>
						<div className="space-y-3 text-sm text-gray-700">
							<div className="flex items-start gap-2">
								<Keyboard className="w-4 h-4 mt-1 text-yellow-600 shrink-0" />
								<p>{t("keyboardPlayable")}</p>
							</div>

							<div className="flex items-start gap-2">
								<div className="w-4 h-4 mt-1 shrink-0 flex items-center justify-center">
									<div className="w-2 h-2 bg-yellow-600 rounded-full" />
								</div>
								<p>{t("firstSuggestion")}</p>
							</div>

							<div className="flex items-start gap-2">
								<KeyRound className="w-4 h-4 mt-1 text-yellow-600 shrink-0" />
								<p>{t("pressEnter")}</p>
							</div>

							<div className="flex items-start gap-2">
								<ArrowRight className="w-4 h-4 mt-1 text-yellow-600 shrink-0" />
								<p>{t("pressRight")}</p>
							</div>

							<div className="flex items-start gap-2">
								<div className="shrink-0 mt-1">
									<div className="flex flex-col items-center justify-center gap-0.5 h-full">
										<ArrowUp className="w-4 h-4 text-yellow-600" />
										<ArrowDown className="w-4 h-4 text-yellow-600" />
									</div>
								</div>
								<p className="mt-2">{t("useArrows")}</p>
							</div>

							<div className="flex items-start gap-2">
								<div className="w-4 h-4 mt-1 shrink-0 flex items-center justify-center">
									<div className="w-2 h-2 bg-yellow-600 rounded-full" />
								</div>
								<p>{t("autoFocus")}</p>
							</div>
						</div>
					</div>

					{/* Game Mode Buttons */}
					<div className="flex flex-col sm:flex-row gap-2">
						<Button
							onClick={() => onSelectMode(false)}
							className="group relative h-auto p-4 sm:p-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-4 border-white hover:border-blue-300 transition-all duration-300 flex-1"
						>
							<div className="flex flex-col items-center gap-2">
								<div className="flex items-center gap-2 text-lg sm:text-xl font-bold">
									<Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
									{t("chillMode")}
								</div>
								<div className="flex flex-col items-center text-xs sm:text-sm text-blue-100 gap-1">
									<div className="flex items-center gap-1">
										<Lightbulb className="w-4 h-4" />
										<span>{t("hintsAvailable")}</span>
									</div>
									<div className="flex items-center gap-1">
										<Timer className="w-4 h-4" />
										<span>{t("noTimeLimit")}</span>
									</div>
								</div>
								<div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-white/20 rounded-full transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
							</div>
						</Button>

						<Button
							onClick={() => onSelectMode(true)}
							className="group relative h-auto p-4 sm:p-6 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-4 border-white hover:border-red-300 transition-all duration-300 flex-1"
						>
							<div className="flex flex-col items-center gap-2">
								<div className="flex items-center gap-2 text-lg sm:text-xl font-bold">
									<Gamepad2 className="w-5 h-5 sm:w-6 sm:h-6" />
									{t("tryHardMode")}
								</div>
								<div className="flex flex-col items-center text-xs sm:text-sm text-red-100 gap-1">
									<div className="flex items-center gap-1">
										<Lightbulb className="w-4 h-4" />
										<span>{t("noHints")}</span>
									</div>
									<div className="flex items-center gap-1">
										<Hourglass className="w-4 h-4" />
										<span>{t("limitedTime")}</span>
									</div>
									<div className="flex items-center gap-1">
										<Medal className="w-4 h-4" />
										<span>{t("rankedScore")}</span>
									</div>
									<div className="flex items-center gap-1">
										<Trophy className="w-4 h-4 shrink-0" />
										<span>{t("speedPoints")}</span>
									</div>
								</div>
								<div className="absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-white/20 rounded-full transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300" />
							</div>
						</Button>
					</div>
				</div>

				<div className="flex justify-center mt-4">
					<p className="text-sm text-gray-500 italic">{t("selectGameMode")}</p>
				</div>
			</DialogContent>
		</Dialog>
	);
};
