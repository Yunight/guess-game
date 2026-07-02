import type { ReactNode } from "react";
const DEBUG_PERCENTAGES = [
	0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 60, 65, 70, 75, 80, 85, 90, 95,
] as const;

interface ResultsPageDebugPanelProps {
	totalPokemonInGeneration: number;
	debugRemainingPokemon: number | null;
	setDebugRemainingPokemon: (value: number | null) => void;
}

export const ResultsPageDebugPanel = ({
	totalPokemonInGeneration,
	debugRemainingPokemon,
	setDebugRemainingPokemon,
}: ResultsPageDebugPanelProps): ReactNode => {
	return (
		<div className="absolute top-4 left-4 bg-black/80 p-4 rounded-lg text-white z-50">
			<h3 className="text-lg font-bold mb-2">Debug: Prestige Levels</h3>
			<div className="grid grid-cols-5 gap-2 text-xs">
				{DEBUG_PERCENTAGES.map((percentage) => {
					const pokemonCount = Math.round((percentage / 100) * totalPokemonInGeneration);

					return (
						<button
							key={percentage}
							type="button"
							onClick={() => setDebugRemainingPokemon(pokemonCount)}
							className={`px-2 py-1 rounded ${debugRemainingPokemon === pokemonCount ? "bg-blue-500" : "bg-gray-600"} hover:bg-blue-400`}
						>
							{percentage}%
						</button>
					);
				})}
			</div>
			<button
				type="button"
				onClick={() => setDebugRemainingPokemon(null)}
				className="mt-2 px-3 py-1 bg-red-600 hover:bg-red-500 rounded text-xs"
			>
				Reset
			</button>
		</div>
	);
};
