import type { ReactNode } from "react";
export interface PokemonGameDevToolsProps {
	onGameOver: () => void;
	onCompleteGeneration: () => void;
}

export const PokemonGameDevTools = ({
	onGameOver,
	onCompleteGeneration,
}: PokemonGameDevToolsProps): ReactNode | null => {
	if (!import.meta.env.DEV) {
		return null;
	}

	return (
		<div className="absolute left-4 top-4 flex gap-2 z-50">
			<button
				type="button"
				onClick={onGameOver}
				className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200"
				title="Dev Mode: Trigger Game Over"
			>
				DEV: Game Over
			</button>
			<button
				type="button"
				onClick={onCompleteGeneration}
				className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-md shadow-md transition-colors duration-200"
				title="Dev Mode: Trigger Generation Complete"
			>
				DEV: Complete Gen
			</button>
		</div>
	);
};
