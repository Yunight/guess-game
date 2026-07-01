import { formatTimeForRanking } from "@/utils/gameFormatters";

export interface BuildShareTextParams {
	t: (key: string) => string;
	playerName: string;
	score: number;
	totalTimeElapsed: number;
	generationName: string;
	language: string;
	userRanking: number | null;
	shareUrl: string;
}

const getGenerationDisplayName = (generationName: string, language: string): string => {
	const genNumber = generationName.match(/\d+/)?.[0] || "1";
	return language === "fr" ? `${genNumber}ère Génération` : `Generation ${genNumber}`;
};

export const buildShareText = (params: BuildShareTextParams): string => {
	const genName = getGenerationDisplayName(params.generationName, params.language);

	return `${params.t("checkOutResult")}

👤 ${params.playerName}
🎯 ${params.t("score")}: ${params.score}
⏱️ ${params.t("time")}: ${formatTimeForRanking(params.totalTimeElapsed)}
🌐 ${genName}
${params.userRanking ? `👑 ${params.t("ranking")} #${params.userRanking}` : ""}

${params.shareUrl}

#PokemonGuesserGame #Pokemon`;
};
