import type { FC } from "react";

interface ScoreIncreaseProps {
	points: number;
	className?: string;
}

export const ScoreIncrease: FC<ScoreIncreaseProps> = ({
	points,
	className = "absolute right-16 top-12 z-50 pointer-events-none",
}) => {
	const isBonus = points >= 3;

	return (
		<div className={className}>
			<div
				className={`animate-float-up-fade-out text-2xl whitespace-nowrap px-3 py-1 rounded-full backdrop-blur-sm border shadow-lg ${
					isBonus
						? "text-yellow-300 bg-purple-900/80 border-yellow-400 font-bold scale-110"
						: "text-green-400 bg-black/50 border-green-500"
				}`}
			>
				+{points}
				{isBonus && <span className="ml-1">🎯</span>}
			</div>
		</div>
	);
};
