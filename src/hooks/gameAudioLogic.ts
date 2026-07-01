export const shouldPlayTrainHorn = (
	showHypeTrain: boolean,
	isMuted: boolean,
	isHardMode: boolean,
	guessTimeLeft: number,
): boolean => showHypeTrain && !isMuted && (!isHardMode || guessTimeLeft > 9);

export const shouldStopTrainHorn = (showHypeTrain: boolean, guessTimeLeft: number): boolean =>
	!showHypeTrain || guessTimeLeft <= 9;

export const shouldPlayLowLifeSound = (
	isHardMode: boolean,
	guessTimeLeft: number,
	isMuted: boolean,
): boolean => isHardMode && guessTimeLeft <= 5 && guessTimeLeft > 0 && !isMuted;

export const shouldStopLowLifeSound = (isHardMode: boolean, guessTimeLeft: number): boolean =>
	guessTimeLeft > 5 || guessTimeLeft <= 0 || !isHardMode;

export interface AmbientAudioRefs {
	trainHorn: HTMLAudioElement | null;
	lowLife: HTMLAudioElement | null;
}

export const syncAmbientGameAudio = (
	showHypeTrain: boolean,
	isMuted: boolean,
	isHardMode: boolean,
	guessTimeLeft: number,
	refs: AmbientAudioRefs,
): void => {
	if (shouldPlayTrainHorn(showHypeTrain, isMuted, isHardMode, guessTimeLeft) && refs.trainHorn) {
		if (refs.trainHorn.paused) {
			refs.trainHorn.loop = true;
			refs.trainHorn.play().catch((error) => {
				console.error("Error playing train horn:", error);
			});
		}
	} else if (shouldStopTrainHorn(showHypeTrain, guessTimeLeft) && refs.trainHorn) {
		refs.trainHorn.pause();
		refs.trainHorn.currentTime = 0;
	}

	if (shouldPlayLowLifeSound(isHardMode, guessTimeLeft, isMuted) && refs.lowLife) {
		refs.lowLife.loop = true;
		refs.lowLife.play().catch((error) => {
			console.error("Error playing low life sound:", error);
		});
	} else if (shouldStopLowLifeSound(isHardMode, guessTimeLeft) && refs.lowLife) {
		refs.lowLife.pause();
		refs.lowLife.currentTime = 0;
	}
};
