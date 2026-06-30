export interface ScoringContext {
	isHardMode: boolean;
	guessTimeLeft: number;
	isShiny: boolean;
	showHypeTrain: boolean;
	random?: () => number;
}

export interface ScoringResult {
	earnedPoints: number;
	showCriticalSuccess: boolean;
	showCriticalHit: boolean;
}

export const calculateEarnedPoints = (context: ScoringContext): ScoringResult => {
	const random = context.random ?? Math.random;

	if (!context.isHardMode) {
		return {
			earnedPoints: context.isShiny ? 5 : 1,
			showCriticalSuccess: false,
			showCriticalHit: false,
		};
	}

	if (context.isShiny) {
		return {
			earnedPoints: 5,
			showCriticalSuccess: false,
			showCriticalHit: false,
		};
	}

	let earnedPoints = 0;
	const fastTime = 10;
	const mediumTime = 5;
	const maxTime = 15;

	if (
		context.guessTimeLeft >= fastTime &&
		context.guessTimeLeft <= maxTime
	) {
		earnedPoints = 3;
	} else if (
		context.guessTimeLeft >= mediumTime &&
		context.guessTimeLeft < fastTime
	) {
		earnedPoints = 2;
	} else if (
		context.guessTimeLeft >= 0 &&
		context.guessTimeLeft < mediumTime
	) {
		earnedPoints = 1;
	}

	if (context.showHypeTrain) {
		return {
			earnedPoints,
			showCriticalSuccess: false,
			showCriticalHit: false,
		};
	}

	if (context.guessTimeLeft === 0) {
		return {
			earnedPoints: 1,
			showCriticalSuccess: true,
			showCriticalHit: false,
		};
	}

	if (random() < 0.2) {
		return {
			earnedPoints: earnedPoints + 1,
			showCriticalSuccess: false,
			showCriticalHit: true,
		};
	}

	return {
		earnedPoints,
		showCriticalSuccess: false,
		showCriticalHit: false,
	};
};
