export const removePokemonFromPool = (
	pool: readonly number[],
	pokemonId: number,
): number[] => pool.filter((id) => id !== pokemonId);

export const pickRandomFromPool = (
	pool: readonly number[],
	random: () => number = Math.random,
): number | null => {
	if (pool.length === 0) {
		return null;
	}
	const index = Math.floor(random() * pool.length);
	const picked = pool[index];
	return picked ?? null;
};

export type CorrectAnswerPoolResult =
	| { type: "game_complete" }
	| {
			type: "continue";
			nextPokemonId: number;
			remainingPool: number[];
	  };

export const resolvePoolAfterCorrectAnswer = (
	pool: readonly number[],
	answeredPokemonId: number,
	random: () => number = Math.random,
): CorrectAnswerPoolResult => {
	const poolAfterAnswer = removePokemonFromPool(pool, answeredPokemonId);

	if (poolAfterAnswer.length === 0) {
		return { type: "game_complete" };
	}

	const nextPokemonId = pickRandomFromPool(poolAfterAnswer, random);

	if (nextPokemonId === null) {
		return { type: "game_complete" };
	}

	return {
		type: "continue",
		nextPokemonId,
		remainingPool: removePokemonFromPool(poolAfterAnswer, nextPokemonId),
	};
};
