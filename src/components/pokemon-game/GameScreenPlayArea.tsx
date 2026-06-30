import { GameScreenControlsSection } from "./GameScreenControlsSection";
import { GameScreenPokemonSection } from "./GameScreenPokemonSection";
import type { GameScreenPlayAreaProps } from "./gameScreenTypes";

export const GameScreenPlayArea = (
	props: GameScreenPlayAreaProps,
): JSX.Element => (
	<div className="flex flex-col flex-1 mt-16 mb-2 relative z-10">
		<GameScreenPokemonSection {...props} />
		<GameScreenControlsSection {...props} />
	</div>
);
