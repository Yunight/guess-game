import { Button } from "@/components/ui/button";
import { Check, Copy, Home, RefreshCcw, Share2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import {
	getActionsGridMarginClassName,
	getMenuButtonClassName,
	getReplayButtonClassName,
	getShareButtonClassName,
} from "./gameOverActionStyles";

interface GameOverActionsProps {
	shareableUrl: string | null;
	urlCopied: boolean;
	isSavingResult: boolean;
	isComplete: boolean;
	onCopyUrl: () => void;
	onRestart: () => void;
	onShare: () => void;
	onBackToMenu: () => void;
}

export const GameOverActions = ({
	shareableUrl,
	urlCopied,
	isSavingResult,
	isComplete,
	onCopyUrl,
	onRestart,
	onShare,
	onBackToMenu,
}: GameOverActionsProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<>
			{shareableUrl && (
				<div className="mt-4 p-3 bg-white/5 rounded-lg border border-white/10 relative">
					<div className="text-sm text-yellow-300 font-medium mb-2">🔗 {t("shareableLink")}</div>
					<div className="flex items-center gap-2">
						<button
							type="button"
							className="text-xs text-gray-300 break-all font-mono bg-black/20 p-2 rounded flex-1 cursor-pointer hover:bg-black/30 transition-colors text-left"
							onClick={onCopyUrl}
							title={t("copyUrl")}
						>
							{shareableUrl}
						</button>
						<button
							type="button"
							onClick={onCopyUrl}
							className="p-2 bg-black/20 hover:bg-black/40 rounded transition-colors text-gray-300 hover:text-white relative"
							title={t("copyUrl")}
						>
							{urlCopied ? (
								<Check className="h-4 w-4 text-green-400" />
							) : (
								<Copy className="h-4 w-4" />
							)}
							{urlCopied && (
								<div className="absolute -left-20 top-1/2 transform -translate-y-1/2 px-2 py-1 bg-green-500 text-white text-xs rounded shadow-lg animate-fade-in whitespace-nowrap z-50">
									✅ {t("urlCopied")}
								</div>
							)}
						</button>
					</div>
				</div>
			)}

			<div className={`grid grid-cols-3 gap-3 ${getActionsGridMarginClassName(shareableUrl)}`}>
				<Button
					onClick={onRestart}
					className={`${getReplayButtonClassName(isComplete)} text-gray-900 border-none shadow-lg hover:shadow-xl transition-all duration-300 font-bold`}
					size="lg"
				>
					<RefreshCcw className="mr-2 h-4 w-4" />
					{t("replay_button")}
				</Button>
				<Button
					onClick={onShare}
					className={`${getShareButtonClassName(isComplete)} text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 font-bold`}
					size="lg"
					disabled={isSavingResult}
				>
					<Share2 className="mr-2 h-4 w-4" />
					{isSavingResult ? t("saving") : t("share")}
				</Button>
				<Button
					onClick={onBackToMenu}
					className={`${getMenuButtonClassName(isComplete)} text-white border-none shadow-lg hover:shadow-xl transition-all duration-300 font-bold`}
					size="lg"
				>
					<Home className="mr-2 h-4 w-4" />
					{t("menu")}
				</Button>
			</div>
		</>
	);
};
