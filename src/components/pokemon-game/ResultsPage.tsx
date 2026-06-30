import { useResultsPage } from "./useResultsPage";
import { ResultsPageView } from "./ResultsPageView";

const ResultsPage = (): JSX.Element => {
	const resultsPageState = useResultsPage();
	return <ResultsPageView {...resultsPageState} />;
};

export default ResultsPage;
