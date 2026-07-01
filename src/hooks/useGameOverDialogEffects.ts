import type { GameOverDialogProps } from "@/components/pokemon-game/GameOverDialog";
import { useGameOverCryEffect } from "./useGameOverCryEffect";
import { useGameOverSaveEffect } from "./useGameOverSaveEffect";
import { useGameOverShareState } from "./useGameOverShareState";

export type UseGameOverDialogEffectsParams = Pick<
	GameOverDialogProps,
	| "gameOver"
	| "playerName"
	| "score"
	| "totalTimeElapsed"
	| "userRanking"
	| "remainingPokemon"
	| "rewardPokemon"
	| "isSlotMachineRunning"
	| "isMuted"
	| "selectedGeneration"
	| "criticalHitCount"
	| "criticalSuccessCount"
	| "hyperTrainCount"
	| "maxHypeChain"
	| "formatTimeForRanking"
>;

export interface UseGameOverDialogEffectsResult {
	shareableUrl: string | null;
	isSavingResult: boolean;
	urlCopied: boolean;
	displayTime: number;
	onCopyUrl: () => void;
	onShare: () => void;
}

export const useGameOverDialogEffects = (
	params: UseGameOverDialogEffectsParams,
): UseGameOverDialogEffectsResult => {
	const { shareableUrl, isSavingResult, displayTime } = useGameOverSaveEffect(params);

	useGameOverCryEffect(params);

	const { urlCopied, onCopyUrl, onShare } = useGameOverShareState({
		...params,
		shareableUrl,
	});

	return {
		shareableUrl,
		isSavingResult,
		urlCopied,
		displayTime,
		onCopyUrl,
		onShare,
	};
};
