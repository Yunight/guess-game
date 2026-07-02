import { useMemo, type CSSProperties, type ReactNode } from "react";

type ParticleStyle = Pick<CSSProperties, "left" | "top" | "animationDelay" | "animationDuration">;

interface ResultsPageParticlesProps {
	resultId: string;
}

const hashSeed = (value: string): number => {
	let hash = 0;
	for (const char of value) {
		hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
	}
	return hash;
};

const createSeededRandom = (seed: number): (() => number) => {
	let state = seed;
	return () => {
		state = (state * 1664525 + 1013904223) >>> 0;
		return state / 0xffffffff;
	};
};

const createParticleStyles = (resultId: string): readonly ParticleStyle[] => {
	const random = createSeededRandom(hashSeed(resultId));

	return Array.from({ length: 20 }, () => ({
		left: `${random() * 100}%`,
		top: `${random() * 100}%`,
		animationDelay: `${random() * 2}s`,
		animationDuration: `${2 + random() * 2}s`,
	}));
};

export const ResultsPageParticles = ({ resultId }: ResultsPageParticlesProps): ReactNode => {
	const particleStyles = useMemo(() => createParticleStyles(resultId), [resultId]);

	return (
		<div className="absolute inset-0 overflow-hidden pointer-events-none">
			{particleStyles.map((style, index) => (
				<div
					key={`particle-${resultId}-${index}`}
					className="absolute w-2 h-2 bg-white/30 rounded-full animate-ping"
					style={style}
				/>
			))}
		</div>
	);
};
