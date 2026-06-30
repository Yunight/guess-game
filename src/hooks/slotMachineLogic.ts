export const SLOT_MACHINE_MIN_SPINS = 100;
const SLOT_MACHINE_INITIAL_INTERVAL = 5;
const SLOT_MACHINE_FINAL_INTERVAL = 50;
const SLOT_MACHINE_MAX_REPEAT_ATTEMPTS = 3;

export const shouldContinueSpinning = (
	spinCount: number,
	minSpins: number = SLOT_MACHINE_MIN_SPINS,
): boolean => spinCount < minSpins;

export const calculateSpinInterval = (
	spinCount: number,
	minSpins: number = SLOT_MACHINE_MIN_SPINS,
	initialInterval: number = SLOT_MACHINE_INITIAL_INTERVAL,
	finalInterval: number = SLOT_MACHINE_FINAL_INTERVAL,
): number => {
	const progress = Math.min(spinCount / minSpins, 1);
	return initialInterval + (finalInterval - initialInterval) * progress ** 2;
};

export const pickSpinDisplayId = (
	rewards: readonly number[],
	lastDisplayedId: number | null,
	finalPokemonId: number,
	random: () => number = Math.random,
	maxAttempts: number = SLOT_MACHINE_MAX_REPEAT_ATTEMPTS,
): number => {
	if (rewards.length === 0) {
		return finalPokemonId;
	}

	if (rewards.length === 1) {
		return rewards[0] ?? finalPokemonId;
	}

	let randomIndex = Math.floor(random() * (rewards.length - 1));
	let attempts = 1;

	while (
		rewards[randomIndex] === lastDisplayedId &&
		attempts < maxAttempts
	) {
		randomIndex = Math.floor(random() * (rewards.length - 1));
		attempts++;
	}

	return rewards[randomIndex] ?? finalPokemonId;
};
