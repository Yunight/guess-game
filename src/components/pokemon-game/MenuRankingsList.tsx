import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import {
	getRankingKey,
	getTopRankingBadgeClassName,
	isCurrentRankingPlayer,
	isTopRanking,
} from "./menuRankingsHelpers";
import type { Rankings } from "./types";

interface MenuRankingRowProps {
	rankingPlayer: Rankings;
	index: number;
	playerName: string;
	formatTimeForRanking: (seconds: number) => string;
	formatDate: (timestamp: Date) => string;
}

const MenuRankingRow = ({
	rankingPlayer,
	index,
	playerName,
	formatTimeForRanking,
	formatDate,
}: MenuRankingRowProps): ReactNode => {
	const isTop = isTopRanking(index);
	const isCurrentUser = isCurrentRankingPlayer(rankingPlayer, playerName);

	return (
		<div
			className={`grid grid-cols-12 gap-1 sm:gap-2 p-2 sm:p-3 items-center text-sm sm:text-base hover:bg-blue-50/80 transition-all duration-300 relative
				${isCurrentUser ? "bg-yellow-50/90 hover:bg-yellow-100/90" : ""}
				${isTop ? "font-semibold" : ""}`}
		>
			<div className="col-span-2 sm:col-span-1 text-gray-800 relative z-10 flex justify-center">
				{isTop ? (
					<div
						className={`
							relative w-8 h-8 rounded-full flex items-center justify-center
							${getTopRankingBadgeClassName(index)}
							shadow-lg transform hover:scale-110 transition-transform duration-200
						`}
					>
						<div className="absolute inset-0 rounded-full bg-white/20 animate-pulse-slow" />
						<span className="relative text-white font-bold text-base z-10">{index + 1}</span>
					</div>
				) : (
					<span className="text-gray-600 text-sm font-medium">#{index + 1}</span>
				)}
			</div>
			<div className="col-span-3 sm:col-span-4 truncate text-gray-800 text-sm sm:text-base pl-1 sm:pl-0">
				{isCurrentUser ? (
					<div className="flex items-center gap-2">
						<span className="text-blue-600 font-bold truncate">★ {rankingPlayer.name}</span>
						<div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping shrink-0" />
					</div>
				) : (
					<span className="hover:text-blue-600 transition-colors duration-200">
						{rankingPlayer.name}
					</span>
				)}
			</div>
			<div className="col-span-2 text-center font-mono text-gray-800 font-bold text-sm sm:text-base">
				{rankingPlayer.score}
			</div>
			<div className="col-span-2 text-center font-mono text-gray-700 text-sm sm:text-base">
				{formatTimeForRanking(rankingPlayer.time)}
			</div>
			<div className="col-span-3 text-center text-xs sm:text-sm text-gray-500">
				{formatDate(rankingPlayer.timestamp)}
			</div>
		</div>
	);
};

interface MenuRankingsListProps {
	rankings: Rankings[];
	playerName: string;
	formatTimeForRanking: (seconds: number) => string;
	formatDate: (timestamp: Date) => string;
}

export const MenuRankingsList = ({
	rankings,
	playerName,
	formatTimeForRanking,
	formatDate,
}: MenuRankingsListProps): ReactNode => {
	const { t } = useTranslation();

	return (
		<div className="divide-y divide-blue-100 h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100">
			{rankings.map((rankingPlayer, index) => (
				<MenuRankingRow
					key={getRankingKey(rankingPlayer, index)}
					rankingPlayer={rankingPlayer}
					index={index}
					playerName={playerName}
					formatTimeForRanking={formatTimeForRanking}
					formatDate={formatDate}
				/>
			))}

			{rankings.length === 0 && (
				<div className="text-center py-8 text-gray-500">{t("noRankings")}</div>
			)}
		</div>
	);
};
