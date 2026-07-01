import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface ResultsPageErrorProps {
	error: string | null;
}

export const ResultsPageError = ({ error }: ResultsPageErrorProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
			<Card className="p-8 bg-white/10 backdrop-blur-sm border-white/20 text-center">
				<h1 className="text-2xl font-bold text-white mb-4">{t("resultNotFound")}</h1>
				<p className="text-gray-300 mb-6">{error || t("resultNotFoundDesc")}</p>
				<Link to="/">
					<Button className="bg-blue-500 hover:bg-blue-600 text-white">
						<Home className="mr-2 h-4 w-4" />
						{t("backToGame")}
					</Button>
				</Link>
			</Card>
		</div>
	);
};

export const ResultsPageLoading = (): JSX.Element => {
	const { t } = useTranslation();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
			<div className="text-white text-xl">{t("loadingResult")}</div>
		</div>
	);
};
