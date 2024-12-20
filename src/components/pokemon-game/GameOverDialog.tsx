import { FC, useEffect, useState } from 'react';
import {
  Dialog,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollableDialog } from '@/components/ui/scrollable-dialog';
import { Button } from '@/components/ui/button';
import { RewardPokemonDisplay } from './RewardPokemonDisplay';
import { Pokemon } from './types';
import { Trophy, Clock, Crown, RefreshCcw, Home, Share2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface GameOverDialogProps {
  gameOver: boolean;
  setGameOver: (open: boolean) => void;
  playerName: string;
  score: number;
  bestScore: number;
  bestTime: number;
  userRanking: number | null;
  totalTimeElapsed: number;
  formatTimeForRanking: (seconds: number) => string;
  rewardPokemon: { pokemon: Pokemon | undefined; isLoading: boolean };
  totalPokemonCount: number;
  handleRestart: () => void;
  handleBackToMenu: () => void;
  isMuted: boolean;
  criticalHitCount: number;
  criticalSuccessCount: number;
  hyperTrainCount: number;
  maxHypeChain: number;
  selectedGeneration: { name: string; startId: number; endId: number };
}

export const GameOverDialog: FC<GameOverDialogProps> = ({
  gameOver,
  setGameOver,
  playerName,
  score,
  bestScore,
  bestTime,
  userRanking,
  totalTimeElapsed,
  formatTimeForRanking,
  rewardPokemon,
  totalPokemonCount,
  handleRestart,
  handleBackToMenu,
  isMuted,
  criticalHitCount,
  criticalSuccessCount,
  hyperTrainCount,
  maxHypeChain,
  selectedGeneration,
}) => {
  const { t, i18n } = useTranslation();
  const [lastPlayedId, setLastPlayedId] = useState<number | null>(null);

  // Add a function to handle cry URL caching
  const getCachedCryUrl = async (pokemonId: number): Promise<{ latest: string; legacy: string }> => {
    const POKEAPI_CACHE_KEY = 'pokeApiCryCache';
    const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

    try {
      // Check cache first
      const cachedData = localStorage.getItem(POKEAPI_CACHE_KEY);
      if (cachedData) {
        const cache = JSON.parse(cachedData);
        if (cache[pokemonId] && Date.now() - cache[pokemonId].timestamp < CACHE_DURATION) {
          console.log('📦 Using cached cry URL for Pokemon:', pokemonId);
          return cache[pokemonId].cries;
        }
      }

      // If not in cache, fetch from PokeAPI
      console.log('🔄 Fetching cry from PokeAPI for Pokemon:', pokemonId);
      const response = await fetch(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      if (!response.ok) throw new Error('Failed to fetch Pokemon cry');
      
      const data = await response.json();
      const cries = data.cries as { latest: string; legacy: string };

      // Update cache
      const newCache = cachedData ? JSON.parse(cachedData) : {};
      newCache[pokemonId] = {
        timestamp: Date.now(),
        cries
      };
      localStorage.setItem(POKEAPI_CACHE_KEY, JSON.stringify(newCache));
      console.log('💾 Cry URL cached successfully');

      return cries;
    } catch (error) {
      console.error('Error fetching cry URL:', error);
      throw error;
    }
  };

  useEffect(() => {
    const playPokemonCry = async () => {
      if (!rewardPokemon.pokemon) {
        console.log('❌ No reward Pokémon available');
        return;
      }
      
      if (rewardPokemon.pokemon.id === lastPlayedId) {
        console.log('⏭️ Skip playing cry - same Pokémon as last time:', lastPlayedId);
        return;
      }
      
      if (isMuted) {
        console.log('🔇 Audio is muted, setting last played ID without playing');
        setLastPlayedId(rewardPokemon.pokemon.id);
        return;
      }

      console.log('🎵 Attempting to play reward Pokemon cry:', {
        pokemonId: rewardPokemon.pokemon.id,
        pokemonName: rewardPokemon.pokemon.englishName,
        frenchName: rewardPokemon.pokemon.frenchName
      });

      try {
        // Get cry URL from cache or PokeAPI
        const cries = await getCachedCryUrl(rewardPokemon.pokemon.id);
        const [latestCry, legacyCry] = [cries.latest, cries.legacy];
        
        console.log('🔊 Playing cry URL:', latestCry);
        const cryAudio = new Audio(latestCry || legacyCry);
        let hasError = false;
        
        // Add event listeners for debugging
        cryAudio.addEventListener('loadstart', () => console.log('🎵 Started loading audio'));
        cryAudio.addEventListener('canplay', () => console.log('✅ Audio can start playing'));
        cryAudio.addEventListener('loadeddata', () => console.log('✅ Audio data loaded successfully'));
        cryAudio.addEventListener('error', (e) => {
          hasError = true;
          const audio = e.currentTarget as HTMLAudioElement;
          console.error('❌ Audio loading error:', {
            src: audio.src,
            networkState: audio.networkState,
            readyState: audio.readyState,
            error: audio.error ? {
              code: audio.error.code,
              message: audio.error.message
            } : null
          });
        });
        
        console.log('⏳ Attempting to play audio...');
        await cryAudio.play();
        
        // Only set lastPlayedId if there was no error
        if (!hasError) {
          setLastPlayedId(rewardPokemon.pokemon.id);
          console.log('✅ Reward Pokemon cry played successfully');
        } else {
          console.log('❌ Not setting lastPlayedId due to error');
        }
      } catch (err) {
        const error = err as Error;
        console.error('❌ Error playing reward Pokemon cry:', {
          name: error.name,
          message: error.message,
          stack: error.stack,
          type: Object.prototype.toString.call(error)
        });
        // Don't set lastPlayedId on error
        console.log('❌ Not setting lastPlayedId due to error');
      }
    };

    playPokemonCry();
  }, [rewardPokemon.pokemon, isMuted, lastPlayedId]);

  const handleShare = async () => {
    const getClickbaitMessage = () => {
      // Get generation name in correct language
      const genNumber = selectedGeneration.name.match(/\d+/)?.[0] || '1';
      const genName = i18n.language === 'fr' 
        ? `${genNumber}ère Génération`
        : `Generation ${genNumber}`;

      if (score >= 2500) {
        return t('shareMsg2500', { gen: genName });
      }
      if (score >= 2250) {
        return t('shareMsg2250', { gen: genName });
      }
      if (score >= 2000) {
        return t('shareMsg2000', { gen: genName });
      }
      if (score >= 1800) {
        return t('shareMsg1800', { gen: genName });
      }
      if (score >= 1600) {
        return t('shareMsg1600', { gen: genName });
      }
      if (score >= 1500) {
        return t('shareMsg1500', { gen: genName });
      }
      if (score >= 1400) {
        return t('shareMsg1400', { gen: genName });
      }
      if (score >= 1300) {
        return t('shareMsg1300', { gen: genName });
      }
      if (score >= 1200) {
        return t('shareMsg1200', { gen: genName });
      }
      if (score >= 1100) {
        return t('shareMsg1100', { gen: genName });
      }
      if (score >= 1000) {
        return t('shareMsg1000', { gen: genName });
      }
      if (score >= 900) {
        return t('shareMsg900', { gen: genName });
      }
      if (score >= 800) {
        return t('shareMsg800', { gen: genName });
      }
      if (score >= 750) {
        return t('shareMsg750', { gen: genName });
      }
      if (score >= 700) {
        return t('shareMsg700', { gen: genName });
      }
      if (score >= 600) {
        return t('shareMsg600', { gen: genName });
      }
      if (score >= 500) {
        return t('shareMsg500', { gen: genName });
      }
      if (score >= 450) {
        return t('shareMsg450', { gen: genName });
      }
      if (score >= 400) {
        return t('shareMsg400', { gen: genName });
      }
      if (score >= 350) {
        return t('shareMsg350', { gen: genName });
      }
      if (score >= 300) {
        return t('shareMsg300', { gen: genName });
      }
      if (score >= 250) {
        return t('shareMsg250', { gen: genName });
      }
      if (score >= 200) {
        return t('shareMsg200', { gen: genName });
      }
      if (score >= 150) {
        return t('shareMsg150', { gen: genName });
      }
      if (score >= 100) {
        return t('shareMsg100', { gen: genName });
      }
      if (score >= 75) {
        return t('shareMsg75', { gen: genName });
      }
      if (score >= 50) {
        return t('shareMsg50', { gen: genName });
      }
      if (userRanking === 1) {
        return t('shareMsgChampion', { gen: genName });
      }
      if (userRanking && userRanking <= 3) {
        return t('shareMsgTop3', { gen: genName });
      }
      if (userRanking && userRanking <= 10) {
        return t('shareMsgTop10', { gen: genName });
      }
      if (maxHypeChain >= 10) {
        return t('shareMsgHypeLegend', { gen: genName, count: maxHypeChain });
      }
      if (maxHypeChain >= 5) {
        return t('shareMsgHype', { gen: genName, count: maxHypeChain });
      }
      if (criticalHitCount >= 3) {
        return t('shareMsgCriticalHit', { gen: genName });
      }
      if (criticalSuccessCount >= 2) {
        return t('shareMsgCriticalSuccess', { gen: genName });
      }
      if (hyperTrainCount >= 3) {
        return t('shareMsgHypeTrain', { gen: genName });
      }
      if (rewardPokemon.pokemon?.isLegendary) {
        return t('shareMsgLegendary', { gen: genName, pokemon: rewardPokemon.pokemon.frenchName });
      }
      if (rewardPokemon.pokemon?.isMythical) {
        return t('shareMsgMythical', { gen: genName, pokemon: rewardPokemon.pokemon.frenchName });
      }
      return t('shareMsgDefault', { gen: genName });
    };

    const clickbaitMsg = getClickbaitMessage();
    // Get generation name in correct language for the share text
    const genNumber = selectedGeneration.name.match(/\d+/)?.[0] || '1';
    const genName = i18n.language === 'fr' 
      ? `${genNumber}ère Génération`
      : `Generation ${genNumber}`;

    const shinyText = rewardPokemon.pokemon?.isShiny ? (i18n.language === 'fr' ? '✨ CHROMATIQUE ✨' : '✨ SHINY ✨') : '';
    const pokemonName = i18n.language === 'fr' 
      ? (rewardPokemon.pokemon?.frenchName ? rewardPokemon.pokemon.frenchName.charAt(0).toUpperCase() + rewardPokemon.pokemon.frenchName.slice(1) : '')
      : (rewardPokemon.pokemon?.englishName ? rewardPokemon.pokemon.englishName.charAt(0).toUpperCase() + rewardPokemon.pokemon.englishName.slice(1) : '');

    const shareText = `${clickbaitMsg}\n\n` +
      `👤 ${playerName}\n` +
      `🎯 ${t('score')}: ${score}\n` +
      `⏱️ ${t('time')}: ${formatTimeForRanking(totalTimeElapsed)}\n` +
      `🌍 ${genName}\n` +
      `${userRanking ? `👑 ${t('myRank')} #${userRanking}!\n` : ''}` +
      `${rewardPokemon.pokemon ? `✨ ${i18n.language === 'fr' ? 'Je suis un' : 'I am'} ${pokemonName} ${shinyText}!\n` : ''}\n` +
      `https://pokemon-guesser-game.vercel.app/\n\n` +
      `#PokemonGuesserGame #Pokemon #PokemonGuesserByYunight #Gaming`;

    try {
      if (navigator.share) {
        await navigator.share({
          text: shareText,
          url: 'https://pokemon-guesser-game.vercel.app/'
        });
      } else {
        // Fallback to Twitter
        const twitterText = encodeURIComponent(shareText);
        const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}`;
        window.open(twitterUrl, '_blank');
      }
    } catch (error) {
      console.error('Error sharing:', error);
      // Fallback to Twitter if share fails
      const twitterText = encodeURIComponent(shareText);
      const twitterUrl = `https://twitter.com/intent/tweet?text=${twitterText}`;
      window.open(twitterUrl, '_blank');
    }
  };

  return (
    <Dialog open={gameOver} onOpenChange={setGameOver}>
      <ScrollableDialog className="sm:max-w-md bg-gradient-to-b from-red-500 to-red-600 border-none text-white">
        <div className="absolute inset-0 bg-[url('/pokeball-pattern.png')] opacity-5 bg-repeat"></div>
        <div className="relative">
          <DialogHeader className="space-y-4">
            <div className="flex justify-center -mt-5">
              <div className="bg-white p-4 rounded-full shadow-xl">
                <Trophy className="h-12 w-12 text-yellow-400" />
              </div>
            </div>
            <DialogTitle className="text-center text-3xl font-bold text-white">
              {score === bestScore && score === totalPokemonCount ? (
                t('congratulations', { name: playerName })
              ) : (
                t('congrats', { name: playerName })
              )}
            </DialogTitle>
            <DialogDescription className="text-center text-white/80">
              {t('results')}
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <RewardPokemonDisplay
              pokemon={rewardPokemon.pokemon}
              isLoading={rewardPokemon.isLoading}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Trophy className="h-5 w-5" />
                  <p className="text-sm font-medium">{t('score')}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-200">{t('current')}:</span>
                    <p className="text-lg font-bold">{score}</p>
                  </div>
                  {bestScore > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">{t('best')}:</span>
                      <p className="text-lg font-bold text-yellow-300">{bestScore}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Clock className="h-5 w-5" />
                  <p className="text-sm font-medium">{t('time')}</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-200">{t('current')}:</span>
                    <p className="text-lg font-bold">{formatTimeForRanking(totalTimeElapsed)}</p>
                  </div>
                  {bestTime > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">{t('best')}:</span>
                      <p className="text-lg font-bold text-yellow-300">{formatTimeForRanking(bestTime)}</p>
                    </div>
                  )}
                </div>
              </div>

              {userRanking && (
                <div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-yellow-300">
                    <Crown className="h-5 w-5" />
                    <p className="text-sm font-medium">{t('ranking')}</p>
                  </div>
                  <p className="text-2xl font-bold text-center">#{userRanking}</p>
                </div>
              )}

              {/* Game Stats */}
              <div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Trophy className="h-5 w-5" />
                  <p className="text-sm font-medium">{t('statistics')}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">{t('criticalHits')}:</span>
                      <p className="text-lg font-bold text-yellow-300">{criticalHitCount}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">{t('criticalSuccesses')}:</span>
                      <p className="text-lg font-bold text-yellow-300">{criticalSuccessCount}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">{t('hypeTrain_stat')}:</span>
                      <p className="text-lg font-bold text-yellow-300">{hyperTrainCount}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">{t('maxHype')}:</span>
                      <p className="text-lg font-bold text-yellow-300">{maxHypeChain}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-6">
            <Button
              onClick={handleRestart}
              className="bg-yellow-400 hover:bg-yellow-500 text-gray-900 border-none
                shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
              size="lg"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              {t('replay_button')}
            </Button>
            <Button
              onClick={handleShare}
              className="bg-green-500 hover:bg-green-600 text-white border-none
                shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
              size="lg"
            >
              <Share2 className="mr-2 h-4 w-4" />
              {t('share')}
            </Button>
            <Button
              onClick={handleBackToMenu}
              className="bg-blue-500 hover:bg-blue-600 text-white border-none
                shadow-lg hover:shadow-xl transition-all duration-300 font-bold"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              {t('menu')}
            </Button>
          </div>
        </div>
      </ScrollableDialog>
    </Dialog>
  );
}; 