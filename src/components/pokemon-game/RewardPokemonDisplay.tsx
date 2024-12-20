import { FC } from 'react';
import { Pokemon } from './types';
import { useTranslation } from 'react-i18next';

interface RewardPokemonDisplayProps {
  pokemon: Pokemon | undefined;
  isLoading: boolean;
}

export const RewardPokemonDisplay: FC<RewardPokemonDisplayProps> = ({
  pokemon,
  isLoading
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="mt-4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-2 shadow-lg">
      <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg flex flex-col items-center justify-center p-2 
        aspect-[4/3] relative overflow-hidden shadow-inner">
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.5)_20%)] bg-[length:10px_10px] animate-grid-shine"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 animate-screen-glare"></div>
        <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400 rounded-tl-lg animate-corner-pulse"></div>
        <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400 rounded-tr-lg animate-corner-pulse-delay-1"></div>
        <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400 rounded-bl-lg animate-corner-pulse-delay-2"></div>
        <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400 rounded-br-lg animate-corner-pulse-delay-3"></div>
        
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="pokeball-loading">
              <div className="outer-circle" />
              <div className="center-circle" />
            </div>
          ) : pokemon ? (
            <>
              <img
                src={pokemon.sprite}
                alt={i18n.language === 'fr' ? pokemon.frenchName : pokemon.englishName}
                className="w-full h-full object-contain animate-bounce-in"
              />
              <div className="absolute bottom-0 left-0 right-0 text-center bg-black/50 backdrop-blur-sm py-3 text-white font-bold text-xl">
                <span className="text-yellow-300">{t('youAre')} </span>
                <span className="text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">
                  {i18n.language === 'fr' ? pokemon.frenchName : pokemon.englishName}
                </span>
                <span className="text-yellow-300"> !</span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}; 