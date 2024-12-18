import { FC } from 'react';
import { Pokemon } from './types';

interface RewardPokemonDisplayProps {
  pokemon: Pokemon | undefined;
  isLoading: boolean;
}

export const RewardPokemonDisplay: FC<RewardPokemonDisplayProps> = ({
  pokemon,
  isLoading
}) => {
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
              className="w-full h-full object-contain"
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