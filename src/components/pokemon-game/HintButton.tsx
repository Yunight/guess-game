import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Pokemon } from './types';

interface HintButtonProps {
  hintsLeft: number;
  showHint: boolean;
  useHint: () => void;
  isPokemonLoading: boolean;
  currentPokemon: Pokemon | undefined;
}

export const HintButton: FC<HintButtonProps> = ({
  hintsLeft,
  showHint,
  useHint,
  isPokemonLoading,
  currentPokemon,
}) => {
  // Get the appropriate hint text, using English as fallback
  const hintText = currentPokemon?.flavorText || 
    (currentPokemon?.englishFlavorText ? 'Français non disponible - ' + currentPokemon.englishFlavorText : '');

  return (
    <div className="mx-2 mt-2">
      <div className="relative">
        <Button 
          variant="default"
          className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2
            rounded-xl shadow-lg transform hover:scale-[1.02] 
            transition-all duration-300 font-medium font-oswald h-12
            disabled:bg-gray-300 disabled:hover:scale-100
            relative overflow-hidden"
          onClick={useHint}
          disabled={hintsLeft === 0 || showHint || isPokemonLoading}
        >
          <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse delay-75"></div>
          </div>
          Indice ({hintsLeft})
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse delay-75"></div>
          </div>
        </Button>
        
        <div className="relative h-20 mt-2 mb-4 overflow-hidden">
          <div className={`absolute inset-x-0 transition-all duration-300 transform ${showHint ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            {hintText && (
              <div className="p-3 bg-gray-100 border-2 border-gray-300
                rounded-xl text-gray-700 text-sm
                shadow-inner font-oswald relative">
                <div className="absolute left-2 top-2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <p className="text-center px-4 line-clamp-2">{hintText}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 