import { LanguageToggle } from "@/components/ui/language-toggle";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

interface MultiplayerPageShellProps {
	children: ReactNode;
}

export const MultiplayerPageShell = ({
	children,
}: MultiplayerPageShellProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<div className="min-h-screen bg-gradient-to-br from-blue-100 to-blue-200 p-4">
			<div className="absolute top-4 left-4 right-4 flex justify-between items-center">
				<Link to="/">
					<Button variant="ghost" size="sm">
						<ArrowLeft className="w-4 h-4 mr-1" />
						{t("backToMenu")}
					</Button>
				</Link>
				<LanguageToggle />
			</div>
			<div className="flex items-center justify-center min-h-screen pt-16">
				{children}
			</div>
		</div>
	);
};
