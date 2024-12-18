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
  const currentPokemonIdRef = useRef<number | null>(null);

  // Reset state when Pokemon changes
  useEffect(() => {
    const newPokemonId = currentPokemon?.id;
    console.log('🔄 Pokemon changed, resetting display state');
    
    // Update our reference first
    currentPokemonIdRef.current = newPokemonId || null;
    
    setDisplayState('loading');
    setDisplayedPokemon(undefined);
    loadingRef.current = true;
    soundPlayedRef.current = false;

    // Clean up previous audio immediately
    if (audioRef.current) {
      console.log('🧹 Cleaning up previous Pokemon audio');
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.remove();
      audioRef.current = null;
    }

    return () => {
      if (audioRef.current) {
        console.log('🧹 Cleaning up audio on unmount');
        audioRef.current.pause();
        audioRef.current.currentTime = 0;
        audioRef.current.remove();
        audioRef.current = null;
      }
    };
  }, [currentPokemon?.id]);

  // Handle image loading and display state
  useEffect(() => {
    if (!currentPokemon || isPokemonLoading || !loadingRef.current) {
      console.log('⏳ Waiting for Pokemon data...');
      return;
    }

    const initialPokemonId = currentPokemon.id;
    if (initialPokemonId !== currentPokemonIdRef.current) {
      console.log('❌ Pokemon ID mismatch at start of effect, aborting');
      return;
    }
    
    console.log('🎯 Starting to load Pokemon:', initialPokemonId);

    const loadImage = async () => {
      try {
        // Check if we're still loading the same Pokemon
        if (initialPokemonId !== currentPokemonIdRef.current) {
          console.log('❌ Pokemon changed during loading, aborting');
          return;
        }

        // Only attempt to load if we have a valid sprite URL
        if (!currentPokemon.sprite) {
          console.error('❌ No sprite URL available');
          setDisplayState('ready');
          return;
        }

        console.log('🖼️ Loading Pokemon sprite for:', currentPokemon.frenchName, 'ID:', currentPokemon.id);
        // Preload the image
        await new Promise((resolve, reject) => {
          const img = new Image();
          img.onload = resolve;
          img.onerror = (error) => {
            console.error('❌ Error loading Pokemon sprite:', error);
            reject(error);
          };
          img.src = currentPokemon.sprite;
        });

        // Check again if we're still loading the same Pokemon
        if (initialPokemonId !== currentPokemonIdRef.current) {
          console.log('❌ Pokemon changed after loading sprite, aborting');
          return;
        }

        // Set the Pokemon data
        setDisplayedPokemon(currentPokemon);
        
        // Add a small delay for animation
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Check one final time before playing sound
        if (initialPokemonId !== currentPokemonIdRef.current) {
          console.log('❌ Pokemon changed before playing sound, aborting');
          return;
        }

        // Mark as ready to display
        setDisplayState('ready');
        
        // Play sound only after display is ready, if not muted, and if we haven't played it yet
        if (!isMuted && currentPokemon.cryUrl && !soundPlayedRef.current && !isCorrect) {
          console.log(`🔊 About to play Pokemon cry sound for: ${currentPokemon.frenchName} ID: ${initialPokemonId}`);
          
          // Double check we're still on the same Pokemon
          if (initialPokemonId !== currentPokemonIdRef.current) {
            console.log('❌ Pokemon ID mismatch, aborting sound play');
            return;
          }

          // Clean up any existing audio before creating new one
          if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.currentTime = 0;
            audioRef.current.remove();
            audioRef.current = null;
          }

          // Create and configure new audio
          const audio = new Audio(currentPokemon.cryUrl);
          audio.dataset.pokemonId = initialPokemonId.toString();
          
          try {
            // Set flag before starting audio operations
            soundPlayedRef.current = true;
            audioRef.current = audio;
            
            // Preload the audio
            await audio.load();
            
            // Final check before playing
            if (initialPokemonId !== currentPokemonIdRef.current) {
              console.log('❌ Pokemon changed during audio load, aborting');
              audio.remove();
              audioRef.current = null;
              return;
            }
            
            await audio.play();
            
            // Verify the sound being played matches the current Pokemon
            if (audioRef.current?.dataset.pokemonId === initialPokemonId.toString() &&
                initialPokemonId === currentPokemonIdRef.current) {
              console.log(`✅ Pokemon cry sound played successfully for: ${currentPokemon.frenchName} ID: ${initialPokemonId}`);
            } else {
              console.log('❌ Sound mismatch detected, stopping audio');
              audio.pause();
              audio.currentTime = 0;
              audio.remove();
              audioRef.current = null;
            }
          } catch (error) {
            console.error('❌ Error playing Pokemon cry:', error);
            if (audioRef.current) {
              audioRef.current.remove();
              audioRef.current = null;
            }
          }
        }
      } catch (error) {
        console.error('Error loading resources:', error);
        // Only set Pokemon data if we're still on the same Pokemon
        if (initialPokemonId === currentPokemonIdRef.current) {
          setDisplayedPokemon(currentPokemon);
          setDisplayState('ready');
        }
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
        audioRef.current.remove();
        audioRef.current = null;
      }
    };
  }, [currentPokemon?.id, isPokemonLoading, isMuted, isCorrect]);

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
          {displayState === 'loading' || !displayedPokemon ? (
            <div className="pokeball-loading">
              <div className="outer-circle" />
              <div className="center-circle" />
            </div>
          ) : (
            <img
              src={displayedPokemon.sprite}
              alt={displayedPokemon.frenchName}
              className={`w-full h-full object-contain transition-all duration-300 ${
                isCorrect === false ? 'brightness-0' : ''
              }`}
            />
          )}
        </div>
      </div>
    </div>
  );
}; 