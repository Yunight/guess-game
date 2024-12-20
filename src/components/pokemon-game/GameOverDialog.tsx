import { FC } from 'react';
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
  criticalHitCount,
  criticalSuccessCount,
  hyperTrainCount,
  maxHypeChain,
  selectedGeneration,
}) => {
  const { t } = useTranslation();

  const handleShare = async () => {
    const getClickbaitMessage = () => {
      if (score >= 50) {
        return t('shareMsg50', { gen: selectedGeneration.name });
      }
      if (score >= 30) {
        return t('shareMsg30', { gen: selectedGeneration.name });
      }
      if (score >= 20) {
        return t('shareMsg20', { gen: selectedGeneration.name });
      }
      if (score >= 10) {
        return t('shareMsg10', { gen: selectedGeneration.name });
      }
      if (userRanking === 1) {
        return t('shareMsgChampion', { gen: selectedGeneration.name });
      }
      if (userRanking && userRanking <= 3) {
        return t('shareMsgTop3', { gen: selectedGeneration.name });
      }
      if (userRanking && userRanking <= 10) {
        return t('shareMsgTop10', { gen: selectedGeneration.name });
      }
      if (maxHypeChain >= 10) {
        return t('shareMsgHypeLegend', { gen: selectedGeneration.name, count: maxHypeChain });
      }
      if (maxHypeChain >= 5) {
        return t('shareMsgHype', { gen: selectedGeneration.name, count: maxHypeChain });
      }
      if (criticalHitCount >= 3) {
        return t('shareMsgCriticalHit', { gen: selectedGeneration.name });
      }
      if (criticalSuccessCount >= 2) {
        return t('shareMsgCriticalSuccess', { gen: selectedGeneration.name });
      }
      if (hyperTrainCount >= 3) {
        return t('shareMsgHypeTrain', { gen: selectedGeneration.name });
      }
      if (rewardPokemon.pokemon?.isLegendary) {
        return t('shareMsgLegendary', { gen: selectedGeneration.name, pokemon: rewardPokemon.pokemon.frenchName });
      }
      if (rewardPokemon.pokemon?.isMythical) {
        return t('shareMsgMythical', { gen: selectedGeneration.name, pokemon: rewardPokemon.pokemon.frenchName });
      }
      return t('shareMsgDefault', { gen: selectedGeneration.name });
    };

    const clickbaitMsg = getClickbaitMessage();
    const shareText = `${clickbaitMsg}\n\n` +
      `👤 ${playerName}\n` +
      `🎯 ${t('score')}: ${score}\n` +
      `⏱️ ${t('time')}: ${formatTimeForRanking(totalTimeElapsed)}\n` +
      `🌍 ${selectedGeneration.name}\n` +
      `${userRanking ? `👑 #${userRanking} ${t('ranking')}!\n` : ''}` +
      `${rewardPokemon.pokemon ? `✨ ${rewardPokemon.pokemon.frenchName} ${t('caught')}!\n` : ''}\n` +
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