import { auth } from "../../firebase";
import type { Rankings } from "./types";

export const getRankingKey = (player: Rankings, index: number): string =>
	`${player.uid || player.name}-${player.score}-${player.timestamp.getTime()}-${index}`;

export const isCurrentRankingPlayer = (
	player: Rankings,
	playerName: string,
): boolean => {
	if (auth.currentUser) {
		return player.uid === auth.currentUser.uid;
	}
	return player.name === playerName;
};

export const getTopRankingBadgeClassName = (index: number): string => {
	if (index === 0) {
		return "bg-gradient-to-br from-yellow-300 to-yellow-500";
	}
	if (index === 1) {
		return "bg-gradient-to-br from-gray-300 to-gray-500";
	}
	return "bg-gradient-to-br from-orange-300 to-orange-700";
};

export const isTopRanking = (index: number): boolean => {
	return index < 3;
};
