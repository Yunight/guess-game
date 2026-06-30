import { Dialog } from "@/components/ui/dialog";
import { ScrollableDialog } from "@/components/ui/scrollable-dialog";
import { useGameOverDialogEffects } from "@/hooks/useGameOverDialogEffects";
import { GameOverActions } from "./GameOverActions";
import { GameOverDialogHeader } from "./GameOverDialogHeader";
import { GameOverStats } from "./GameOverStats";
import { RewardPokemonDisplay } from "./RewardPokemonDisplay";
import type { Pokemon } from "./types";

export interface GameOverDialogProps {
	gameOver: boolean;
	setGameOver: (open: boolean) => void;
	playerName: string;
	score: number;
	bestScore: number;
	bestTime: number;
	userRanking: number | null;
	bestRanking: number | null;
	totalTimeElapsed: number;
	formatTimeForRanking: (seconds: number) => string;
	rewardPokemon: { pokemon: Pokemon | undefined; isLoading: boolean };
	remainingPokemon: number[];
	handleRestart: () => void;
	handleBackToMenu: () => void;
	isMuted: boolean;
	criticalHitCount: number;
	criticalSuccessCount: number;
	hyperTrainCount: number;
	maxHypeChain: number;
	selectedGeneration: { name: string; startId: number; endId: number };
	isSlotMachineRunning: boolean;
	spinningPokemon: Pokemon | undefined;
}

const getGameOverDialogClassName = (isComplete: boolean): string => {
	const gradient = isComplete
		? "bg-gradient-to-b from-yellow-500 to-yellow-600"
		: "bg-gradient-to-b from-red-500 to-red-600";
	return `sm:max-w-md ${gradient} border-none text-white`;
};

export const GameOverDialog = (props: GameOverDialogProps): JSX.Element => {
	const isComplete = props.remainingPokemon.length === 0;
	const {
		shareableUrl,
		isSavingResult,
		urlCopied,
		displayTime,
		onCopyUrl,
		onShare,
	} = useGameOverDialogEffects(props);

	return (
		<Dialog open={props.gameOver} onOpenChange={props.setGameOver}>
			<ScrollableDialog className={getGameOverDialogClassName(isComplete)}>
				<div className="absolute inset-0 bg-[url('/pokeball-pattern.png')] opacity-5 bg-repeat" />
				<div className="relative">
					<GameOverDialogHeader
						isComplete={isComplete}
						playerName={props.playerName}
						selectedGeneration={props.selectedGeneration}
					/>

					<div className="mt-6 space-y-6">
						<RewardPokemonDisplay
							pokemon={props.rewardPokemon.pokemon}
							isLoading={props.rewardPokemon.isLoading}
							selectedGeneration={props.selectedGeneration}
							isSlotMachineRunning={props.isSlotMachineRunning}
							spinningPokemon={props.spinningPokemon}
						/>

						<GameOverStats
							score={props.score}
							bestScore={props.bestScore}
							displayTime={displayTime}
							bestTime={props.bestTime}
							userRanking={props.userRanking}
							bestRanking={props.bestRanking}
							criticalHitCount={props.criticalHitCount}
							criticalSuccessCount={props.criticalSuccessCount}
							hyperTrainCount={props.hyperTrainCount}
							maxHypeChain={props.maxHypeChain}
						/>
					</div>

					<GameOverActions
						shareableUrl={shareableUrl}
						urlCopied={urlCopied}
						isSavingResult={isSavingResult}
						isComplete={isComplete}
						onCopyUrl={onCopyUrl}
						onRestart={props.handleRestart}
						onShare={onShare}
						onBackToMenu={props.handleBackToMenu}
					/>
				</div>
			</ScrollableDialog>
		</Dialog>
	);
};
