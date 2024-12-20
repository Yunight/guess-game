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
      <div className={`bg-gradient-to-br ${pokemon?.isShiny ? 'from-yellow-100 to-yellow-200' : 'from-blue-100 to-blue-200'} 
        rounded-lg flex flex-col items-center justify-center p-2 aspect-[4/3] relative overflow-hidden shadow-inner`}>
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.5)_20%)] bg-[length:10px_10px] animate-grid-shine"></div>
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 animate-screen-glare"></div>
        
        <div className={`absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-tl-lg animate-corner-pulse`}></div>
        <div className={`absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-tr-lg animate-corner-pulse-delay-1`}></div>
        <div className={`absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-bl-lg animate-corner-pulse-delay-2`}></div>
        <div className={`absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-br-lg animate-corner-pulse-delay-3`}></div>
        
        {pokemon?.isShiny && (
          <>
            <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping" 
                 style={{ top: '20%', left: '30%', animationDuration: '1s' }}></div>
            <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping" 
                 style={{ top: '70%', left: '80%', animationDuration: '1.2s' }}></div>
            <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-ping" 
                 style={{ top: '40%', left: '60%', animationDuration: '0.8s' }}></div>
            <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping" 
                 style={{ top: '30%', left: '20%', animationDuration: '1.3s' }}></div>
            <div className="absolute w-3 h-3 bg-yellow-300 rounded-full animate-ping" 
                 style={{ top: '60%', left: '70%', animationDuration: '0.9s' }}></div>
          </>
        )}
        
        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="pokeball-loading">
              <div className="outer-circle" />
              <div className="center-circle" />
            </div>
          ) : pokemon ? (
            <>
              {pokemon.isShiny && (
                <div className="absolute top-2 left-0 right-0 flex justify-center">
                  <div className="bg-yellow-400/90 text-black px-4 py-1 rounded-full font-bold text-sm animate-bounce-in">
                    ✨ Shiny ✨
                  </div>
                </div>
              )}
              
              <div className="relative w-full h-full flex items-center justify-center">
                <img
                  src={pokemon.sprite}
                  alt={i18n.language === 'fr' ? pokemon.frenchName : pokemon.englishName}
                  className={`w-auto h-[90%] max-w-full object-contain ${pokemon.isShiny ? 'animate-shiny-bounce-in' : 'animate-bounce-in'}`}
                />
              </div>
              
              <div className={`absolute bottom-0 left-0 right-0 text-center ${pokemon.isShiny ? 'bg-yellow-500/50' : 'bg-black/50'} 
                backdrop-blur-sm py-3 text-white font-bold text-xl transition-all duration-300`}>
                <span className="text-white">{t('youAre')} </span>
                <span className={`${pokemon.isShiny ? 'text-yellow-300' : 'text-white'} drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]`}>
                  {i18n.language === 'fr' ? 
                    pokemon.frenchName.charAt(0).toUpperCase() + pokemon.frenchName.slice(1).toLowerCase() : 
                    pokemon.englishName.charAt(0).toUpperCase() + pokemon.englishName.slice(1).toLowerCase()}
                </span>
                <span className="text-white"> !</span>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}; 