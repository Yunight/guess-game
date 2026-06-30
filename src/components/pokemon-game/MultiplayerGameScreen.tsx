import { Card } from "@/components/ui/card";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { GameScreenInputArea } from "./GameScreenInputArea";
import { GameScreenPokemonSection } from "./GameScreenPokemonSection";
import { MultiplayerGameTopBar } from "./MultiplayerGameTopBar";
import { MultiplayerScoreBar } from "./MultiplayerScoreBar";
import type { Pokemon } from "./types";
import type { useMultiplayerGameController } from "@/hooks/useMultiplayerGameController";
import { formatTimeForRanking } from "@/utils/gameFormatters";

type Controller = ReturnType<typeof useMultiplayerGameController>;

interface MultiplayerGameScreenProps {
	controller: Controller;
	localPlayerId: string;
	roundWinnerId: string | null;
}

export const MultiplayerGameScreen: FC<MultiplayerGameScreenProps> = ({
	controller,
	localPlayerId,
	roundWinnerId,
}) => {
	const { t } = useTranslation();

	const localPlayerWonRound =
		roundWinnerId !== null && roundWinnerId === localPlayerId;

	return (
		<Card className="w-full max-w-md p-1 sm:p-4 relative flex flex-col min-h-0 bg-red-500 rounded-3xl overflow-hidden">
			<MultiplayerGameTopBar
				guessTimeLeft={controller.guessTimeLeft}
				totalTimeElapsed={controller.totalTimeElapsed}
				formatTime={formatTimeForRanking}
				isMuted={controller.isMuted}
				onToggleMute={() => controller.setIsMuted(!controller.isMuted)}
				onQuit={controller.handleQuit}
			/>

			<div className="flex flex-col flex-1 mt-4 mb-2 relative z-10 gap-3">
				<MultiplayerScoreBar
					hostName={controller.hostName}
					guestName={controller.guestName}
					hostScore={controller.hostScore}
					guestScore={controller.guestScore}
					hostPlayerId={controller.hostPlayerId}
					localPlayerId={localPlayerId}
					roundWinnerName={controller.roundWinnerName}
					roundPointsEarned={controller.roundPointsEarned}
					localPlayerWonRound={localPlayerWonRound}
					roundNumber={controller.roundNumber}
					submitError={controller.submitError}
					remainingCount={controller.remainingCount}
					totalCount={controller.totalCount}
				/>

				<GameScreenPokemonSection
					currentPokemon={controller.currentPokemon as Pokemon | undefined}
					isPokemonLoading={controller.isPokemonLoading}
					isCorrect={controller.isCorrect}
					isMuted={controller.isMuted}
					guessTimeLeft={controller.guessTimeLeft}
					remainingCount={controller.remainingCount}
					totalCount={controller.totalCount}
					showProgressCounter={false}
					score={controller.localScore}
					bestScore={0}
					hintsLeft={0}
					guess={controller.guess}
					handleGuessChange={controller.handleGuessChange}
					handleKeyDown={controller.handleKeyDown}
					suggestions={controller.suggestions}
					handleSuggestionClick={controller.handleSuggestionClick}
					highlightedIndex={controller.highlightedIndex}
					showHint={false}
					useHint={() => undefined}
					inputRef={controller.inputRef}
					suggestionsRef={controller.suggestionsRef}
					formatTime={formatTimeForRanking}
					showCriticalSuccess={controller.showCriticalSuccess}
					showCriticalHit={controller.showCriticalHit}
					showHypeTrain={false}
					consecutiveFastAnswers={0}
					criticalSuccessLabel={t("criticalSuccess")}
					criticalHitLabel={t("criticalHit")}
					hypeTrainLabel=""
				/>

				<GameScreenInputArea
					guess={controller.guess}
					handleGuessChange={controller.handleGuessChange}
					handleKeyDown={controller.handleKeyDown}
					suggestions={controller.suggestions}
					handleSuggestionClick={controller.handleSuggestionClick}
					highlightedIndex={controller.highlightedIndex}
					inputRef={controller.inputRef}
					suggestionsRef={controller.suggestionsRef}
					isCorrect={controller.isCorrect}
					guessTimeLeft={controller.guessTimeLeft}
				/>
			</div>
		</Card>
	);
};
