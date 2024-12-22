import { FC, useEffect, useState, useRef } from 'react';
import { Pokemon } from './types';
import { useTranslation } from 'react-i18next';

// Detect iOS device
const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) || 
              (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

interface PokemonDisplayProps {
  currentPokemon: Pokemon | undefined;
  isPokemonLoading: boolean;
  isCorrect: boolean | null;
  isMuted: boolean;
  guessTimeLeft: number;
  remainingCount: number;
  totalCount: number;
}

// Play shiny effect sound
const playShinyEffect = async () => {
  if (isIOS) return; // Skip on iOS devices
  try {
    const shinyAudio = new Audio('/sounds/shiny_effect.mp3');
    await shinyAudio.play();
    // Wait for shiny effect to finish before resolving
    await new Promise(resolve => {
      shinyAudio.onended = resolve;
    });
  } catch {
    // Ignore audio play errors
  }
};

export const PokemonDisplay: FC<PokemonDisplayProps> = ({
  currentPokemon,
  isPokemonLoading,
  isCorrect,
  isMuted,
  guessTimeLeft,
  remainingCount,
  totalCount,
}) => {
  const { i18n } = useTranslation();
  const [displayState, setDisplayState] = useState<'loading' | 'ready' | 'revealed'>('loading');
  const [displayedPokemon, setDisplayedPokemon] = useState<Pokemon | undefined>();
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const soundPlayedRef = useRef(false);
  const currentPokemonIdRef = useRef<number | null>(0);

  // Handle Pokemon changes and loading states
  useEffect(() => {
    const newPokemonId = currentPokemon?.id;
    const currentId = currentPokemonIdRef.current;
    
    // If we're loading or Pokemon has changed
    if (isPokemonLoading || newPokemonId !== currentId) {
      // Clean up audio
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.remove();
        audioRef.current = null;
      }
      soundPlayedRef.current = false;
      
      // Only clear display if we're loading a new Pokemon AND it's a different Pokemon
      if (newPokemonId !== currentId) {
        // Only reset display state if it's a different Pokemon
        if (newPokemonId !== displayedPokemon?.id) {
          setDisplayState('loading');
          setDisplayedPokemon(undefined);
        }
      }
      
      // Update reference immediately to prevent multiple clears
      currentPokemonIdRef.current = newPokemonId || null;
    }
    
    // Set new Pokemon only when we have it and it's not loading
    if (currentPokemon && !isPokemonLoading) {
      // Keep revealed state during transition until new Pokemon
      if (displayState === 'revealed' && currentPokemon.id === displayedPokemon?.id) {
        setDisplayedPokemon(currentPokemon);
      } else {
        // Set new state only if it's a different Pokemon or not revealed
        const newState = isCorrect === true ? 'revealed' : 'ready';
        setDisplayState(newState);
        setDisplayedPokemon(currentPokemon);
      }
    }
  }, [currentPokemon, isPokemonLoading, isCorrect, displayState, displayedPokemon]);

  // Handle Pokemon cry sound
  useEffect(() => {
    if (!displayedPokemon || !displayedPokemon.cryUrl || isMuted || soundPlayedRef.current) {
      return;
    }

    const initialPokemonId = displayedPokemon.id;
    if (initialPokemonId !== currentPokemonIdRef.current) {
      return;
    }

    const formatPokemonNameForShowdown = (name: string): string => {
      // Handle special cases
      const specialCases: { [key: string]: string } = {
        'Nidoran♂': 'nidoranm',
        'Nidoran♀': 'nidoranf',
        'Mr. Mime': 'mrmime',
        'Mime Jr.': 'mimejr',
        'Type: Null': 'typenull',
        'Flabébé': 'flabebe',
        'Farfetch\'d': 'farfetchd',
        'Sirfetch\'d': 'sirfetchd',
        'Mr. Rime': 'mrrime',
        'Wo-Chien': 'wochien',
        'Chien-Pao': 'chienpao',
        'Ting-Lu': 'tinglu',
        'Chi-Yu': 'chiyu',
        'Tapu Koko': 'tapukoko',
        'Tapu Lele': 'tapulele',
        'Tapu Bulu': 'tapubulu',
        'Tapu Fini': 'tapufini'
      };

      const pokemonName = name.toLowerCase();
      return specialCases[name] || pokemonName.replace(/[^a-z0-9]/g, '');
    };

    const playPokemonCry = async () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.remove();
        audioRef.current = null;
      }

      // Play shiny effect first if it's a shiny Pokemon
      if (displayedPokemon.isShiny && !isIOS) {
        await playShinyEffect();
      }

      const tryPlayAudio = async (url: string): Promise<HTMLAudioElement | null> => {
        const audio = new Audio(url);
        try {
          await audio.load();
          await audio.play();
          return audio;
        } catch {
          audio.remove();
          return null;
        }
      };

      try {
        let audio: HTMLAudioElement | null = null;
        
        if (isIOS) {
          // Use Pokemon Showdown's MP3 cry for iOS devices
          const formattedName = formatPokemonNameForShowdown(displayedPokemon.englishName);
          const showdownUrl = `https://play.pokemonshowdown.com/audio/cries/${formattedName}.mp3`;
          audio = await tryPlayAudio(showdownUrl);
        } else {
          // Use regular cries for other devices
          const urls = displayedPokemon.cryUrl.split('|');
          for (const url of urls) {
            audio = await tryPlayAudio(url);
            if (audio) break;
          }
        }

        if (audio) {
          audioRef.current = audio;
          soundPlayedRef.current = true;
        }
      } catch {
        if (audioRef.current) {
          audioRef.current.remove();
          audioRef.current = null;
        }
      }
    };

    if (displayState === 'ready') {
      playPokemonCry();
    }
  }, [displayState, displayedPokemon, isMuted]);

  return (
    <div className="mt-12 mx-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-lg p-2 shadow-lg">
      {/* Counter display */}
      <div className="flex justify-center mb-2">
        <div className="bg-black/80 text-white px-4 py-1 rounded-full text-sm font-medium">
          {remainingCount}/{totalCount}
        </div>
      </div>
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
          {(!displayedPokemon || !displayedPokemon.sprite) ? (
            <div className="pokeball-loading">
              <div className="outer-circle" />
              <div className="center-circle" />
            </div>
          ) : (
            <div className={`relative w-full h-full flex items-center justify-center ${
              displayState === 'revealed' ? 'animate-reveal-pokemon' : ''
            }`}>
              {/* Show shiny message even during silhouette */}
              {displayedPokemon.isShiny && (
                <div className="absolute top-4 left-0 right-0 flex justify-center z-20">
                  <div className="bg-yellow-400/90 text-black px-4 py-1 rounded-full font-bold text-sm">
                    {i18n.language === 'fr' ? '✨ CHROMATIQUE ✨' : '✨ SHINY ✨'}
                  </div>
                </div>
              )}
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={displayedPokemon.sprite}
                  alt={i18n.language === 'fr' ? displayedPokemon.frenchName : displayedPokemon.englishName}
                  className={`w-auto h-[80%] max-w-full object-contain ${
                    displayState === 'revealed' 
                      ? 'animate-reveal-pokemon' 
                      : displayState === 'ready' 
                        ? 'animate-appear-pokemon'
                        : 'opacity-0'
                  } ${displayState !== 'revealed' ? 'brightness-0' : ''}`}
                  style={{
                    willChange: 'transform, filter',
                    transformOrigin: 'center bottom',
                    '--float-y': '-5px'
                  } as React.CSSProperties}
                />

                {/* Pokemon name reveal */}
                {displayState === 'revealed' && guessTimeLeft === 0 && (
                  <div className="absolute bottom-4 left-0 right-0 text-center">
                    <div className="bg-gradient-to-r from-blue-500/50 via-blue-600/50 to-blue-500/50 text-white px-6 py-3 rounded-full mx-auto inline-block backdrop-blur-sm font-bold text-xl animate-fade-in drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                      {i18n.language === 'fr' ? displayedPokemon.frenchName : displayedPokemon.englishName}
                    </div>
                  </div>
                )}

                {/* Reveal effects */}
                {displayState === 'revealed' && (
                  <div className="absolute inset-0 pointer-events-none">
                    {/* Inner expanding ring */}
                    <div className="absolute inset-0 animate-ring-expand">
                      <div className={`absolute inset-0 border-4 ${displayedPokemon.isShiny ? 'border-yellow-400/50' : 'border-yellow-400/30'} rounded-full`}></div>
                    </div>
                    {/* Outer expanding ring (delayed) */}
                    <div className="absolute inset-0 animate-ring-expand-delayed">
                      <div className={`absolute inset-0 border-4 ${displayedPokemon.isShiny ? 'border-yellow-400/40' : 'border-yellow-400/20'} rounded-full`}></div>
                    </div>
                    {/* Sparkles */}
                    <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping" 
                         style={{ top: '20%', left: '30%', animationDuration: '1s' }}></div>
                    <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping" 
                         style={{ top: '70%', left: '80%', animationDuration: '1.2s' }}></div>
                    <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping" 
                         style={{ top: '40%', left: '60%', animationDuration: '0.8s' }}></div>
                    
                    {/* Extra sparkles for shiny Pokemon */}
                    {displayedPokemon.isShiny && (
                      <>
                        <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping" 
                             style={{ top: '30%', left: '20%', animationDuration: '1.3s' }}></div>
                        <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping" 
                             style={{ top: '60%', left: '70%', animationDuration: '0.9s' }}></div>
                        <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping" 
                             style={{ top: '45%', left: '40%', animationDuration: '1.1s' }}></div>
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}; 