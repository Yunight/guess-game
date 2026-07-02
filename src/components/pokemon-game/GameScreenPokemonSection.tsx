import type { ReactNode } from "react";
import { GameScreenCriticalBanner } from "./GameScreenCriticalBanner";
import { PokemonDisplay } from "./PokemonDisplay";
import type { Pokemon } from "./types";

interface GameScreenPokemonSectionProps {
	pokemonDisplayProps: {
		currentPokemon: Pokemon | undefined;
		loadingState: "loading" | "ready";
		answerState: "unknown" | "correct" | "incorrect";
		audioState: "muted" | "unmuted";
		guessTimeLeft: number;
		remainingCount: number;
		totalCount: number;
		progressCounterState?: "visible" | "hidden";
	};
	banner: {
		type: "none" | "critical_success" | "critical_hit" | "hype_train";
		criticalSuccessLabel: string;
		criticalHitLabel: string;
		hypeTrainLabel: string;
	};
}

export const GameScreenPokemonSection = ({
	pokemonDisplayProps,
	banner,
}: GameScreenPokemonSectionProps): ReactNode => (
	<div className="relative">
		<PokemonDisplay {...pokemonDisplayProps} />

		<GameScreenCriticalBanner
			showCriticalSuccess={banner.type === "critical_success"}
			showCriticalHit={banner.type === "critical_hit"}
			showHypeTrain={banner.type === "hype_train"}
			criticalSuccessLabel={banner.criticalSuccessLabel}
			criticalHitLabel={banner.criticalHitLabel}
			hypeTrainLabel={banner.hypeTrainLabel}
		/>
	</div>
);
