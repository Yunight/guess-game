interface GameScreenHypeOverlayProps {
	showHypeTrain: boolean;
}

export const GameScreenHypeOverlay = ({
	showHypeTrain,
}: GameScreenHypeOverlayProps): JSX.Element | null => {
	if (!showHypeTrain) {
		return null;
	}

	return (
		<div
			className="absolute inset-0 z-0 overflow-hidden"
			data-testid="fire-effects"
		>
			<div className="absolute inset-0 bg-gradient-to-t from-red-900/90 via-red-800/80 to-red-900/90 opacity-80" />
			<div className="absolute inset-0 backdrop-blur-[1px] animate-heat-distort" />
			<div className="absolute inset-x-0 bottom-0 h-full">
				<div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full">
					<div className="absolute bottom-0 w-full h-4/5 bg-gradient-to-t from-orange-600 via-yellow-500 to-transparent opacity-80 animate-flame-dance mix-blend-screen" />
				</div>
			</div>
			<div className="absolute inset-0 bg-gradient-to-t from-orange-500/40 via-yellow-500/20 to-transparent mix-blend-overlay" />
			<div className="absolute inset-0 bg-gradient-radial from-yellow-500/30 via-orange-500/20 to-transparent mix-blend-overlay animate-fire-pulse" />
		</div>
	);
};
