const TITLE_INDEXES = [0, 1, 2, 3, 4] as const;

const TITLE_TIERS = [
	{ maxPercent: 0, tiers: ["grandmaster", "legendary"] as const },
	{ maxPercent: 5, tiers: ["champion"] as const },
	{ maxPercent: 10, tiers: ["elite"] as const },
	{ maxPercent: 15, tiers: ["master"] as const },
	{ maxPercent: 20, tiers: ["expert"] as const },
	{ maxPercent: 25, tiers: ["advanced"] as const },
	{ maxPercent: 30, tiers: ["skilled"] as const },
	{ maxPercent: 35, tiers: ["experienced"] as const },
	{ maxPercent: 40, tiers: ["intermediate"] as const },
	{ maxPercent: 45, tiers: ["novice"] as const },
	{ maxPercent: 50, tiers: ["beginner"] as const },
	{ maxPercent: 60, tiers: ["initiate"] as const },
	{ maxPercent: 65, tiers: ["junior"] as const },
	{ maxPercent: 70, tiers: ["cadet"] as const },
	{ maxPercent: 75, tiers: ["student"] as const },
	{ maxPercent: 80, tiers: ["trainee"] as const },
	{ maxPercent: 85, tiers: ["apprentice"] as const },
	{ maxPercent: 90, tiers: ["starter"] as const },
	{ maxPercent: Number.POSITIVE_INFINITY, tiers: ["starter"] as const },
] as const;

const resolveTitleTier = (percentageRemaining: number): (typeof TITLE_TIERS)[number] => {
	const tier = TITLE_TIERS.find((entry) => percentageRemaining <= entry.maxPercent);
	if (tier) {
		return tier;
	}
	return TITLE_TIERS[TITLE_TIERS.length - 1];
};

export const getAvailableTitles = (
	percentageRemaining: number,
	t: (key: string) => string,
): string[] => {
	const tier = resolveTitleTier(percentageRemaining);
	return tier.tiers.flatMap((tierName) =>
		TITLE_INDEXES.map((index) => t(`prestigeTitles.${tierName}.${index}`)),
	);
};

export const getRandomTitle = (availableTitles: string[]): string => {
	const randomIndex = Math.floor(Math.random() * availableTitles.length);
	return availableTitles[randomIndex];
};
