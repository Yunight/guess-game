import type { GameResult } from "@/services/gameResultsService";
import { formatTimeForRanking } from "@/utils/gameFormatters";

export type LoadGameResultOutcome =
	| { status: "missingId" }
	| { status: "success"; result: GameResult }
	| { status: "notFound" }
	| { status: "error" };

export const loadGameResult = async (
	resultId: string | undefined,
	getGameResult: (id: string) => Promise<GameResult | null>,
): Promise<LoadGameResultOutcome> => {
	if (!resultId) {
		return { status: "missingId" };
	}

	try {
		const result = await getGameResult(resultId);
		if (result) {
			return { status: "success", result };
		}
		return { status: "notFound" };
	} catch {
		return { status: "error" };
	}
};

export const formatResultsPageTime = formatTimeForRanking;

export const computeRemainingPokemon = (
	debugRemainingPokemon: number | null,
	remainingPokemonLength: number,
): number => {
	return debugRemainingPokemon !== null
		? debugRemainingPokemon
		: remainingPokemonLength;
};

export const computeTotalPokemonInGeneration = (
	startId: number,
	endId: number,
): number => {
	return endId - startId + 1;
};
