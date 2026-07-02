import { Card } from "@/components/ui/card";
import type { ReactNode } from "react";
import { GameScreenHypeOverlay } from "./GameScreenHypeOverlay";
import { GameScreenPlayArea } from "./GameScreenPlayArea";
import { GameScreenTopBar } from "./GameScreenTopBar";
import type { GameScreenViewProps } from "./gameScreenViewProps";
import { ScoreIncrease } from "./ScoreIncrease";

export const GameScreen = ({
	topBar,
	hypeOverlayState,
	pokemonSection,
	controlsSection,
}: GameScreenViewProps): ReactNode => (
	<Card className="w-full max-w-md p-1 sm:p-4 relative flex flex-col min-h-0 sm:min-h-0 bg-red-500 rounded-3xl overflow-hidden">
		<GameScreenHypeOverlay overlayState={hypeOverlayState} />

		<GameScreenTopBar
			currentPokemon={topBar.currentPokemon}
			totalTimeElapsed={topBar.totalTimeElapsed}
			formatTime={topBar.formatTime}
			audioState={topBar.audioState}
			setIsMuted={topBar.setIsMuted}
			difficultyMode={topBar.difficultyMode}
			onQuit={topBar.onQuit}
			pointsEarned={topBar.pointsEarned}
			ScoreIncrease={ScoreIncrease}
		/>

		<GameScreenPlayArea
			pokemonSectionProps={pokemonSection}
			controlsSectionProps={controlsSection}
		/>
	</Card>
);
