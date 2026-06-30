export const buildGenerationPokemonIds = (
	startId: number,
	endId: number,
): number[] =>
	Array.from({ length: endId - startId + 1 }, (_, index) => startId + index);

export const pickRandomPokemonId = (
	pokemonIds: readonly number[],
	random: () => number = Math.random,
): number | null => {
	if (pokemonIds.length === 0) {
		return null;
	}
	const index = Math.floor(random() * pokemonIds.length);
	return pokemonIds[index] ?? null;
};

export const generateRewardCandidates = (
	startId: number,
	endId: number,
	finalPokemonId: number,
	count = 20,
	random: () => number = Math.random,
): number[] => {
	const rewards: number[] = [];
	const maxAttempts = (endId - startId + 1) * count * 2;
	let attempts = 0;

	while (rewards.length < count && attempts < maxAttempts) {
		attempts += 1;
		const randomId = Math.floor(random() * (endId - startId + 1)) + startId;
		if (!rewards.includes(randomId) && randomId !== finalPokemonId) {
			rewards.push(randomId);
		}
	}

	rewards.push(finalPokemonId);
	return rewards;
};
