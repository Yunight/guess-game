import { FC } from 'react';
import { Button } from '@/components/ui/button';
import { Pokemon } from './types';
import { useTranslation } from 'react-i18next';

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
  const { t, i18n } = useTranslation();

  // Get the appropriate hint text based on current language and remove Pokemon name
  const getFilteredHintText = () => {
    if (!currentPokemon) return '';

    const rawHintText = i18n.language === 'fr' 
      ? currentPokemon.frenchFlavorText 
      : currentPokemon.englishFlavorText;

    const pokemonName = i18n.language === 'fr' 
      ? currentPokemon.frenchName 
      : currentPokemon.englishName;

    // Create a case-insensitive regular expression to match the Pokemon name
    const nameRegex = new RegExp(pokemonName, 'gi');
    return rawHintText.replace(nameRegex, '___');
  };

  // Get first letter of Pokemon name based on current language
  const getFirstLetter = () => {
    if (!currentPokemon) return '';
    
    // Use englishName for English, frenchName for French
    const name = i18n.language === 'fr' ? currentPokemon.frenchName : currentPokemon.englishName;
    return name.charAt(0);
  };

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
          {t('hint')} ({hintsLeft === Infinity ? '∞' : hintsLeft})
          <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></div>
            <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse delay-75"></div>
          </div>
        </Button>
        
        <div className="relative h-24 mt-2 mb-1 overflow-hidden">
          <div className={`absolute inset-x-0 transition-all duration-300 transform ${showHint ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'}`}>
            {showHint && (
              <div className="p-2 bg-gray-100 border-2 border-gray-300
                rounded-xl text-gray-700 text-sm
                shadow-inner font-oswald relative">
                <div className="absolute left-2 top-2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                <div className="flex flex-col gap-1 items-center">
                  <div className="text-base font-bold">
                    {t('firstLetter')} : {getFirstLetter()}
                  </div>
                  <p className="text-center px-4 text-sm">{getFilteredHintText()}</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}; 