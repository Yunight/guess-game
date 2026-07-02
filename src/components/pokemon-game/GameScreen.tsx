import { Card } from "@/components/ui/card";
import type { FC } from "react";
import { useTranslation } from "react-i18next";
import { GameScreenHypeOverlay } from "./GameScreenHypeOverlay";
import { GameScreenPlayArea } from "./GameScreenPlayArea";
import { GameScreenTopBar } from "./GameScreenTopBar";
import type { GameScreenPlayAreaProps } from "./gameScreenTypes";
import { ScoreIncrease } from "./ScoreIncrease";

interface GameScreenProps extends Omit<
	GameScreenPlayAreaProps,
	"criticalSuccessLabel" | "criticalHitLabel" | "hypeTrainLabel"
> {
	setIsMuted: (value: boolean) => void;
	totalTimeElapsed: number;
	onQuit: () => void;
	isHardMode: boolean;
	pointsEarned: number;
}

export const GameScreen: FC<GameScreenProps> = (props) => {
	const { t } = useTranslation();

	return (
		<Card className="w-full max-w-md p-1 sm:p-4 relative flex flex-col min-h-0 sm:min-h-0 bg-red-500 rounded-3xl overflow-hidden">
			<GameScreenHypeOverlay showHypeTrain={props.showHypeTrain} />

			<GameScreenTopBar
				currentPokemon={props.currentPokemon}
				totalTimeElapsed={props.totalTimeElapsed}
				formatTime={props.formatTime}
				isMuted={props.isMuted}
				setIsMuted={props.setIsMuted}
				isHardMode={props.isHardMode}
				onQuit={props.onQuit}
				pointsEarned={props.pointsEarned}
				ScoreIncrease={ScoreIncrease}
			/>

			<GameScreenPlayArea
				pokemonSectionProps={{
					pokemonDisplayProps: {
						currentPokemon: props.currentPokemon,
						loadingState: props.isPokemonLoading ? "loading" : "ready",
						answerState:
							props.isCorrect === null
								? "unknown"
								: props.isCorrect
									? "correct"
									: "incorrect",
						audioState: props.isMuted ? "muted" : "unmuted",
						guessTimeLeft: props.guessTimeLeft,
						remainingCount: props.remainingCount,
						totalCount: props.totalCount,
						progressCounterState: props.showProgressCounter === false ? "hidden" : "visible",
					},
					banner: {
						type: props.showCriticalSuccess
							? "critical_success"
							: props.showCriticalHit
								? "critical_hit"
								: props.showHypeTrain
									? "hype_train"
									: "none",
						criticalSuccessLabel: t("criticalSuccess"),
						criticalHitLabel: t("criticalHit"),
						hypeTrainLabel: t("hypeTrain", {
							count: props.consecutiveFastAnswers,
						}),
					},
				}}
				controlsSectionProps={{
					...props,
					criticalSuccessLabel: t("criticalSuccess"),
					criticalHitLabel: t("criticalHit"),
					hypeTrainLabel: t("hypeTrain", {
						count: props.consecutiveFastAnswers,
					}),
				}}
			/>
		</Card>
	);
};
