import { GameScreenInputArea } from "./GameScreenInputArea";
import { GameStats } from "./GameStats";
import { HintButton } from "./HintButton";
import type { GameScreenPlayAreaProps } from "./gameScreenTypes";

export const GameScreenControlsSection = (props: GameScreenPlayAreaProps): JSX.Element => (
	<>
		<GameStats
			score={props.score}
			bestScore={props.bestScore}
			guessTimeLeft={props.guessTimeLeft}
			hintsLeft={props.hintsLeft}
			formatTime={props.formatTime}
			bestTime={props.bestTime}
		/>

		<GameScreenInputArea
			guess={props.guess}
			handleGuessChange={props.handleGuessChange}
			handleKeyDown={props.handleKeyDown}
			suggestions={props.suggestions}
			handleSuggestionClick={props.handleSuggestionClick}
			highlightedIndex={props.highlightedIndex}
			inputRef={props.inputRef}
			suggestionsRef={props.suggestionsRef}
			isCorrect={props.isCorrect}
			guessTimeLeft={props.guessTimeLeft}
		/>

		<div className="mt-2">
			<HintButton
				showHint={props.showHint}
				useHint={props.useHint}
				hintsLeft={props.hintsLeft}
				currentPokemon={props.currentPokemon}
				isPokemonLoading={props.isPokemonLoading}
			/>
		</div>
	</>
);
