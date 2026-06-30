import { Crown, Gem, Star, Trophy, Zap } from "lucide-react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { getPrestigeTheme } from "../resultsPageThemes";

const t = (key: string): string => key;

const TOTAL_POKEMON = 151;

describe("getPrestigeTheme", () => {
	afterEach(() => {
		vi.restoreAllMocks();
	});

	it("returns grandmaster theme at 0% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(0, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-yellow-400 via-orange-500 to-red-600");
		expect(theme.particles).toBe(true);
		expect(theme.icon).toBe(Crown);
		expect(theme.name).toBe("prestigeTitles.grandmaster.0");
	});

	it("returns champion theme at 5% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const remaining = 7;
		const theme = getPrestigeTheme(remaining, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-red-600 via-orange-600 to-yellow-600");
		expect(theme.particles).toBe(true);
		expect(theme.icon).toBe(Crown);
	});

	it("returns elite theme at 10% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const remaining = 15;
		const theme = getPrestigeTheme(remaining, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-amber-600 via-yellow-600 to-orange-600");
		expect(theme.particles).toBe(true);
		expect(theme.icon).toBe(Gem);
	});

	it("returns master theme at 15% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const remaining = 22;
		const theme = getPrestigeTheme(remaining, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-blue-600 via-cyan-600 to-teal-600");
		expect(theme.particles).toBe(false);
		expect(theme.icon).toBe(Zap);
	});

	it("returns expert theme at 20% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const remaining = 30;
		const theme = getPrestigeTheme(remaining, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-pink-600 via-rose-600 to-red-600");
		expect(theme.icon).toBe(Star);
	});

	it("returns advanced theme at 25% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const remaining = 37;
		const theme = getPrestigeTheme(remaining, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-indigo-600 via-blue-600 to-purple-600");
		expect(theme.icon).toBe(Trophy);
	});

	it("returns default fallback theme above 90% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const remaining = 140;
		const theme = getPrestigeTheme(remaining, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-slate-600 via-gray-600 to-stone-600");
		expect(theme.particles).toBe(false);
		expect(theme.icon).toBe(Trophy);
		expect(theme.name).toBe("prestigeTitles.starter.0");
	});

	it("returns purple theme at 30% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(45, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe(
			"from-purple-600 via-violet-600 to-indigo-600",
		);
		expect(theme.icon).toBe(Star);
	});

	it("returns teal theme at 35% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(52, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-teal-600 via-cyan-600 to-blue-600");
		expect(theme.icon).toBe(Crown);
	});

	it("returns cyan theme at 40% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(60, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-cyan-600 via-teal-600 to-blue-600");
		expect(theme.icon).toBe(Trophy);
	});

	it("returns green theme at 45% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(67, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-green-600 via-teal-600 to-cyan-600");
	});

	it("returns emerald theme at 50% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(75, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe(
			"from-emerald-600 via-green-600 to-teal-600",
		);
	});

	it("returns orange theme at 60% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(90, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe(
			"from-orange-600 via-amber-600 to-yellow-600",
		);
		expect(theme.icon).toBe(Star);
	});

	it("returns lime theme at 65% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(98, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe(
			"from-lime-600 via-green-600 to-emerald-600",
		);
		expect(theme.icon).toBe(Gem);
	});

	it("returns sky theme at 70% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(105, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-sky-600 via-blue-600 to-indigo-600");
		expect(theme.icon).toBe(Zap);
	});

	it("returns violet theme at 75% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(113, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe(
			"from-violet-600 via-purple-600 to-fuchsia-600",
		);
	});

	it("returns rose theme at 80% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(120, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-rose-600 via-pink-600 to-red-600");
	});

	it("returns amber theme at 85% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(128, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-amber-600 via-orange-600 to-red-600");
		expect(theme.icon).toBe(Zap);
	});

	it("returns gray theme at 90% remaining", () => {
		vi.spyOn(Math, "random").mockReturnValue(0);
		const theme = getPrestigeTheme(135, TOTAL_POKEMON, t);
		expect(theme.bgGradient).toBe("from-gray-600 via-slate-600 to-zinc-600");
		expect(theme.icon).toBe(Star);
	});
});
