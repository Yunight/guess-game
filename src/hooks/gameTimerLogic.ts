export const calculateElapsedTime = (
	startTime: number | null,
	pausedTime: number,
	now: number,
): number => {
	if (startTime === null) {
		return 0;
	}

	const totalElapsed = Math.floor((now - startTime) / 1000);
	return Math.max(0, totalElapsed - pausedTime);
};

export interface VisibilityChangeInput {
	isHidden: boolean;
	now: number;
	lastVisibilityChange: number;
	startTime: number | null;
	pausedTime: number;
	isGameActive: boolean;
	hasTotalTimer: boolean;
}

export interface VisibilityChangeResult {
	pausedTime: number;
	lastVisibilityChange: number;
	shouldUpdateTotal: boolean;
	accurateElapsed: number;
}

export const resolveVisibilityChange = (
	input: VisibilityChangeInput,
): VisibilityChangeResult => {
	if (input.isHidden) {
		return {
			pausedTime: input.pausedTime,
			lastVisibilityChange: input.now,
			shouldUpdateTotal: false,
			accurateElapsed: 0,
		};
	}

	if (input.startTime === null) {
		return {
			pausedTime: input.pausedTime,
			lastVisibilityChange: input.now,
			shouldUpdateTotal: false,
			accurateElapsed: 0,
		};
	}

	const pauseDuration = Math.floor(
		(input.now - input.lastVisibilityChange) / 1000,
	);
	const pausedTime = input.pausedTime + pauseDuration;
	const accurateElapsed = calculateElapsedTime(
		input.startTime,
		pausedTime,
		input.now,
	);

	return {
		pausedTime,
		lastVisibilityChange: input.now,
		shouldUpdateTotal:
			input.isGameActive && input.hasTotalTimer && !input.isHidden,
		accurateElapsed,
	};
};

export const getInitialGuessTime = (isShiny: boolean | undefined): number =>
	isShiny ? 10 : 15;

export const shouldStartGuessTimer = (
	isGameActive: boolean,
	isHardMode: boolean,
): boolean => isGameActive && isHardMode;

export interface GuessTimerTickResult {
	timeLeft: number;
	isExpired: boolean;
}

export const tickGuessTimer = (timeLeft: number): GuessTimerTickResult => {
	const nextTimeLeft = timeLeft - 1;
	return {
		timeLeft: nextTimeLeft <= 0 ? 0 : nextTimeLeft,
		isExpired: nextTimeLeft <= 0,
	};
};
