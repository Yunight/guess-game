import { FC } from 'react';

interface ScoreIncreaseProps {
  points: number;
}

export const ScoreIncrease: FC<ScoreIncreaseProps> = ({ points }) => {
  return (
    <div className="absolute right-16 top-12 z-50 pointer-events-none">
      <div className="animate-float-up-fade-out text-yellow-300 font-bold text-2xl whitespace-nowrap px-3 py-1 bg-black/50 rounded-full backdrop-blur-sm border border-yellow-400 shadow-lg">
        +{points}
      </div>
    </div>
  );
}; 