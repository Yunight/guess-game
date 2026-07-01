import type { Pokemon } from "./types";

export type GameOverTranslationFn = (
	key: string,
	options?: Record<string, string | number>,
) => string;

const SCORE_MESSAGE_THRESHOLDS = [
	{ min: 2500, key: "shareMsg2500" },
	{ min: 2250, key: "shareMsg2250" },
	{ min: 2000, key: "shareMsg2000" },
	{ min: 1800, key: "shareMsg1800" },
	{ min: 1600, key: "shareMsg1600" },
	{ min: 1500, key: "shareMsg1500" },
	{ min: 1400, key: "shareMsg1400" },
	{ min: 1300, key: "shareMsg1300" },
	{ min: 1200, key: "shareMsg1200" },
	{ min: 1100, key: "shareMsg1100" },
	{ min: 1000, key: "shareMsg1000" },
	{ min: 900, key: "shareMsg900" },
	{ min: 800, key: "shareMsg800" },
	{ min: 750, key: "shareMsg750" },
	{ min: 700, key: "shareMsg700" },
	{ min: 600, key: "shareMsg600" },
	{ min: 500, key: "shareMsg500" },
	{ min: 450, key: "shareMsg450" },
	{ min: 400, key: "shareMsg400" },
	{ min: 350, key: "shareMsg350" },
	{ min: 300, key: "shareMsg300" },
	{ min: 250, key: "shareMsg250" },
	{ min: 200, key: "shareMsg200" },
	{ min: 150, key: "shareMsg150" },
	{ min: 100, key: "shareMsg100" },
	{ min: 75, key: "shareMsg75" },
	{ min: 50, key: "shareMsg50" },
] as const satisfies ReadonlyArray<{ min: number; key: string }>;

export interface ClickbaitMessageParams {
	score: number;
	remainingPokemon: readonly number[];
	userRanking: number | null;
	maxHypeChain: number;
	criticalHitCount: number;
	criticalSuccessCount: number;
	hyperTrainCount: number;
	rewardPokemon: Pokemon | undefined;
	selectedGeneration: { name: string };
	language: string;
	t: GameOverTranslationFn;
}

export const getGenerationName = (
	selectedGeneration: { name: string },
	language: string,
): string => {
	const genNumber = selectedGeneration.name.match(/\d+/)?.[0] ?? "1";
	if (language === "fr") {
		return `${genNumber}ère Génération`;
	}
	return `Generation ${genNumber}`;
};

export const formatGameOverTime = (timeInSeconds: number): string => {
	if (typeof timeInSeconds !== "number" || Number.isNaN(timeInSeconds)) {
		return "0:00";
	}

	const minutes = Math.floor(timeInSeconds / 60);
	const seconds = Math.floor(timeInSeconds % 60);

	return `${minutes}:${seconds.toString().padStart(2, "0")}`;
};

const capitalizePokemonName = (name: string): string => {
	if (name.length === 0) {
		return "";
	}
	return name.charAt(0).toUpperCase() + name.slice(1);
};

export const getLocalizedPokemonName = (pokemon: Pokemon | undefined, language: string): string => {
	if (!pokemon) {
		return "";
	}

	if (language === "fr") {
		return capitalizePokemonName(pokemon.frenchName);
	}

	return capitalizePokemonName(pokemon.englishName);
};

export const getShinyLabel = (pokemon: Pokemon | undefined, language: string): string => {
	if (!pokemon?.isShiny) {
		return "";
	}

	if (language === "fr") {
		return "✨ CHROMATIQUE ✨";
	}

	return "✨ SHINY ✨";
};

type ClickbaitRuleContext = ClickbaitMessageParams & { genName: string };

type ClickbaitPriorityRule = {
	matches: (context: ClickbaitRuleContext) => boolean;
	resolve: (context: ClickbaitRuleContext, t: GameOverTranslationFn) => string;
};

const CLICKBAIT_PRIORITY_RULES = [
	{
		matches: (context) => context.userRanking === 1,
		resolve: (context, t) => t("shareMsgChampion", { gen: context.genName }),
	},
	{
		matches: (context) => context.userRanking !== null && context.userRanking <= 3,
		resolve: (context, t) => t("shareMsgTop3", { gen: context.genName }),
	},
	{
		matches: (context) => context.userRanking !== null && context.userRanking <= 10,
		resolve: (context, t) => t("shareMsgTop10", { gen: context.genName }),
	},
	{
		matches: (context) => context.maxHypeChain >= 10,
		resolve: (context, t) =>
			t("shareMsgHypeLegend", {
				gen: context.genName,
				count: context.maxHypeChain,
			}),
	},
	{
		matches: (context) => context.maxHypeChain >= 5,
		resolve: (context, t) =>
			t("shareMsgHype", { gen: context.genName, count: context.maxHypeChain }),
	},
	{
		matches: (context) => context.criticalHitCount >= 3,
		resolve: (context, t) => t("shareMsgCriticalHit", { gen: context.genName }),
	},
	{
		matches: (context) => context.criticalSuccessCount >= 2,
		resolve: (context, t) => t("shareMsgCriticalSuccess", { gen: context.genName }),
	},
	{
		matches: (context) => context.hyperTrainCount >= 3,
		resolve: (context, t) => t("shareMsgHypeTrain", { gen: context.genName }),
	},
	{
		matches: (context) => context.rewardPokemon?.isLegendary === true,
		resolve: (context, t) =>
			t("shareMsgLegendary", {
				gen: context.genName,
				pokemon: context.rewardPokemon?.frenchName ?? "",
			}),
	},
	{
		matches: (context) => context.rewardPokemon?.isMythical === true,
		resolve: (context, t) =>
			t("shareMsgMythical", {
				gen: context.genName,
				pokemon: context.rewardPokemon?.frenchName ?? "",
			}),
	},
] as const satisfies ReadonlyArray<ClickbaitPriorityRule>;

export const getClickbaitMessage = (params: ClickbaitMessageParams): string => {
	const genName = getGenerationName(params.selectedGeneration, params.language);

	if (params.remainingPokemon.length === 0) {
		return params.t("shareMsgAllPokemon", { gen: genName });
	}

	for (const threshold of SCORE_MESSAGE_THRESHOLDS) {
		if (params.score >= threshold.min) {
			return params.t(threshold.key, { gen: genName });
		}
	}

	const context: ClickbaitRuleContext = { ...params, genName };
	for (const rule of CLICKBAIT_PRIORITY_RULES) {
		if (rule.matches(context)) {
			return rule.resolve(context, params.t);
		}
	}

	return params.t("shareMsgDefault", { gen: genName });
};
