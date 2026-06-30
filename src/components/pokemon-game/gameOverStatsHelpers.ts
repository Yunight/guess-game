export const shouldShowBestRanking = (
	bestRanking: number | null,
	bestScore: number,
	score: number,
): boolean => {
	return Boolean(bestRanking && bestScore > score);
};

export const shouldShowRankingSection = (
	userRanking: number | null,
	bestRanking: number | null,
): boolean => {
	return Boolean(userRanking || bestRanking);
};
