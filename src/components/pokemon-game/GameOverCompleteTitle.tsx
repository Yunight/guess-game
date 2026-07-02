import type { ReactNode } from "react";
import {
	getGenerationCompletedSubtitle,
	getLegendaryMasterTitle,
} from "./gameOverDialogHeaderCopy";

interface GameOverCompleteTitleProps {
	language: string;
}

export const GameOverCompleteTitle = ({ language }: GameOverCompleteTitleProps): ReactNode => (
	<div className="space-y-2">
		<div className="text-3xl font-extrabold text-yellow-100 animate-pulse">
			{getLegendaryMasterTitle(language)}
		</div>
		<div className="text-lg font-medium text-yellow-200">
			{getGenerationCompletedSubtitle(language)}
		</div>
	</div>
);
