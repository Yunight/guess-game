import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import type { Generation } from "./generations";
import { getGenerationI18nKey } from "./generations";

export interface MenuGenerationPickerProps {
	selectedGeneration: Generation;
	generations: readonly Generation[];
	onGenerationSelect: (generation: Generation) => void;
}

export const MenuGenerationPicker = ({
	selectedGeneration,
	generations,
	onGenerationSelect,
}: MenuGenerationPickerProps): JSX.Element => {
	const { t } = useTranslation();

	const sortedGenerations = [...generations].sort(
		(a, b) => a.startId - b.startId,
	);

	return (
		<div className="space-y-2">
			<h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
				<div className="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-md" />
				{t("pokemonGeneration")}
			</h2>
			<div className="grid grid-cols-2 gap-1.5">
				{sortedGenerations.map((generation) => (
					<Button
						key={generation.name}
						variant="ghost"
						onClick={() => onGenerationSelect(generation)}
						className={`h-auto px-2 py-1.5 text-sm font-medium transition-all duration-500 ease-out relative overflow-hidden
                        ${
													selectedGeneration.name === generation.name
														? "bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg scale-[1.02] border-2 border-white hover:bg-red-600 hover:text-white"
														: "bg-gray-800 text-gray-100 hover:bg-gray-700 hover:text-white"
												}
                        before:content-[""] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent
                        ${selectedGeneration.name === generation.name ? "before:animate-shine-slow" : ""}
                      `}
					>
						<div className="flex items-center justify-center gap-1">
							{selectedGeneration.name === generation.name && (
								<div className="w-2 h-2 bg-white rounded-full animate-pulse-slow" />
							)}
							{t(getGenerationI18nKey(generation.startId))}
						</div>
					</Button>
				))}
			</div>
		</div>
	);
};
