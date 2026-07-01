import { Button } from "@/components/ui/button";
import { Volume2, VolumeX } from "lucide-react";
import type { FC } from "react";
import { useTranslation } from "react-i18next";

interface MultiplayerGameTopBarProps {
	guessTimeLeft: number;
	totalTimeElapsed: number;
	formatTime: (seconds: number) => string;
	isMuted: boolean;
	onToggleMute: () => void;
	onQuit: () => void;
}

export const MultiplayerGameTopBar: FC<MultiplayerGameTopBarProps> = ({
	guessTimeLeft,
	totalTimeElapsed,
	formatTime,
	isMuted,
	onToggleMute,
	onQuit,
}) => {
	const { t } = useTranslation();

	return (
		<div className="relative z-10 px-2 pt-12 pb-2">
			<div className="absolute top-4 left-4 flex gap-2">
				<div className="w-3 h-3 rounded-full bg-gray-700" />
				<div className="w-3 h-3 rounded-full bg-yellow-400" />
				<div className="w-3 h-3 rounded-full bg-green-500" />
			</div>

			<div className="flex items-center justify-between gap-2">
				<Button
					variant="ghost"
					onClick={onQuit}
					className="text-white hover:text-red-200 hover:bg-white/10 shrink-0"
				>
					{t("quit")}
				</Button>

				<div className="flex flex-col items-center min-w-0">
					<p className="text-xs text-blue-200 uppercase tracking-wide">{t("roundTimer")}</p>
					<p
						className={`text-2xl font-bold font-mono ${
							guessTimeLeft <= 5 ? "text-red-400" : "text-white"
						}`}
					>
						{formatTime(guessTimeLeft)}
					</p>
				</div>

				<div className="flex items-center gap-2 shrink-0">
					<div className="flex flex-col items-end">
						<p className="text-[10px] text-blue-200/80 uppercase tracking-wide">
							{t("matchTimer")}
						</p>
						<p className="text-sm font-mono font-bold text-white/90">
							{formatTime(totalTimeElapsed)}
						</p>
					</div>
					<Button
						variant="ghost"
						size="icon"
						onClick={onToggleMute}
						className="text-white hover:bg-white/10"
					>
						{isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
					</Button>
				</div>
			</div>
		</div>
	);
};
