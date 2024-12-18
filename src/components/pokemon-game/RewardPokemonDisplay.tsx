import { FC, useEffect, useRef } from 'react';
import { Pokemon } from './types';

interface RewardPokemonDisplayProps {
  pokemon: Pokemon | undefined;
  isLoading: boolean;
  isMuted?: boolean;
}

export const RewardPokemonDisplay: FC<RewardPokemonDisplayProps> = ({
  pokemon,
  isLoading,
  isMuted = false
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundPlayedRef = useRef(false);

  useEffect(() => {
    // Clean up function
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.remove();
        audioRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    const playPokemonCry = async () => {
      if (pokemon && !isLoading && !isMuted && pokemon.cryUrl && !soundPlayedRef.current) {
        // Clean up any existing audio
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current.currentTime = 0;
          audioRef.current.remove();
          audioRef.current = null;
        }

        const tryPlayAudio = async (url: string): Promise<HTMLAudioElement | null> => {
          const audio = new Audio(url);
          try {
            await audio.load();
            await audio.play();
            return audio;
          } catch (error) {
            console.error(`Error playing audio from URL: ${url}`, error);
            audio.remove();
            return null;
          }
        };

        try {
          soundPlayedRef.current = true;
          const urls = pokemon.cryUrl.split('|');
          let audio: HTMLAudioElement | null = null;

          for (const url of urls) {
            audio = await tryPlayAudio(url);
            if (audio) {
              audioRef.current = audio;
              break;
            }
          }
        } catch (error) {
          console.error('Error playing Pokemon cry:', error);
          if (audioRef.current) {
            audioRef.current.remove();
            audioRef.current = null;
          }
        }
      }
    };

    playPokemonCry();
  }, [pokemon, isLoading, isMuted]);

  return (
    <div className="mt-4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-2 shadow-lg">
      <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center p-2 
        aspect-[4/3] relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.5)_20%)] bg-[length:10px_10px] animate-grid-shine"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 animate-screen-glare"></div>
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg animate-corner-pulse"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg animate-corner-pulse-delay-1"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg animate-corner-pulse-delay-2"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg animate-corner-pulse-delay-3"></div>
        
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {isLoading ? (
            <div className="pokeball-loading">
              <div className="outer-circle" />
              <div className="center-circle" />
            </div>
          ) : pokemon ? (
            <img
              src={pokemon.sprite}
              alt={pokemon.frenchName}
              className="w-full h-full object-contain animate-bounce-in"
            />
          ) : null}
        </div>
      </div>
      {pokemon && !isLoading && (
        <div className="text-center mt-2 text-white font-bold">
          Vous êtes un : {pokemon.frenchName}
        </div>
      )}
    </div>
  );
}; 