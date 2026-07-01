export interface ScoringContext {
	isHardMode: boolean;
	guessTimeLeft: number;
	isShiny: boolean;
	showHypeTrain: boolean;
	roundDurationSeconds?: number;
	isMultiplayer?: boolean;
	random?: () => number;
}

export interface ScoringResult {
	earnedPoints: number;
	showCriticalSuccess: boolean;
	showCriticalHit: boolean;
}

export const calculateEarnedPoints = (context: ScoringContext): ScoringResult => {
	const random = context.random ?? Math.random;
	const maxTime = context.roundDurationSeconds ?? 15;
	const guessTimeLeft = Math.min(maxTime, Math.max(0, context.guessTimeLeft));

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

	if (guessTimeLeft >= fastTime && guessTimeLeft <= maxTime) {
		earnedPoints = 3;
	} else if (guessTimeLeft >= mediumTime && guessTimeLeft < fastTime) {
		earnedPoints = 2;
	} else if (guessTimeLeft >= 0 && guessTimeLeft < mediumTime) {
		earnedPoints = 1;
	}

	if (context.showHypeTrain) {
		return {
			earnedPoints,
			showCriticalSuccess: false,
			showCriticalHit: false,
		};
	}

	if (guessTimeLeft === 0) {
		return {
			earnedPoints: 1,
			showCriticalSuccess: true,
			showCriticalHit: false,
		};
	}

	if (!context.isMultiplayer && random() < 0.2) {
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
