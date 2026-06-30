import type { FC } from "react";
import { useTranslation } from "react-i18next";

interface MultiplayerScoreBarProps {
	hostName: string;
	guestName: string;
	hostScore: number;
	guestScore: number;
	hostPlayerId: string;
	localPlayerId: string;
	roundWinnerName: string | null;
	roundPointsEarned: number;
	localPlayerWonRound: boolean;
	roundNumber: number;
	submitError: string | null;
}

export const MultiplayerScoreBar: FC<MultiplayerScoreBarProps> = ({
	hostName,
	guestName,
	hostScore,
	guestScore,
	hostPlayerId,
	localPlayerId,
	roundWinnerName,
	roundPointsEarned,
	localPlayerWonRound,
	roundNumber,
	submitError,
}) => {
	const { t } = useTranslation();

	const hostIsLocal = hostPlayerId === localPlayerId;
	const guestIsLocal = !hostIsLocal;
	const hostWonRound =
		roundWinnerName !== null && roundWinnerName === hostName;
	const guestWonRound =
		roundWinnerName !== null && roundWinnerName === guestName;

	const renderPlayerBadge = (isLocal: boolean): JSX.Element | null =>
		isLocal ? (
			<span className="ml-1 text-[10px] font-semibold uppercase text-yellow-300 bg-yellow-500/20 px-1.5 py-0.5 rounded">
				{t("you")}
			</span>
		) : null;

	return (
		<div className="mx-2 bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-lg p-4 shadow-lg border-t-2 border-blue-500/30 space-y-3">
			<div className="grid grid-cols-2 gap-3">
				<div
					className={`rounded-lg p-3 text-center border ${
						hostWonRound || (localPlayerWonRound && hostIsLocal)
							? "border-green-400 bg-green-500/20"
							: "border-white/10 bg-blue-500/10"
					}`}
				>
					<p className="text-xs text-blue-200 mb-1 truncate flex items-center justify-center">
						<span className="truncate">{hostName}</span>
						{renderPlayerBadge(hostIsLocal)}
					</p>
					<p className="text-2xl font-bold text-white font-mono">{hostScore}</p>
				</div>
				<div
					className={`rounded-lg p-3 text-center border ${
						guestWonRound || (localPlayerWonRound && guestIsLocal)
							? "border-green-400 bg-green-500/20"
							: "border-white/10 bg-purple-500/10"
					}`}
				>
					<p className="text-xs text-purple-200 mb-1 truncate flex items-center justify-center">
						<span className="truncate">{guestName}</span>
						{renderPlayerBadge(guestIsLocal)}
					</p>
					<p className="text-2xl font-bold text-white font-mono">{guestScore}</p>
				</div>
			</div>

			{submitError && (
				<div className="text-center bg-red-500/20 border border-red-400/40 rounded-lg py-2 px-3">
					<p className="text-sm text-red-200">{t(submitError)}</p>
				</div>
			)}

			{roundWinnerName && (
				<div className="text-center bg-yellow-400/20 border border-yellow-400/40 rounded-lg py-2 px-3 animate-pulse">
					<p className="text-sm font-medium text-yellow-100">
						{t("roundWonBy", {
							name: roundWinnerName,
							points: roundPointsEarned,
						})}
					</p>
				</div>
			)}

			{roundNumber <= 1 && roundWinnerName === null && roundPointsEarned === 0 && (
				<div className="text-center text-xs text-gray-400">{t("multiRaceHint")}</div>
			)}
		</div>
	);
};
