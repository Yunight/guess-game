import type { GameResult } from "../../services/gameResultsService";
import type { UseResultsPageResult } from "./useResultsPage";
import { ResultsPageError, ResultsPageLoading } from "./ResultsPageStates";
import { ResultsPageContent } from "./ResultsPageContent";

export const ResultsPageView = ({
	gameResult,
	loading,
	error,
	urlCopied,
	debugMode,
	debugRemainingPokemon,
	setDebugRemainingPokemon,
	copyUrl,
	handleShare,
}: UseResultsPageResult): JSX.Element => {
	if (loading) {
		return <ResultsPageLoading />;
	}

	if (error || !gameResult) {
		return <ResultsPageError error={error} />;
	}

	return (
		<ResultsPageContent
			gameResult={gameResult}
			urlCopied={urlCopied}
			debugMode={debugMode}
			debugRemainingPokemon={debugRemainingPokemon}
			setDebugRemainingPokemon={setDebugRemainingPokemon}
			copyUrl={copyUrl}
			handleShare={handleShare}
		/>
	);
};
