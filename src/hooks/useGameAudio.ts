import { useEffect, useRef } from "react";
import { syncAmbientGameAudio } from "./gameAudioLogic";

const CORRECT_SOUND_URL = "/sounds/pkm_level_up.mp3";
const WRONG_SOUND_URL = "/sounds/bump_wall.mp3";
const VICTORY_SOUND_URL = "/sounds/battle_win.mp3";
const TRAIN_HORN_URL = "/sounds/train_horn_bell.mp3";
const LOW_LIFE_SOUND_URL = "/sounds/low_life.mp3";

export const useGameAudio = (
	isMuted: boolean,
	showHypeTrain: boolean,
	isHardMode: boolean,
	guessTimeLeft: number,
) => {
	const victoryAudioRef = useRef<HTMLAudioElement | null>(null);
	const correctAudioRef = useRef<HTMLAudioElement | null>(null);
	const wrongAudioRef = useRef<HTMLAudioElement | null>(null);
	const trainHornRef = useRef<HTMLAudioElement | null>(null);
	const lowLifeRef = useRef<HTMLAudioElement | null>(null);

	const cleanupAllAudio = (preserveTrainHorn = false): void => {
		const audioRefs = preserveTrainHorn
			? [victoryAudioRef, correctAudioRef, wrongAudioRef, lowLifeRef]
			: [victoryAudioRef, correctAudioRef, wrongAudioRef, trainHornRef, lowLifeRef];

		for (const ref of audioRefs) {
			if (ref.current) {
				ref.current.pause();
				ref.current.currentTime = 0;
			}
		}
	};

	useEffect(() => {
		correctAudioRef.current = new Audio(CORRECT_SOUND_URL);
		wrongAudioRef.current = new Audio(WRONG_SOUND_URL);
		victoryAudioRef.current = new Audio(VICTORY_SOUND_URL);
		trainHornRef.current = new Audio(TRAIN_HORN_URL);
		lowLifeRef.current = new Audio(LOW_LIFE_SOUND_URL);

		if (trainHornRef.current) trainHornRef.current.volume = 0.05;
		if (lowLifeRef.current) lowLifeRef.current.volume = 0.1;

		return () => {
			cleanupAllAudio();
		};
	}, []);

	const cleanupNonCurrentAudio = (currentRef: React.RefObject<HTMLAudioElement | null>): void => {
		const allRefs = [victoryAudioRef, correctAudioRef, wrongAudioRef, lowLifeRef, trainHornRef];
		const refsToCleanup =
			currentRef !== trainHornRef
				? allRefs.filter((ref) => ref !== currentRef && ref !== trainHornRef)
				: allRefs.filter((ref) => ref !== currentRef);

		for (const ref of refsToCleanup) {
			if (ref.current) {
				ref.current.pause();
				ref.current.currentTime = 0;
			}
		}
	};

	const playSound = async (audioRef: React.RefObject<HTMLAudioElement | null>): Promise<void> => {
		if (isMuted || !audioRef.current) return;

		try {
			cleanupNonCurrentAudio(audioRef);
			audioRef.current.currentTime = 0;
			await audioRef.current.play();
		} catch (error) {
			console.error("Error playing sound:", error);
		}
	};

	const playCorrectSound = (): Promise<void> => playSound(correctAudioRef);
	const playWrongSound = (): Promise<void> => playSound(wrongAudioRef);
	const playVictorySound = (): Promise<void> => playSound(victoryAudioRef);

	useEffect(() => {
		syncAmbientGameAudio(showHypeTrain, isMuted, isHardMode, guessTimeLeft, {
			trainHorn: trainHornRef.current,
			lowLife: lowLifeRef.current,
		});
	}, [showHypeTrain, isMuted, isHardMode, guessTimeLeft]);

	return {
		playCorrectSound,
		playWrongSound,
		playVictorySound,
		cleanupAllAudio,
	};
};
