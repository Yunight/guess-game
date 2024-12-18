import { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { RewardPokemonDisplay } from './RewardPokemonDisplay';
import { Pokemon } from './types';
import { Trophy, Clock, Crown, RefreshCcw, Home } from 'lucide-react';

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
}) => {
  return (
    <Dialog open={gameOver} onOpenChange={setGameOver}>
      <DialogContent className="sm:max-w-md bg-gradient-to-b from-red-500 to-red-600 border-none text-white">
        <div className="absolute inset-0 bg-[url('/pokeball-pattern.png')] opacity-5 bg-repeat"></div>
        <div className="relative">
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
          </DialogHeader>

          <RewardPokemonDisplay
            pokemon={rewardPokemon.pokemon}
            isLoading={rewardPokemon.isLoading}
          />

          <div className="mt-6 grid grid-cols-2 gap-4">
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
          </div>

          <div className="grid grid-cols-2 gap-3 mt-6">
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
      </DialogContent>
    </Dialog>
  );
}; 