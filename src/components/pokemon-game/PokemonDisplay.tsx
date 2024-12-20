import { FC, useEffect, useState, useRef } from 'react';
import { Pokemon } from './types';
import { useTranslation } from 'react-i18next';

// Add custom logger that only logs in development
const devLog = (message: string) => {
  if (process.env.NODE_ENV === 'development') {
    console.log(message);
  }
};

const devError = (message: string, error?: unknown) => {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  }
};

interface PokemonDisplayProps {
  currentPokemon: Pokemon | undefined;
  isPokemonLoading: boolean;
  isCorrect: boolean | null;
  isMuted: boolean;
  guessTimeLeft: number;
}

export const PokemonDisplay: FC<PokemonDisplayProps> = ({
  currentPokemon,
  isPokemonLoading,
  isCorrect,
  isMuted,
  guessTimeLeft,
}) => {
  const { i18n } = useTranslation();
  const [displayState, setDisplayState] = useState<'loading' | 'ready' | 'revealed'>('loading');
  const [displayedPokemon, setDisplayedPokemon] = useState<Pokemon | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundPlayedRef = useRef(false);
  const currentPokemonIdRef = useRef<number | null>(null);
  const shinyAudioRef = useRef<HTMLAudioElement | null>(null);

  // Reset state when Pokemon changes
  useEffect(() => {
    const newPokemonId = currentPokemon?.id;
    devLog('🔄 Pokemon changed, resetting display state');
    
    // Always set loading state first when Pokemon changes
    setDisplayState('loading');
    setDisplayedPokemon(undefined);
    
    // Update our reference first
    currentPokemonIdRef.current = newPokemonId || null;
    
    // Clean up previous audio immediately
    if (audioRef.current) {
      devLog('🧹 Cleaning up previous Pokemon audio');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.remove();
      audioRef.current = null;
    }

    if (shinyAudioRef.current) {
      shinyAudioRef.current.pause();
      shinyAudioRef.current.currentTime = 0;
      shinyAudioRef.current.remove();
      shinyAudioRef.current = null;
    }

    // If we're loading or don't have a Pokemon, stay in loading state
    if (isPokemonLoading || !currentPokemon) {
      return;
    }

    // Small delay before showing the new Pokemon to ensure loading state is visible
    const timer = setTimeout(() => {
      setDisplayedPokemon(currentPokemon);
      setDisplayState('ready');
      soundPlayedRef.current = false;
    }, 300);

    return () => {
      clearTimeout(timer);
      if (audioRef.current) {
        devLog('🧹 Cleaning up audio on unmount');
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.remove();
        audioRef.current = null;
      }

      if (shinyAudioRef.current) {
        shinyAudioRef.current.pause();
        shinyAudioRef.current.currentTime = 0;
        shinyAudioRef.current.remove();
        shinyAudioRef.current = null;
      }
    };
  }, [currentPokemon, isPokemonLoading]);

  // Handle Pokemon cry sound
  useEffect(() => {
    if (!displayedPokemon || isMuted || soundPlayedRef.current || displayState === 'loading') {
      return;
    }

    const initialPokemonId = displayedPokemon.id;
    if (initialPokemonId !== currentPokemonIdRef.current) {
      return;
    }

    const playPokemonCry = async () => {
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
        if (!displayedPokemon.cryUrl) return;
        soundPlayedRef.current = true;
        const urls = displayedPokemon.cryUrl.split('|');
        let audio: HTMLAudioElement | null = null;

        // Try each URL format (mp3 and ogg) until one works
        for (const url of urls) {
          audio = await tryPlayAudio(url.trim());
          if (audio) {
            audioRef.current = audio;
            break;
          }
        }
      } catch (error) {
        devError('❌ Error playing Pokemon cry:', error);
        if (audioRef.current) {
          audioRef.current.remove();
          audioRef.current = null;
        }
      }
    };

    playPokemonCry();
  }, [displayedPokemon, isMuted, displayState]);

  // Play shiny sound effect when a shiny Pokemon appears
  useEffect(() => {
    if (displayState === 'revealed' && displayedPokemon?.isShiny && !isMuted && !soundPlayedRef.current) {
      const audio = new Audio('/sounds/shiny_effect.mp3');
      shinyAudioRef.current = audio;
      audio.volume = 0.5;
      audio.play().catch(error => devError('Failed to play shiny sound:', error));
      soundPlayedRef.current = true;
    }
  }, [displayState, displayedPokemon?.isShiny, isMuted]);

  // Handle Pokemon reveal
  useEffect(() => {
    if (isCorrect === true || guessTimeLeft === 0) {
      setDisplayState('revealed');
    }
  }, [isCorrect, guessTimeLeft]);

  return (
    <div className="mt-12 mx-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-lg p-2 shadow-lg">
      <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center p-2 
        aspect-[4/3] mb-2 relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.5)_20%)] bg-[length:10px_10px] animate-grid-shine"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 animate-screen-glare"></div>
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg animate-corner-pulse"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg animate-corner-pulse-delay-1"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg animate-corner-pulse-delay-2"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg animate-corner-pulse-delay-3"></div>
        
        {/* Add sparkle effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-1" style={{ top: '20%', left: '30%' }}></div>
          <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-2" style={{ top: '70%', left: '80%' }}></div>
          <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-3" style={{ top: '40%', left: '60%' }}></div>
        </div>
        
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {(displayState === 'loading' || isPokemonLoading || !displayedPokemon || !displayedPokemon.sprite) ? (
            <div className="pokeball-loading">
              <div className="outer-circle" />
              <div className="center-circle" />
            </div>
          ) : (
            <div className={`relative w-full h-full flex items-center justify-center transition-all duration-700 ease-out ${
              displayState === 'revealed' ? 'animate-reveal-pokemon' : ''
            }`}>
              {/* Pokemon image with animations */}
              <img
                src={displayedPokemon.sprite}
                alt=""
                className={`w-full h-full object-contain transition-all duration-700 ease-out ${
                  displayState === 'revealed' 
                    ? 'animate-bounce-in filter brightness-100' 
                    : displayState === 'ready' 
                      ? 'filter brightness-0 animate-appear-shake'
                      : 'opacity-0'
                }`}
                style={{
                  willChange: 'transform, opacity, filter'
                }}
              />

              {/* Pokemon name reveal */}
              {displayState === 'revealed' && guessTimeLeft === 0 && (
                <div className="absolute bottom-4 left-0 right-0 text-center">
                  <div className="bg-black/70 text-white px-4 py-2 rounded-full mx-auto inline-block backdrop-blur-sm font-bold text-xl animate-fade-in">
                    {i18n.language === 'fr' ? displayedPokemon.frenchName : displayedPokemon.englishName}
                    {displayedPokemon.isShiny && (
                      <span className="ml-2 text-yellow-400">✨</span>
                    )}
                  </div>
                </div>
              )}

              {/* Reveal effects */}
              {displayState === 'revealed' && (
                <div className="absolute inset-0 pointer-events-none">
                  {/* Inner expanding ring */}
                  <div className="absolute inset-0 animate-ring-expand">
                    <div className={`absolute inset-0 border-4 ${displayedPokemon.isShiny ? 'border-yellow-400/60' : 'border-yellow-400/30'} rounded-full`}></div>
                  </div>
                  {/* Outer expanding ring (delayed) */}
                  <div className="absolute inset-0 animate-ring-expand-delayed">
                    <div className={`absolute inset-0 border-4 ${displayedPokemon.isShiny ? 'border-yellow-400/40' : 'border-yellow-400/20'} rounded-full`}></div>
                  </div>
                  {/* Sparkles */}
                  {displayedPokemon.isShiny && (
                    <>
                      <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping-sparkle" 
                           style={{ top: '20%', left: '30%', animationDuration: '1s' }}></div>
                      <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping-sparkle" 
                           style={{ top: '70%', left: '80%', animationDuration: '1.2s' }}></div>
                      <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping-sparkle" 
                           style={{ top: '40%', left: '60%', animationDuration: '0.8s' }}></div>
                      <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping-sparkle" 
                           style={{ top: '30%', left: '70%', animationDuration: '1.4s' }}></div>
                      <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping-sparkle" 
                           style={{ top: '60%', left: '40%', animationDuration: '1.1s' }}></div>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 