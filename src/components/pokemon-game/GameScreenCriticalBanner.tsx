interface GameScreenCriticalBannerProps {
	showCriticalSuccess: boolean;
	showCriticalHit: boolean;
	showHypeTrain: boolean;
	criticalSuccessLabel: string;
	criticalHitLabel: string;
	hypeTrainLabel: string;
}

export const GameScreenCriticalBanner = ({
	showCriticalSuccess,
	showCriticalHit,
	showHypeTrain,
	criticalSuccessLabel,
	criticalHitLabel,
	hypeTrainLabel,
}: GameScreenCriticalBannerProps): JSX.Element | null => {
	if (!showCriticalSuccess && !showCriticalHit && !showHypeTrain) {
		return null;
	}

	return (
		<div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-50 pointer-events-none">
			{showCriticalSuccess && (
				<div className="animate-float-up-fade-out text-yellow-300 font-bold text-xl whitespace-nowrap px-4 py-2 bg-black/80 rounded-full backdrop-blur-sm border-2 border-yellow-400 shadow-lg">
					{criticalSuccessLabel}
				</div>
			)}
			{!showCriticalSuccess && showCriticalHit && (
				<div className="animate-float-up-fade-out text-yellow-300 font-bold text-xl whitespace-nowrap px-4 py-2 bg-black/80 rounded-full backdrop-blur-sm border-2 border-yellow-400 shadow-lg">
					{criticalHitLabel}
				</div>
			)}
			{!showCriticalSuccess && !showCriticalHit && showHypeTrain && (
				<div className="text-yellow-300 font-bold text-xl whitespace-nowrap px-4 py-2 bg-black/80 rounded-full backdrop-blur-sm border-2 border-yellow-400 shadow-lg animate-pulse">
					{hypeTrainLabel}
				</div>
			)}
		</div>
	);
};
