import React, { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Pokemon } from './types';
import { PokemonSprite } from './PokemonSprite';

interface RewardPokemonDisplayProps {
  pokemon: Pokemon | undefined;
  isLoading: boolean;
  totalPokemonCount: number;
}

export const RewardPokemonDisplay: FC<RewardPokemonDisplayProps> = ({
  pokemon,
  isLoading,
  totalPokemonCount,
}) => {
  const { t, i18n } = useTranslation();
  
  if (!pokemon && !isLoading) {
    return null;
  }

  return (
    <div className="w-full max-w-md mx-auto">
      <div className={`bg-gradient-to-br ${pokemon?.isShiny ? 'from-yellow-100 to-yellow-200' : 'from-blue-100 to-blue-200'} 
        rounded-lg flex items-center justify-center p-2 aspect-[4/3] relative overflow-hidden shadow-inner`}>
        {/* Grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.5)_20%)] bg-[length:10px_10px] animate-grid-shine"></div>
        {/* Screen glare */}
        <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 animate-screen-glare"></div>
        
        {/* Animated corners */}
        <div className={`absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-tl-lg animate-corner-pulse`}></div>
        <div className={`absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-tr-lg animate-corner-pulse-delay-1`}></div>
        <div className={`absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-bl-lg animate-corner-pulse-delay-2`}></div>
        <div className={`absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-br-lg animate-corner-pulse-delay-3`}></div>
        
        {/* Sparkle effects */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-1" style={{ top: '20%', left: '30%' }}></div>
          <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-2" style={{ top: '70%', left: '80%' }}></div>
          <div className="absolute w-2 h-2 bg-yellow-300 rounded-full animate-sparkle-3" style={{ top: '40%', left: '60%' }}></div>
        </div>

        <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
          {isLoading ? (
            <div className="pokeball-loading">
              <div className="outer-circle" />
              <div className="center-circle" />
            </div>
          ) : pokemon ? (
            <>
              {totalPokemonCount === 0 && (
                <>
                  {/* Outer spinning fireworks */}
                  <div className="absolute inset-[-150%] animate-spin-slow">
                    {[...Array(12)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-10 bg-gradient-to-t from-yellow-500 to-yellow-200 rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${i * 30}deg)`,
                          transformOrigin: '0 0',
                          animation: 'firework 2s ease-in-out infinite',
                          animationDelay: `${i * 0.2}s`,
                        }}
                      />
                    ))}
                  </div>
                  {/* Middle spinning fireworks */}
                  <div className="absolute inset-[-120%] animate-spin-slow-reverse">
                    {[...Array(8)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1 h-8 bg-gradient-to-t from-blue-500 to-blue-200 rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${i * 45 + 22.5}deg)`,
                          transformOrigin: '0 0',
                          animation: 'firework 3s ease-in-out infinite',
                          animationDelay: `${i * 0.3}s`,
                        }}
                      />
                    ))}
                  </div>
                  {/* Inner spinning stars */}
                  <div className="absolute inset-[-80%] animate-spin-slow">
                    {[...Array(6)].map((_, i) => (
                      <div
                        key={i}
                        className="absolute w-1.5 h-6 bg-gradient-to-t from-white to-yellow-100 rounded-full"
                        style={{
                          top: '50%',
                          left: '50%',
                          transform: `rotate(${i * 60}deg)`,
                          transformOrigin: '0 0',
                          animation: 'firework 1.5s ease-in-out infinite',
                          animationDelay: `${i * 0.4}s`,
                        }}
                      />
                    ))}
                  </div>
                </>
              )}
              <PokemonSprite
                pokemonId={pokemon.id}
                className="w-52 h-52 relative z-10 mx-auto"
                isRevealed={true}
                name={i18n.language === 'fr' ? pokemon.frenchName : pokemon.englishName}
              />
              <div className="mt-2 text-center relative z-10 w-full">
                <p className="text-lg font-bold text-gray-800 dark:text-gray-100 relative">
                  <span className="animate-fade-in-up inline-block" style={{ animationDelay: '0.2s' }}>
                    {t('youAre')}
                  </span>{' '}
                  <span className="relative inline-block">
                    <span className="absolute -inset-1 bg-gradient-to-r from-blue-600/30 to-purple-600/30 blur-sm animate-pulse"></span>
                    <span className="relative text-xl md:text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent font-extrabold animate-bounce-gentle">
                      {i18n.language === 'fr' ? pokemon.frenchName : pokemon.englishName}
                    </span>
                  </span>{' '}
                  {pokemon.isShiny ? (
                    <span className="inline-block animate-spin-slow">⭐</span>
                  ) : (
                    <span className="inline-block animate-bounce-gentle" style={{ animationDelay: '0.4s' }}>!</span>
                  )}
                </p>
                {pokemon.isShiny && (
                  <p className="text-yellow-700 dark:text-yellow-400 font-extrabold animate-pulse">
                    ✨ {i18n.language === 'fr' ? 'POKÉMON CHROMATIQUE' : 'SHINY POKÉMON'} ✨
                  </p>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}; 