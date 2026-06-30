interface GameOverFireworksProps {
	generationName: string;
}

export const GameOverFireworks = ({
	generationName,
}: GameOverFireworksProps): JSX.Element => {
	return (
		<>
			<div className="absolute inset-[-150%] animate-spin-slow">
				{[...Array(12)].map((_, i) => (
					<div
						key={`firework-outer-${generationName}-${i}`}
						className="absolute w-1 h-10 bg-gradient-to-t from-yellow-500 to-yellow-200 rounded-full"
						style={{
							top: "50%",
							left: "50%",
							transform: `rotate(${i * 30}deg)`,
							transformOrigin: "0 0",
							animation: "firework 2s ease-in-out infinite",
							animationDelay: `${i * 0.2}s`,
						}}
					/>
				))}
			</div>
			<div className="absolute inset-[-120%] animate-spin-slow-reverse">
				{[...Array(8)].map((_, i) => (
					<div
						key={`star-middle-${generationName}-${i}`}
						className="absolute w-1 h-8 bg-gradient-to-t from-blue-500 to-blue-200 rounded-full"
						style={{
							top: "50%",
							left: "50%",
							transform: `rotate(${i * 45 + 22.5}deg)`,
							transformOrigin: "0 0",
							animation: "firework 3s ease-in-out infinite",
							animationDelay: `${i * 0.3}s`,
						}}
					/>
				))}
			</div>
			<div className="absolute inset-[-80%] animate-spin-slow">
				{[...Array(6)].map((_, i) => (
					<div
						key={`sparkle-inner-${generationName}-${i}`}
						className="absolute w-1.5 h-6 bg-gradient-to-t from-white to-yellow-100 rounded-full"
						style={{
							top: "50%",
							left: "50%",
							transform: `rotate(${i * 60}deg)`,
							transformOrigin: "0 0",
							animation: "firework 1.5s ease-in-out infinite",
							animationDelay: `${i * 0.4}s`,
						}}
					/>
				))}
			</div>
		</>
	);
};
