import { GameScreenCriticalBanner } from "./GameScreenCriticalBanner";
import { PokemonDisplay } from "./PokemonDisplay";
import type { GameScreenPlayAreaProps } from "./gameScreenTypes";

export const GameScreenPokemonSection = (
	props: GameScreenPlayAreaProps,
): JSX.Element => (
	<div className="relative">
		<PokemonDisplay
			currentPokemon={props.currentPokemon}
			isPokemonLoading={props.isPokemonLoading}
			isCorrect={props.isCorrect}
			isMuted={props.isMuted}
			guessTimeLeft={props.guessTimeLeft}
			remainingCount={props.remainingCount}
			totalCount={props.totalCount}
		/>

		<GameScreenCriticalBanner
			showCriticalSuccess={props.showCriticalSuccess}
			showCriticalHit={props.showCriticalHit}
			showHypeTrain={props.showHypeTrain}
			criticalSuccessLabel={props.criticalSuccessLabel}
			criticalHitLabel={props.criticalHitLabel}
			hypeTrainLabel={props.hypeTrainLabel}
		/>
	</div>
);
