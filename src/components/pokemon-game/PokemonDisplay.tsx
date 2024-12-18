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
    <div className="mt-12 mx-2 bg-white rounded-lg p-2">
      {/* Pokemon Image Screen */}
      <div className="bg-white rounded-lg flex items-center justify-center p-2 
        aspect-[4/3] mb-2">
        {currentPokemon && (
          <>
            {isPokemonLoading ? (
              <div className="pokeball-loading scale-75">
                <div className="outer-circle" />
                <div className="center-circle" />
              </div>
            ) : (
              <img
                src={currentPokemon.imageUrl}
                alt="Pokémon mystère"
                className="w-auto h-[250px] object-contain transition-all duration-300"
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
            )}
          </>
        )}
      </div>

      {/* Red dots under screen */}
      <div className="flex justify-center gap-2 mb-2">
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
        <div className="w-2 h-2 rounded-full bg-red-500"></div>
      </div>
    </div>
  );
}; 