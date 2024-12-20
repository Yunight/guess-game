import { FC, useRef } from 'react';
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
import html2canvas from 'html2canvas';

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
}) => {
  const dialogContentRef = useRef<HTMLDivElement>(null);

  const handleShare = async () => {
    if (!dialogContentRef.current) return;

    try {
      // Hide buttons before capturing
      const buttons = dialogContentRef.current.querySelectorAll('button');
      buttons.forEach(button => button.style.display = 'none');

      const canvas = await html2canvas(dialogContentRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
      });

      // Show buttons again
      buttons.forEach(button => button.style.display = '');

      // Convert canvas to blob
      const blob = await new Promise<Blob>((resolve) => {
        canvas.toBlob((blob) => {
          resolve(blob!);
        }, 'image/png');
      });

      // Create file from blob
      const file = new File([blob], 'pokemon-game-result.png', { type: 'image/png' });

      // Share the image
      if (navigator.share && navigator.canShare({ files: [file] })) {
        await navigator.share({
          files: [file],
          title: 'Mes résultats Pokémon Quiz!',
          text: `J'ai deviné ${score} Pokémon${score > 1 ? 's' : ''} en ${formatTimeForRanking(totalTimeElapsed)}! Peux-tu faire mieux?`,
        });
      } else {
        // Fallback for browsers that don't support native sharing
        const tweetText = encodeURIComponent(
          `J'ai deviné ${score} Pokémon${score > 1 ? 's' : ''} en ${formatTimeForRanking(totalTimeElapsed)} sur Pokémon Quiz! Peux-tu faire mieux? #PokemonQuiz`
        );
        window.open(`https://twitter.com/intent/tweet?text=${tweetText}`, '_blank');
      }
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  return (
    <Dialog open={gameOver} onOpenChange={setGameOver}>
      <ScrollableDialog className="sm:max-w-md bg-gradient-to-b from-red-500 to-red-600 border-none text-white">
        <div className="absolute inset-0 bg-[url('/pokeball-pattern.png')] opacity-5 bg-repeat"></div>
        <div className="relative" ref={dialogContentRef}>
          <DialogHeader className="space-y-4">
            <div className="flex justify-center -mt-8">
              <div className="bg-white p-4 rounded-full shadow-xl">
                <Trophy className="h-12 w-12 text-yellow-400" />
              </div>
            </div>
            <DialogTitle className="text-center text-3xl font-bold text-white">
              {score === bestScore && score === totalPokemonCount ? (
                `Félicitations ${playerName}, vous avez deviné tous les pokémons, vous êtes un vrai maitre pokémon!`
              ) : (
                `Bravo ${playerName}!`
              )}
            </DialogTitle>
            <DialogDescription className="text-center text-white/80">
              Voici vos résultats pour cette partie.
            </DialogDescription>
          </DialogHeader>

          <div className="mt-6 space-y-6">
            <RewardPokemonDisplay
              pokemon={rewardPokemon.pokemon}
              isLoading={rewardPokemon.isLoading}
              isMuted={isMuted}
            />

            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Trophy className="h-5 w-5" />
                  <p className="text-sm font-medium">Score</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-200">Actuel:</span>
                    <p className="text-lg font-bold">{score}</p>
                  </div>
                  {bestScore > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">Meilleur:</span>
                      <p className="text-lg font-bold text-yellow-300">{bestScore}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Clock className="h-5 w-5" />
                  <p className="text-sm font-medium">Temps</p>
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-200">Actuel:</span>
                    <p className="text-lg font-bold">{formatTimeForRanking(totalTimeElapsed)}</p>
                  </div>
                  {bestTime > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">Meilleur:</span>
                      <p className="text-lg font-bold text-yellow-300">{formatTimeForRanking(bestTime)}</p>
                    </div>
                  )}
                </div>
              </div>

              {userRanking && (
                <div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                  <div className="flex items-center gap-2 text-yellow-300">
                    <Crown className="h-5 w-5" />
                    <p className="text-sm font-medium">Classement</p>
                  </div>
                  <p className="text-2xl font-bold text-center">#{userRanking}</p>
                </div>
              )}

              {/* Game Stats */}
              <div className="col-span-2 bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Trophy className="h-5 w-5" />
                  <p className="text-sm font-medium">Statistiques</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">Coup Critique:</span>
                      <p className="text-lg font-bold text-yellow-300">{criticalHitCount}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">Succès Critique:</span>
                      <p className="text-lg font-bold text-yellow-300">{criticalSuccessCount}</p>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">Hype Train :</span>
                      <p className="text-lg font-bold text-yellow-300">{hyperTrainCount}</p>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-200">Max Hype :</span>
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
                shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <RefreshCcw className="mr-2 h-4 w-4" />
              Rejouer
            </Button>
            <Button
              onClick={handleShare}
              className="bg-blue-500 hover:bg-blue-600 text-white border-none
                shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <Share2 className="mr-2 h-4 w-4" />
              Partager
            </Button>
            <Button
              onClick={handleBackToMenu}
              className="bg-white/10 hover:bg-white/20 text-white border-2 border-white/20
                shadow-lg hover:shadow-xl transition-all duration-300"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Menu
            </Button>
          </div>
        </div>
      </ScrollableDialog>
    </Dialog>
  );
}; 