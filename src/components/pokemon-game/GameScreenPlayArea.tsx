import type { ReactNode } from "react";
import { GameScreenControlsSection } from "./GameScreenControlsSection";
import { GameScreenPokemonSection } from "./GameScreenPokemonSection";
import type { GameScreenPlayAreaProps } from "./gameScreenTypes";

interface GameScreenPlayAreaSectionProps {
	pokemonSectionProps: Parameters<typeof GameScreenPokemonSection>[0];
	controlsSectionProps: GameScreenPlayAreaProps;
}

export const GameScreenPlayArea = ({
	pokemonSectionProps,
	controlsSectionProps,
}: GameScreenPlayAreaSectionProps): ReactNode => (
	<div className="flex flex-col flex-1 mt-16 mb-2 relative z-10">
		<GameScreenPokemonSection {...pokemonSectionProps} />
		<GameScreenControlsSection {...controlsSectionProps} />
	</div>
);
