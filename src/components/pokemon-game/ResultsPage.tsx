import type { ReactNode } from "react";
import { useResultsPage } from "./useResultsPage";
import { ResultsPageView } from "./ResultsPageView";

const ResultsPage = (): ReactNode => {
	const resultsPageState = useResultsPage();
	return <ResultsPageView {...resultsPageState} />;
};

export default ResultsPage;
