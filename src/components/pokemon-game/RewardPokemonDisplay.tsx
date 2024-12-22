import { FC } from 'react';
import type { Pokemon } from './types';
import { Generation } from './types';
import { useTranslation } from 'react-i18next';

interface RewardPokemonDisplayProps {
  pokemon: Pokemon | undefined;
  isLoading: boolean;
  totalPokemonCount: number;
  selectedGeneration: Generation;
}

const getRegionName = (generation: Generation): string => {
  switch (generation.startId) {
    case 1:
      return 'Kanto';
    case 152:
      return 'Johto';
    case 252:
      return 'Hoenn';
    case 387:
      return 'Sinnoh';
    case 494:
      return 'Unova';
    case 650:
      return 'Kalos';
    case 722:
      return 'Alola';
    case 810:
      return 'Galar';
    case 906:
      return 'Paldea';
    default:
      return '';
  }
};

export const RewardPokemonDisplay: FC<RewardPokemonDisplayProps> = ({
  pokemon,
  isLoading,
  totalPokemonCount,
  selectedGeneration
}) => {
  const { t, i18n } = useTranslation();

  return (
    <div className="mt-4 bg-gradient-to-b from-gray-800 to-gray-900 rounded-lg p-2 shadow-lg">
      {/* Congratulatory message */}
      {totalPokemonCount === 0 ? (
        <>
          {/* Main celebration content */}
          <div className="relative px-4 py-6 bg-gradient-to-b from-yellow-400/90 to-yellow-500/90 rounded-2xl shadow-2xl">
            <div className="absolute inset-0 bg-[url('/pokeball-pattern.png')] opacity-10"></div>
            
            {/* Main content */}
            <div className="space-y-4 relative">
              <div className="text-6xl flex justify-center items-center gap-3">
                <span className="animate-bounce" style={{ animationDelay: "0s" }}>🏆</span>
                <span className="animate-bounce" style={{ animationDelay: "0.2s" }}>👑</span>
                <span className="animate-bounce" style={{ animationDelay: "0.4s" }}>🏆</span>
              </div>
              
              <div className="text-center">
                <h2 className="text-3xl font-bold text-black mb-2">
                  MAÎTRE POKÉMON LÉGENDAIRE!
                </h2>
                <p className="text-xl text-black font-semibold">
                  Tu as trouvé tous les Pokémon de {getRegionName(selectedGeneration)} !
                </p>
              </div>

              {/* Bottom decorative elements */}
              <div className="flex justify-center gap-4 text-2xl">
                {['⭐️', '🌟', '⭐️', '🌟', '⭐️'].map((star, i) => (
                  <span key={i} className="animate-pulse" style={{ animationDelay: `${i * 0.15}s` }}>{star}</span>
                ))}
              </div>
            </div>
          </div>
        </>
      ) : (
        <div className={`bg-gradient-to-br ${pokemon?.isShiny ? 'from-yellow-100/90 to-yellow-300/90' : 'from-blue-100/90 to-blue-300/90'} 
          rounded-lg flex flex-col items-center justify-center p-2 aspect-[4/3] relative overflow-hidden shadow-inner`}>
          {/* Sparkle grid background */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.5)_20%)] bg-[length:10px_10px] animate-grid-shine"></div>
          {/* Screen glare effect */}
          <div className="absolute inset-0 bg-gradient-to-br from-white/40 to-transparent opacity-50 animate-screen-glare"></div>
          
          {/* Animated corners */}
          <div className={`absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-tl-lg animate-corner-pulse`}></div>
          <div className={`absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-tr-lg animate-corner-pulse-delay-1`}></div>
          <div className={`absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-bl-lg animate-corner-pulse-delay-2`}></div>
          <div className={`absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 ${pokemon?.isShiny ? 'border-yellow-400' : 'border-blue-400'} rounded-br-lg animate-corner-pulse-delay-3`}></div>
          
          {isLoading ? (
            <div className="w-24 h-24 animate-spin">
              <img src="/pokeball.svg" alt="Loading..." className="w-full h-full" />
            </div>
          ) : pokemon ? (
            <div className="relative flex flex-col items-center justify-center w-full">
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
              <img
                src={pokemon.sprite}
                alt={i18n.language === 'fr' ? pokemon.frenchName : pokemon.englishName}
                className="w-52 h-52 object-contain relative z-10 mx-auto"
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
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}; 