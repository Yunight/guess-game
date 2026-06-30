export const STORAGE_LIMITS = {
	MAX_RESULTS_PER_DAY: 1000,
	MAX_VIEWS_PER_RESULT: 10000,
	CLEANUP_BATCH_SIZE: 50,
	MAX_USER_RESULTS_PER_DAY: 20,
} as const;

export interface GameResultInput {
	playerName: string;
	score: number;
	remainingPokemonCount: number;
	userRanking: number | null;
}

export class GameResultValidationError extends Error {
	constructor(message: string) {
		super(message);
		this.name = "GameResultValidationError";
	}
}

export const validateGameResultInput = (
	input: GameResultInput,
): void => {
	if (!input.playerName || input.playerName.trim().length === 0) {
		throw new GameResultValidationError("Invalid player name");
	}

	if (input.playerName.length > 50) {
		throw new GameResultValidationError("Invalid player name");
	}

	if (input.score < 0 || input.score > 10000) {
		throw new GameResultValidationError("Invalid score range");
	}
};

export const isExceptionalScore = (input: GameResultInput): boolean =>
	input.score >= 1000 ||
	input.remainingPokemonCount === 0 ||
	(input.userRanking !== null && input.userRanking <= 10);

export const getResultExpirationDays = (input: GameResultInput): number =>
	isExceptionalScore(input) ? 90 : 30;

export const buildExpirationDate = (
	input: GameResultInput,
	now: Date = new Date(),
): Date => {
	const expirationDate = new Date(now);
	expirationDate.setDate(
		expirationDate.getDate() + getResultExpirationDays(input),
	);
	return expirationDate;
};

export const countSavesToday = (
	timestampsMs: readonly number[],
	nowMs: number = Date.now(),
): number => {
	const startOfDay = new Date(nowMs);
	startOfDay.setHours(0, 0, 0, 0);
	const startMs = startOfDay.getTime();
	return timestampsMs.filter((timestamp) => timestamp >= startMs).length;
};

export const isDailyUserLimitReached = (
	timestampsMs: readonly number[],
	maxPerDay: number = STORAGE_LIMITS.MAX_USER_RESULTS_PER_DAY,
	nowMs: number = Date.now(),
): boolean => countSavesToday(timestampsMs, nowMs) >= maxPerDay;

export const isDailyGlobalLimitReached = (
	timestampsMs: readonly number[],
	maxPerDay: number = STORAGE_LIMITS.MAX_RESULTS_PER_DAY,
	nowMs: number = Date.now(),
): boolean => countSavesToday(timestampsMs, nowMs) >= maxPerDay;

export const extractTimestampMs = (value: unknown): number | null => {
	if (value instanceof Date) {
		return value.getTime();
	}

	if (
		typeof value === "object" &&
		value !== null &&
		"toDate" in value &&
		typeof value.toDate === "function"
	) {
		const date = value.toDate();
		if (date instanceof Date) {
			return date.getTime();
		}
	}

	if (typeof value === "number") {
		return value;
	}

	return null;
};
