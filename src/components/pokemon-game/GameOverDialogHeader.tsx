import {
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { useTranslation } from "react-i18next";
import { GameOverFireworks } from "./GameOverFireworks";

interface GameOverDialogHeaderProps {
	isComplete: boolean;
	playerName: string;
	selectedGeneration: { name: string };
}

export const GameOverDialogHeader = ({
	isComplete,
	playerName,
	selectedGeneration,
}: GameOverDialogHeaderProps): JSX.Element => {
	const { t, i18n } = useTranslation();

	return (
		<DialogHeader className="space-y-4">
			<div className="flex justify-center -mt-5">
				<div className="bg-white p-4 rounded-full shadow-xl relative overflow-visible">
					{isComplete && (
						<GameOverFireworks generationName={selectedGeneration.name} />
					)}
					<div
						className={`relative h-12 w-12 ${isComplete ? "animate-bounce" : "animate-pulse"}`}
					>
						<div className="absolute inset-[-25%] bg-purple-400/30 rounded-full blur-md" />
						<div className="absolute inset-0 bg-white rounded-full shadow-lg border border-gray-200" />
						<div className="absolute top-0 left-0 w-full h-[45%] bg-gradient-to-b from-purple-500 to-purple-600 rounded-t-full" />
						<div className="absolute top-[45%] left-0 right-0 h-[10%] bg-black shadow-sm" />
						<div className="absolute top-[37%] left-[37%] w-[26%] h-[26%] bg-gradient-to-b from-gray-300 to-gray-500 rounded-full border-2 border-black shadow-inner flex items-center justify-center">
							<span className="text-black font-bold text-xs leading-none">
								M
							</span>
						</div>
						<div className="absolute top-[39%] left-[39%] w-[22%] h-[22%] bg-white/40 rounded-full" />
						<div className="absolute top-[15%] left-[25%] w-[20%] h-[20%] bg-white/50 rounded-full blur-sm" />
					</div>
				</div>
			</div>
			<DialogTitle className="text-2xl font-bold text-center">
				{isComplete ? (
					<div className="space-y-2">
						<div className="text-3xl font-extrabold text-yellow-100 animate-pulse">
							{i18n.language === "fr"
								? "MAÎTRE POKÉMON LÉGENDAIRE!"
								: "LEGENDARY POKÉMON MASTER!"}
						</div>
						<div className="text-lg font-medium text-yellow-200">
							{i18n.language === "fr"
								? "Génération Complétée!"
								: "Generation Completed!"}
						</div>
					</div>
				) : (
					t("gameOver")
				)}
			</DialogTitle>
			<DialogDescription className="text-center text-gray-200">
				{isComplete ? (
					<div className="space-y-2">
						<p className="text-yellow-100">
							{t("congratulations", { name: playerName })}
						</p>
						<p className="text-yellow-200">
							{t("congratsAllPokemon", {
								region: selectedGeneration.name,
							})}
						</p>
					</div>
				) : (
					t("gameOverDesc")
				)}
			</DialogDescription>
		</DialogHeader>
	);
};
