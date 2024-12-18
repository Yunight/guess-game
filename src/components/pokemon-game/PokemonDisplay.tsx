import { FC } from 'react';
import { Pokemon } from './types';

interface PokemonDisplayProps {
  currentPokemon: Pokemon | undefined;
  isPokemonLoading: boolean;
  isCorrect: boolean | null;
}

export const PokemonDisplay: FC<PokemonDisplayProps> = ({
  currentPokemon,
  isPokemonLoading,
  isCorrect,
}) => {
  return (
    <div className="mt-12 mx-2 bg-gradient-to-b from-gray-800 to-gray-900 rounded-t-lg p-2 shadow-lg">
      {/* Pokemon Image Screen */}
      <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex items-center justify-center p-2 
        aspect-[4/3] mb-2 relative overflow-hidden shadow-inner">
        {/* Grid pattern background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.5)_20%)] bg-[length:10px_10px] animate-grid-shine"></div>
        {/* Screen glare effect */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 animate-screen-glare"></div>
        {/* Decorative corner elements */}
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg animate-corner-pulse"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg animate-corner-pulse-delay-1"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg animate-corner-pulse-delay-2"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg animate-corner-pulse-delay-3"></div>
        
        {currentPokemon && (
          <>
            {isPokemonLoading ? (
              <div className="pokeball-loading scale-75">
                <div className="outer-circle" />
                <div className="center-circle" />
              </div>
            ) : (
              <div className="relative z-10">
                <img
                  src={currentPokemon.imageUrl}
                  alt="Pokémon mystère"
                  className="w-auto h-[250px] object-contain transition-all duration-300 drop-shadow-lg animate-float"
                  style={{ 
                    filter: isCorrect ? 'none' : 'brightness(0) saturate(100%) contrast(200%) brightness(50%)'
                  }}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    if (!target.src.includes('sprites.pokemon.com')) {
                      target.src = `https://sprites.pokemon.com/artwork/detail/${currentPokemon.id.toString().padStart(3, '0')}.png`;
                    }
                  }}
                />
              </div>
            )}
          </>
        )}
      </div>

      {/* Red dots under screen */}
      <div className="flex justify-center gap-2">
        <div className="w-2 h-2 rounded-full bg-red-500 animate-blink"></div>
        <div className="w-2 h-2 rounded-full bg-red-500 animate-blink-delay"></div>
      </div>
    </div>
  );
}; 