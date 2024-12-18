import { FC } from 'react';
import { Clock, Lightbulb } from 'lucide-react';

interface GameStatsProps {
  score: number;
  guessTimeLeft: number;
  hintsLeft: number;
  formatTime: (seconds: number) => string;
}

export const GameStats: FC<GameStatsProps> = ({
  score,
  guessTimeLeft,
  hintsLeft,
  formatTime,
}) => {
  return (
    <div className="bg-gray-800 text-white rounded-lg mx-2 mb-4 p-1">
      <div className="grid grid-cols-3 gap-1 text-center">
        <div className="space-y-0">
          <p className="text-[10px] text-gray-300">Score</p>
          <p className="text-base font-bold">{score}</p>
        </div>
        <div className="space-y-0">
          <p className="text-[10px] text-gray-300">Temps</p>
          <p className="text-base font-bold flex items-center justify-center">
            <Clock className="w-3 h-3 mr-0.5" />
            {formatTime(guessTimeLeft)}
          </p>
        </div>
        <div className="space-y-0">
          <p className="text-[10px] text-gray-300">Indices</p>
          <p className="text-base font-bold flex items-center justify-center">
            <Lightbulb className="w-3 h-3 mr-0.5" />
            {hintsLeft}
          </p>
        </div>
      </div>
    </div>
  );
}; 