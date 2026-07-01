import { Clock, Crown, Trophy } from "lucide-react";

import { useTranslation } from "react-i18next";

import { formatGameOverTime } from "./gameOverDialogMessages";

import { shouldShowBestRanking, shouldShowRankingSection } from "./gameOverStatsHelpers";

interface GameOverStatsProps {
	score: number;

	bestScore: number;

	displayTime: number;

	bestTime: number;

	userRanking: number | null;

	bestRanking: number | null;

	criticalHitCount: number;

	criticalSuccessCount: number;

	hyperTrainCount: number;

	maxHypeChain: number;
}

export const GameOverStats = ({
	score,

	bestScore,

	displayTime,

	bestTime,

	userRanking,

	bestRanking,

	criticalHitCount,

	criticalSuccessCount,

	hyperTrainCount,

	maxHypeChain,
}: GameOverStatsProps): JSX.Element => {
	const { t } = useTranslation();

	const showRanking = shouldShowRankingSection(userRanking, bestRanking);

	const showBestRanking = shouldShowBestRanking(bestRanking, bestScore, score);

	return (
		<div className="grid grid-cols-2 gap-4">
			<div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
				<div className="flex items-center gap-2 text-yellow-300">
					<Trophy className="h-5 w-5" />
					<p className="text-sm font-medium">{t("score")}</p>
				</div>
				<div className="space-y-1">
					<div className="flex items-center justify-between">
						<span className="text-sm text-gray-200">{t("current")}:</span>
						<p className="text-lg font-bold">{score}</p>
					</div>
					{bestScore > 0 && (
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-200">{t("best")}:</span>
							<p className="text-lg font-bold text-yellow-300">{bestScore}</p>
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
						<span className="text-sm text-gray-200">{t("current")}:</span>
						<p className="text-lg font-bold">{formatGameOverTime(displayTime)}</p>
					</div>
					{bestTime > 0 && (
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-200">{t("best")}:</span>
							<p className="text-lg font-bold text-yellow-300">{formatGameOverTime(bestTime)}</p>
						</div>
					)}
				</div>
			</div>

			{showRanking && (
				<div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
					<div className="flex items-center gap-2 text-yellow-300">
						<Crown className="h-5 w-5" />
						<p className="text-sm font-medium">{t("ranking")}</p>
					</div>
					<div className="space-y-1">
						{userRanking && (
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-200">{t("current")}:</span>
								<p className="text-2xl font-bold">#{userRanking}</p>
							</div>
						)}
						{showBestRanking && bestRanking && (
							<div className="flex items-center justify-between">
								<span className="text-sm text-gray-200">{t("best")}:</span>
								<p className="text-lg font-bold text-yellow-300">#{bestRanking}</p>
							</div>
						)}
					</div>
				</div>
			)}

			<div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
				<div className="flex items-center gap-2 text-yellow-300">
					<Trophy className="h-5 w-5" />
					<p className="text-sm font-medium">{t("statistics")}</p>
				</div>
				<div className="grid grid-cols-2 gap-3">
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-200">{t("criticalHits")}:</span>
							<p className="text-lg font-bold text-yellow-300">{criticalHitCount}</p>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-200">{t("criticalSuccesses")}:</span>
							<p className="text-lg font-bold text-yellow-300">{criticalSuccessCount}</p>
						</div>
					</div>
					<div className="space-y-1">
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-200">{t("hypeTrain_stat")}:</span>
							<p className="text-lg font-bold text-yellow-300">{hyperTrainCount}</p>
						</div>
						<div className="flex items-center justify-between">
							<span className="text-sm text-gray-200">{t("maxHype")}:</span>
							<p className="text-lg font-bold text-yellow-300">{maxHypeChain}</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
