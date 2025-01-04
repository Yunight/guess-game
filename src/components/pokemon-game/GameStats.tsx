import type { FC } from "react";
import { useTranslation } from "react-i18next";

interface GameStatsProps {
	score: number;
	bestScore: number;
	guessTimeLeft: number;
	hintsLeft: number;
	formatTime: (seconds: number) => string;
	bestTime: number;
}

export const GameStats: FC<GameStatsProps> = ({
	score,
	bestScore,
	guessTimeLeft,
	hintsLeft,
	formatTime,
	bestTime,
}) => {
	const { t } = useTranslation();
	return (
		<div className="mx-2 bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-lg p-4 shadow-lg border-t-2 border-blue-500/30">
			<div className="grid grid-cols-3 gap-4">
				{/* Score */}
				<div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-3 text-center relative overflow-hidden backdrop-blur-sm border border-white/10">
					<div className="absolute inset-0 bg-blue-400/5" />
					<div className="relative z-10">
						<div className="text-xs text-blue-200 mb-1 font-medium">
							{t("score")}
						</div>
						<div className="space-y-1">
							<div
								data-testid="current-score"
								className="text-2xl font-bold text-white font-mono"
							>
								{score}
							</div>
							<div className="text-sm text-yellow-300 font-mono">
								{t("best")}: {bestScore}
							</div>
						</div>
					</div>
				</div>

				{/* Timer */}
				<div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-3 text-center relative overflow-hidden backdrop-blur-sm border border-white/10">
					<div className="absolute inset-0 bg-blue-400/5" />
					<div className="relative z-10">
						<div className="text-xs text-blue-200 mb-1 font-medium">
							{t("time")}
						</div>
						<div className="space-y-1">
							<div
								className={`text-2xl font-bold font-mono transition-colors duration-300
                ${guessTimeLeft <= 5 ? "text-red-400" : "text-white"}`}
							>
								{guessTimeLeft === Number.POSITIVE_INFINITY
									? "∞"
									: formatTime(guessTimeLeft)}
							</div>
							<div className="text-sm text-yellow-300 font-mono">
								{t("best")}: {formatTime(bestTime)}
							</div>
						</div>
					</div>
				</div>

				{/* Hints */}
				<div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-3 text-center relative overflow-hidden backdrop-blur-sm border border-white/10">
					<div className="absolute inset-0 bg-blue-400/5" />
					<div className="relative z-10">
						<div className="text-xs text-blue-200 mb-1 font-medium">
							{t("remainingHints")}
						</div>
						<div className="text-2xl font-bold text-white font-mono">
							{hintsLeft === Number.POSITIVE_INFINITY ? "∞" : hintsLeft}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
