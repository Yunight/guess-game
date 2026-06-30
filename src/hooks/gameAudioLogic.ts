export const shouldPlayTrainHorn = (
	showHypeTrain: boolean,
	isMuted: boolean,
	isHardMode: boolean,
	guessTimeLeft: number,
): boolean =>
	showHypeTrain && !isMuted && (!isHardMode || guessTimeLeft > 9);

export const shouldStopTrainHorn = (
	showHypeTrain: boolean,
	guessTimeLeft: number,
): boolean => !showHypeTrain || guessTimeLeft <= 9;

export const shouldPlayLowLifeSound = (
	isHardMode: boolean,
	guessTimeLeft: number,
	isMuted: boolean,
): boolean =>
	isHardMode && guessTimeLeft <= 5 && guessTimeLeft > 0 && !isMuted;

export const shouldStopLowLifeSound = (
	isHardMode: boolean,
	guessTimeLeft: number,
): boolean => guessTimeLeft > 5 || guessTimeLeft <= 0 || !isHardMode;
