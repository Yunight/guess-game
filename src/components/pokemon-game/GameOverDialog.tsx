import { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Trophy, RefreshCcw, Home, Star, Clock, Crown } from 'lucide-react';

interface GameOverDialogProps {
  gameOver: boolean;
  setGameOver: (value: boolean) => void;
  playerName: string;
  score: number;
  userRanking: number | null;
  totalTimeElapsed: number;
  formatTimeForRanking: (seconds: number) => string;
  handleRestart: () => void;
  handleBackToMenu: () => void;
}

export const GameOverDialog: FC<GameOverDialogProps> = ({
  gameOver,
  setGameOver,
  playerName,
  score,
  userRanking,
  totalTimeElapsed,
  formatTimeForRanking,
  handleRestart,
  handleBackToMenu,
}) => {
  return (
    <Dialog open={gameOver} onOpenChange={(open) => !open && setGameOver(false)}>
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
              Partie terminée!
            </DialogTitle>
            <DialogDescription className="text-center text-gray-100 font-medium">
              Félicitations, dresseur! Voici vos résultats
            </DialogDescription>
          </DialogHeader>
          
          <div className="mt-6 space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Star className="h-5 w-5" />
                  <p className="text-sm font-medium">Dresseur</p>
                </div>
                <p className="text-lg font-bold">{playerName}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Trophy className="h-5 w-5" />
                  <p className="text-sm font-medium">Score</p>
                </div>
                <p className="text-lg font-bold">{score}</p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Crown className="h-5 w-5" />
                  <p className="text-sm font-medium">Rang</p>
                </div>
                <p className="text-lg font-bold">
                  {userRanking !== null ? `#${userRanking}` : 'Non classé'}
                </p>
              </div>
              
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-yellow-300">
                  <Clock className="h-5 w-5" />
                  <p className="text-sm font-medium">Temps</p>
                </div>
                <p className="text-lg font-bold">{formatTimeForRanking(totalTimeElapsed)}</p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3 pt-2">
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
        </div>
      </DialogContent>
    </Dialog>
  );
}; 