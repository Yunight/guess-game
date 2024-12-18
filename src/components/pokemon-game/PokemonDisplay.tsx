import { FC, useEffect, useState, useRef } from 'react';
import { Pokemon } from './types';

interface PokemonDisplayProps {
  currentPokemon: Pokemon | undefined;
  isPokemonLoading: boolean;
  isCorrect: boolean | null;
  isMuted: boolean;
}

export const PokemonDisplay: FC<PokemonDisplayProps> = ({
  currentPokemon,
  isPokemonLoading,
  isCorrect,
  isMuted,
}) => {
  const [displayState, setDisplayState] = useState<'loading' | 'ready'>('loading');
  const [displayedPokemon, setDisplayedPokemon] = useState<Pokemon | undefined>(undefined);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const loadingRef = useRef(false);
  const soundPlayedRef = useRef(false);

  // Reset state when Pokemon changes
  useEffect(() => {
    setDisplayState('loading');
    setDisplayedPokemon(undefined);
    loadingRef.current = true;
    soundPlayedRef.current = false;

    // Clean up previous audio
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current = null;
    }
  }, [currentPokemon]);

  // Handle image loading and display state
  useEffect(() => {
    if (!currentPokemon || isPokemonLoading || !loadingRef.current) return;

    const loadImage = async () => {
      try {
        // Preload the image
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = reject;
          img.src = currentPokemon.imageUrl;
        });

        // Set the Pokemon data
        setDisplayedPokemon(currentPokemon);
        
        // Add a small delay for animation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Mark as ready to display
        setDisplayState('ready');
        
        // Play sound only after display is ready and if not muted
        if (!isMuted && currentPokemon.cryUrl && !soundPlayedRef.current) {
          soundPlayedRef.current = true;
          const audio = new Audio(currentPokemon.cryUrl);
          audioRef.current = audio;
          
          await new Promise<void>((resolve) => {
            const handleCanPlay = () => {
              audio.removeEventListener('canplaythrough', handleCanPlay);
              resolve();
            };
            audio.addEventListener('canplaythrough', handleCanPlay);
            audio.load();
          });

          // Only play if this is still the current audio and we haven't played yet
          if (audioRef.current === audio && soundPlayedRef.current) {
            await audio.play().catch(console.error);
          }
        }
      } catch (error) {
        console.error('Error loading resources:', error);
        setDisplayedPokemon(currentPokemon);
        setDisplayState('ready');
      } finally {
        loadingRef.current = false;
      }
    };

    loadImage();

    return () => {
      loadingRef.current = false;
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current = null;
      }
    };
  }, [currentPokemon, isPokemonLoading, isMuted]);

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
        
        <div className="relative z-10 w-full h-full flex items-center justify-center">
          {displayState === 'loading' && (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="pokeball-loading scale-75">
                <div className="outer-circle" />
                <div className="center-circle" />
              </div>
            </div>
          )}

          {displayedPokemon && (
            <img
              src={displayedPokemon.imageUrl}
              alt="Pokémon mystère"
              className={`w-auto h-[250px] object-contain transition-opacity duration-300 drop-shadow-lg animate-float
                ${displayState === 'ready' ? 'opacity-100' : 'opacity-0'}`}
              style={{ 
                filter: isCorrect ? 'none' : 'brightness(0) saturate(100%) contrast(200%) brightness(50%)'
              }}
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('sprites.pokemon.com')) {
                  target.src = `https://sprites.pokemon.com/artwork/detail/${displayedPokemon.id.toString().padStart(3, '0')}.png`;
                }
              }}
            />
          )}
        </div>
      </div>

      <div className="flex justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-blink"></div>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-blink-delay"></div>
      </div>
    </div>
  );
}; 