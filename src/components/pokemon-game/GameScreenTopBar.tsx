import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import type { Pokemon } from "./types";

interface GameScreenTopBarProps {
	currentPokemon: Pokemon | undefined;
	totalTimeElapsed: number;
	formatTime: (seconds: number) => string;
	isMuted: boolean;
	setIsMuted: (value: boolean) => void;
	isHardMode: boolean;
	onQuit: () => void;
	pointsEarned: number;
	ScoreIncrease: React.ComponentType<{ points: number }>;
}

export const GameScreenTopBar = ({
	currentPokemon,
	totalTimeElapsed,
	formatTime,
	isMuted,
	setIsMuted,
	isHardMode,
	onQuit,
	pointsEarned,
	ScoreIncrease,
}: GameScreenTopBarProps): JSX.Element => (
	<>
		<div className="absolute top-4 left-4 flex gap-2 z-10">
			<div className="w-3 h-3 rounded-full bg-gray-700" />
			<div className="w-3 h-3 rounded-full bg-yellow-400" />
			<div className="w-3 h-3 rounded-full bg-green-500" />
		</div>

		<div className="absolute top-2 left-24 w-10 h-10 rounded-full bg-blue-400 border-4 border-white z-10" />

		{!isHardMode && (
			<Button
				variant="ghost"
				onClick={onQuit}
				className="absolute left-4 top-14 text-white hover:text-red-200 hover:bg-white/10 transition-colors font-medium z-10"
			>
				Quitter
			</Button>
		)}

		<div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-lg font-bold text-white h-9 flex items-center bg-black/20 px-4 rounded-full backdrop-blur-sm">
			{formatTime(totalTimeElapsed)}
		</div>

		<div className="absolute top-4 right-16 font-mono text-lg font-bold text-gray-700 h-9 flex items-center">
			#{currentPokemon?.id.toString().padStart(3, "0") || "???"}
		</div>

		{pointsEarned > 0 && <ScoreIncrease points={pointsEarned} />}

		<div className="absolute top-4 right-4">
			<Button
				variant="ghost"
				size="icon"
				onClick={() => setIsMuted(!isMuted)}
				className="hover:bg-white/10"
				data-testid="volume-toggle-button"
			>
				{isMuted ? (
					<VolumeX className="h-5 w-5 text-white" data-testid="volume-x-icon" />
				) : (
					<Volume2 className="h-5 w-5 text-white" data-testid="volume-2-icon" />
				)}
			</Button>
		</div>
	</>
);
