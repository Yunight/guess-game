import { useRef, useEffect } from 'react';

const CORRECT_SOUND_URL = '/sounds/pkm_level_up.mp3';
const WRONG_SOUND_URL = '/sounds/bump_wall.mp3';
const VICTORY_SOUND_URL = '/sounds/battle_win.mp3';
const TRAIN_HORN_URL = '/sounds/train_horn_bell.mp3';
const LOW_LIFE_SOUND_URL = '/sounds/low_life.mp3';

export const useGameAudio = (
  isMuted: boolean,
  showHypeTrain: boolean,
  isHardMode: boolean,
  guessTimeLeft: number
) => {
  const victoryAudioRef = useRef<HTMLAudioElement | null>(null);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);
  const trainHornRef = useRef<HTMLAudioElement | null>(null);
  const lowLifeRef = useRef<HTMLAudioElement | null>(null);

  // Preload audio files
  useEffect(() => {
    correctAudioRef.current = new Audio(CORRECT_SOUND_URL);
    wrongAudioRef.current = new Audio(WRONG_SOUND_URL);
    victoryAudioRef.current = new Audio(VICTORY_SOUND_URL);
    trainHornRef.current = new Audio(TRAIN_HORN_URL);
    lowLifeRef.current = new Audio(LOW_LIFE_SOUND_URL);

    // Set volume for specific sounds
    if (trainHornRef.current) trainHornRef.current.volume = 0.05;
    if (lowLifeRef.current) lowLifeRef.current.volume = 0.1;

    return () => {
      cleanupAllAudio();
    };
  }, []);

  const cleanupAllAudio = () => {
    const audioRefs = [
      victoryAudioRef,
      correctAudioRef,
      wrongAudioRef,
      trainHornRef,
      lowLifeRef,
    ];

    for (const ref of audioRefs) {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    }
  };

  const playSound = async (audioRef: React.RefObject<HTMLAudioElement | null>) => {
    if (isMuted || !audioRef.current) return;
    
    try {
      cleanupAllAudio();
      audioRef.current.currentTime = 0;
      await audioRef.current.play();
    } catch (error) {
      console.error('Error playing sound:', error);
    }
  };

  const playCorrectSound = () => playSound(correctAudioRef);
  const playWrongSound = () => playSound(wrongAudioRef);
  const playVictorySound = () => playSound(victoryAudioRef);

  // Handle train horn and low life sounds
  useEffect(() => {
    // Handle train horn sound
    if (showHypeTrain && !isMuted && trainHornRef.current) {
      trainHornRef.current.loop = true;
      trainHornRef.current.play().catch((error) => {
        console.error('Error playing train horn:', error);
      });
    } else if (!showHypeTrain && trainHornRef.current) {
      trainHornRef.current.pause();
      trainHornRef.current.currentTime = 0;
    }

    // Handle low life sound
    if (isHardMode && guessTimeLeft <= 5 && guessTimeLeft > 0 && !isMuted && lowLifeRef.current) {
      lowLifeRef.current.loop = true;
      lowLifeRef.current.play().catch((error) => {
        console.error('Error playing low life sound:', error);
      });
    } else if ((guessTimeLeft > 5 || guessTimeLeft <= 0 || !isHardMode) && lowLifeRef.current) {
      lowLifeRef.current.pause();
      lowLifeRef.current.currentTime = 0;
    }
  }, [showHypeTrain, isMuted, isHardMode, guessTimeLeft]);

  return {
    playCorrectSound,
    playWrongSound,
    playVictorySound,
    cleanupAllAudio,
  };
}; 