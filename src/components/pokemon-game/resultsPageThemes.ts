import { Crown, Gem, Star, Trophy, Zap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { getAvailableTitles, getRandomTitle } from "./resultsPageTitles";

export interface PrestigeTheme {
	name: string;
	bgGradient: string;
	cardBg: string;
	titleColor: string;
	accentColor: string;
	icon: LucideIcon;
	particles: boolean;
	glow: string;
	animation: string;
}

type PrestigeThemeTier = Omit<PrestigeTheme, "name">;

const PRESTIGE_THEME_TIERS = [
	{
		maxPercent: 0,
		theme: {
			bgGradient: "from-yellow-400 via-orange-500 to-red-600",
			cardBg:
				"bg-gradient-to-br from-yellow-950/95 via-orange-950/95 to-red-950/95 backdrop-blur-lg border-4 border-yellow-400 shadow-[0_0_40px_rgba(251,191,36,0.9),0_0_80px_rgba(251,191,36,0.4)] ring-4 ring-yellow-300/60 before:absolute before:inset-0 before:bg-gradient-to-br before:from-yellow-400/10 before:via-orange-400/15 before:to-red-400/10 before:rounded-lg",
			titleColor: "text-yellow-100",
			accentColor: "text-yellow-300",
			icon: Crown,
			particles: true,
			glow: "shadow-2xl shadow-yellow-500/70 drop-shadow-2xl",
			animation: "",
		},
	},
	{
		maxPercent: 5,
		theme: {
			bgGradient: "from-red-600 via-orange-600 to-yellow-600",
			cardBg:
				"bg-gradient-to-br from-red-950/95 via-orange-950/95 to-yellow-950/95 backdrop-blur-lg border-4 border-red-400 shadow-[0_0_35px_rgba(239,68,68,0.8),0_0_70px_rgba(239,68,68,0.3)] ring-3 ring-red-300/50 before:absolute before:inset-0 before:bg-gradient-to-br before:from-red-400/10 before:via-orange-400/12 before:to-yellow-400/10 before:rounded-lg",
			titleColor: "text-red-100",
			accentColor: "text-orange-300",
			icon: Crown,
			particles: true,
			glow: "shadow-2xl shadow-red-500/70",
			animation: "",
		},
	},
	{
		maxPercent: 10,
		theme: {
			bgGradient: "from-amber-600 via-yellow-600 to-orange-600",
			cardBg:
				"bg-gradient-to-br from-amber-950/95 via-yellow-950/95 to-orange-950/95 backdrop-blur-lg border-3 border-amber-400 shadow-[0_0_30px_rgba(245,158,11,0.7),0_0_60px_rgba(245,158,11,0.3)] ring-2 ring-amber-300/40 before:absolute before:inset-0 before:bg-gradient-to-br before:from-amber-400/8 before:via-yellow-400/10 before:to-orange-400/8 before:rounded-lg",
			titleColor: "text-amber-100",
			accentColor: "text-yellow-300",
			icon: Gem,
			particles: true,
			glow: "shadow-xl shadow-amber-500/60",
			animation: "",
		},
	},
	{
		maxPercent: 15,
		theme: {
			bgGradient: "from-blue-600 via-cyan-600 to-teal-600",
			cardBg:
				"bg-gradient-to-br from-blue-900/85 via-cyan-900/85 to-teal-900/85 backdrop-blur-md border-2 border-blue-400/80 shadow-[0_0_18px_rgba(59,130,246,0.5)]",
			titleColor: "text-blue-100",
			accentColor: "text-cyan-300",
			icon: Zap,
			particles: false,
			glow: "shadow-lg shadow-blue-500/50",
			animation: "",
		},
	},
	{
		maxPercent: 20,
		theme: {
			bgGradient: "from-pink-600 via-rose-600 to-red-600",
			cardBg:
				"bg-gradient-to-br from-pink-900/80 via-rose-900/85 to-red-900/80 backdrop-blur-md border-2 border-pink-400/80 shadow-[0_0_15px_rgba(236,72,153,0.4)]",
			titleColor: "text-pink-100",
			accentColor: "text-rose-300",
			icon: Star,
			particles: false,
			glow: "shadow-lg shadow-pink-500/50",
			animation: "",
		},
	},
	{
		maxPercent: 25,
		theme: {
			bgGradient: "from-indigo-600 via-blue-600 to-purple-600",
			cardBg:
				"bg-gradient-to-br from-indigo-900/85 via-blue-900/90 to-purple-900/85 backdrop-blur-md border-2 border-indigo-400/70 shadow-[0_0_12px_rgba(99,102,241,0.3)]",
			titleColor: "text-indigo-100",
			accentColor: "text-blue-300",
			icon: Trophy,
			particles: false,
			glow: "shadow-lg shadow-indigo-500/40",
			animation: "",
		},
	},
	{
		maxPercent: 30,
		theme: {
			bgGradient: "from-purple-600 via-violet-600 to-indigo-600",
			cardBg:
				"bg-gradient-to-br from-purple-900/90 via-violet-900/90 to-indigo-900/90 backdrop-blur-md border-2 border-purple-400/60",
			titleColor: "text-purple-100",
			accentColor: "text-violet-300",
			icon: Star,
			particles: false,
			glow: "shadow-md shadow-purple-500/40",
			animation: "",
		},
	},
	{
		maxPercent: 35,
		theme: {
			bgGradient: "from-teal-600 via-cyan-600 to-blue-600",
			cardBg:
				"bg-gradient-to-br from-teal-900/90 via-cyan-900/90 to-blue-900/90 backdrop-blur-md border-2 border-teal-400/60",
			titleColor: "text-teal-100",
			accentColor: "text-cyan-300",
			icon: Crown,
			particles: false,
			glow: "shadow-md shadow-teal-500/40",
			animation: "",
		},
	},
	{
		maxPercent: 40,
		theme: {
			bgGradient: "from-cyan-600 via-teal-600 to-blue-600",
			cardBg:
				"bg-gradient-to-br from-cyan-900/90 via-teal-900/90 to-blue-900/90 backdrop-blur-md border-2 border-cyan-400/60",
			titleColor: "text-cyan-100",
			accentColor: "text-teal-300",
			icon: Trophy,
			particles: false,
			glow: "shadow-md shadow-cyan-500/40",
			animation: "",
		},
	},
	{
		maxPercent: 45,
		theme: {
			bgGradient: "from-green-600 via-teal-600 to-cyan-600",
			cardBg:
				"bg-gradient-to-br from-green-900/90 via-teal-900/90 to-cyan-900/90 backdrop-blur-md border-2 border-green-400/60",
			titleColor: "text-green-100",
			accentColor: "text-teal-300",
			icon: Trophy,
			particles: false,
			glow: "shadow-md shadow-green-500/40",
			animation: "",
		},
	},
	{
		maxPercent: 50,
		theme: {
			bgGradient: "from-emerald-600 via-green-600 to-teal-600",
			cardBg:
				"bg-gradient-to-br from-emerald-900/90 via-green-900/90 to-teal-900/90 backdrop-blur-md border-2 border-emerald-400/60",
			titleColor: "text-emerald-100",
			accentColor: "text-green-300",
			icon: Trophy,
			particles: false,
			glow: "shadow-md shadow-emerald-500/40",
			animation: "",
		},
	},
	{
		maxPercent: 60,
		theme: {
			bgGradient: "from-orange-600 via-amber-600 to-yellow-600",
			cardBg:
				"bg-gradient-to-br from-orange-900/85 via-amber-900/85 to-yellow-900/85 backdrop-blur-sm border border-orange-400/50 shadow-[0_0_8px_rgba(251,146,60,0.2)]",
			titleColor: "text-orange-100",
			accentColor: "text-amber-300",
			icon: Star,
			particles: false,
			glow: "shadow-sm shadow-orange-500/30",
			animation: "",
		},
	},
	{
		maxPercent: 65,
		theme: {
			bgGradient: "from-lime-600 via-green-600 to-emerald-600",
			cardBg:
				"bg-gradient-to-br from-lime-900/85 via-green-900/85 to-emerald-900/85 backdrop-blur-sm border border-lime-400/50 shadow-[0_0_8px_rgba(132,204,22,0.2)]",
			titleColor: "text-lime-100",
			accentColor: "text-green-300",
			icon: Gem,
			particles: false,
			glow: "shadow-sm shadow-lime-500/30",
			animation: "",
		},
	},
	{
		maxPercent: 70,
		theme: {
			bgGradient: "from-sky-600 via-blue-600 to-indigo-600",
			cardBg:
				"bg-gradient-to-br from-sky-900/85 via-blue-900/85 to-indigo-900/85 backdrop-blur-sm border border-sky-400/50 shadow-[0_0_8px_rgba(14,165,233,0.2)]",
			titleColor: "text-sky-100",
			accentColor: "text-blue-300",
			icon: Zap,
			particles: false,
			glow: "shadow-sm shadow-sky-500/30",
			animation: "",
		},
	},
	{
		maxPercent: 75,
		theme: {
			bgGradient: "from-violet-600 via-purple-600 to-fuchsia-600",
			cardBg:
				"bg-gradient-to-br from-violet-900/85 via-purple-900/85 to-fuchsia-900/85 backdrop-blur-sm border border-violet-400/50 shadow-[0_0_8px_rgba(139,92,246,0.2)]",
			titleColor: "text-violet-100",
			accentColor: "text-purple-300",
			icon: Star,
			particles: false,
			glow: "shadow-sm shadow-violet-500/30",
			animation: "",
		},
	},
	{
		maxPercent: 80,
		theme: {
			bgGradient: "from-rose-600 via-pink-600 to-red-600",
			cardBg:
				"bg-gradient-to-br from-rose-900/85 via-pink-900/85 to-red-900/85 backdrop-blur-sm border border-rose-400/50 shadow-[0_0_8px_rgba(244,63,94,0.2)]",
			titleColor: "text-rose-100",
			accentColor: "text-pink-300",
			icon: Trophy,
			particles: false,
			glow: "shadow-sm shadow-rose-500/30",
			animation: "",
		},
	},
	{
		maxPercent: 85,
		theme: {
			bgGradient: "from-amber-600 via-orange-600 to-red-600",
			cardBg:
				"bg-gradient-to-br from-amber-900/80 via-orange-900/80 to-red-900/80 backdrop-blur-sm border border-amber-400/40 shadow-[0_0_6px_rgba(245,158,11,0.15)]",
			titleColor: "text-amber-100",
			accentColor: "text-orange-300",
			icon: Zap,
			particles: false,
			glow: "shadow-sm shadow-amber-500/25",
			animation: "",
		},
	},
	{
		maxPercent: 90,
		theme: {
			bgGradient: "from-gray-600 via-slate-600 to-zinc-600",
			cardBg:
				"bg-gradient-to-br from-gray-900/80 via-slate-900/80 to-zinc-900/80 backdrop-blur-sm border border-gray-400/40 shadow-[0_0_6px_rgba(107,114,128,0.15)]",
			titleColor: "text-gray-100",
			accentColor: "text-slate-300",
			icon: Star,
			particles: false,
			glow: "shadow-sm shadow-gray-500/25",
			animation: "",
		},
	},
	{
		maxPercent: Number.POSITIVE_INFINITY,
		theme: {
			bgGradient: "from-slate-600 via-gray-600 to-stone-600",
			cardBg:
				"bg-gradient-to-br from-slate-900/75 via-gray-900/75 to-stone-900/75 backdrop-blur-sm border border-slate-400/30",
			titleColor: "text-slate-200",
			accentColor: "text-gray-400",
			icon: Trophy,
			particles: false,
			glow: "shadow-sm shadow-slate-500/20",
			animation: "",
		},
	},
] as const satisfies ReadonlyArray<{
	maxPercent: number;
	theme: PrestigeThemeTier;
}>;

const resolvePrestigeThemeTier = (
	percentageRemaining: number,
): PrestigeThemeTier => {
	const tier = PRESTIGE_THEME_TIERS.find(
		(entry) => percentageRemaining <= entry.maxPercent,
	);
	if (tier) {
		return tier.theme;
	}
	return PRESTIGE_THEME_TIERS[PRESTIGE_THEME_TIERS.length - 1].theme;
};

export const getPrestigeTheme = (
	remainingPokemon: number,
	totalPokemon: number,
	t: (key: string) => string,
): PrestigeTheme => {
	const percentageRemaining = (remainingPokemon / totalPokemon) * 100;
	const availableTitles = getAvailableTitles(percentageRemaining, t);
	const randomTitle = getRandomTitle(availableTitles);
	const theme = resolvePrestigeThemeTier(percentageRemaining);

	return {
		name: randomTitle,
		...theme,
	};
};
