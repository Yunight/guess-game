import { FC } from 'react';

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
    <div className="mx-2 bg-gradient-to-b from-gray-900 to-gray-800 rounded-b-lg p-4 shadow-lg border-t-2 border-blue-500/30">
      <div className="grid grid-cols-3 gap-4">
        {/* Score */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-3 text-center relative overflow-hidden backdrop-blur-sm border border-white/10">
          <div className="absolute inset-0 bg-blue-400/5"></div>
          <div className="relative z-10">
            <div className="text-xs text-blue-200 mb-1 font-medium">Score</div>
            <div className="text-2xl font-bold text-white font-mono">{score}</div>
          </div>
        </div>

        {/* Timer */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-3 text-center relative overflow-hidden backdrop-blur-sm border border-white/10">
          <div className="absolute inset-0 bg-blue-400/5"></div>
          <div className="relative z-10">
            <div className="text-xs text-blue-200 mb-1 font-medium">Temps</div>
            <div className={`text-2xl font-bold font-mono transition-colors duration-300
              ${guessTimeLeft <= 5 ? 'text-red-400' : 'text-white'}`}>
              {formatTime(guessTimeLeft)}
            </div>
          </div>
        </div>

        {/* Hints */}
        <div className="bg-gradient-to-br from-blue-500/10 to-blue-600/10 rounded-lg p-3 text-center relative overflow-hidden backdrop-blur-sm border border-white/10">
          <div className="absolute inset-0 bg-blue-400/5"></div>
          <div className="relative z-10">
            <div className="text-xs text-blue-200 mb-1 font-medium">Indices</div>
            <div className="text-2xl font-bold text-white font-mono">{hintsLeft}</div>
          </div>
        </div>
      </div>
    </div>
  );
}; 