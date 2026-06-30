import type { Pokemon } from "@/components/pokemon-game/types";
import type { TyradexPokemon } from "./pokemonApiValidators";

export const normalizeFlavorText = (text: string): string =>
	text.replace(/\f/g, " ").replace(/\n/g, " ");

export const extractFlavorTexts = (
	entries: ReadonlyArray<{
		flavor_text: string;
		language: { name: string };
	}>,
): { french: string; english: string } => {
	const frenchEntries = entries.filter((entry) => entry.language.name === "fr");
	const englishEntries = entries.filter((entry) => entry.language.name === "en");

	const french =
		frenchEntries.length > 0
			? normalizeFlavorText(
					frenchEntries[Math.floor(Math.random() * frenchEntries.length)]
						.flavor_text,
				)
			: "";

	const english =
		englishEntries.length > 0
			? normalizeFlavorText(
					englishEntries[Math.floor(Math.random() * englishEntries.length)]
						.flavor_text,
				)
			: "";

	return { french, english };
};

const determineShinyState = (
	pokemonId: number,
	maxHypeChain: number,
	forcedShinyState: boolean | undefined,
	random: () => number,
	shinyCache: Map<number, boolean>,
): boolean => {
	if (typeof forcedShinyState === "boolean") {
		shinyCache.set(pokemonId, forcedShinyState);
		return forcedShinyState;
	}

	const cached = shinyCache.get(pokemonId);
	if (cached !== undefined) {
		return cached;
	}

	const shinyRate = Math.min(0.05 + maxHypeChain * 0.01, 0.1);
	const isShiny = random() < shinyRate;
	shinyCache.set(pokemonId, isShiny);
	return isShiny;
};

export const convertTyradexToPokemon = (
	tyradexPokemon: TyradexPokemon,
	options?: {
		maxHypeChain?: number;
		forcedShinyState?: boolean;
		random?: () => number;
		shinyCache?: Map<number, boolean>;
	},
): Omit<Pokemon, "cryUrl"> => {
	const maxHypeChain = options?.maxHypeChain ?? 0;
	const random = options?.random ?? Math.random;
	const shinyCache = options?.shinyCache ?? new Map<number, boolean>();
	const pokemonId = tyradexPokemon.pokedex_id;

	const isShiny = determineShinyState(
		pokemonId,
		maxHypeChain,
		options?.forcedShinyState,
		random,
		shinyCache,
	);

	return {
		id: pokemonId,
		name: tyradexPokemon.name.en.toLowerCase(),
		englishName: tyradexPokemon.name.en,
		frenchName: tyradexPokemon.name.fr,
		frenchFlavorText: "",
		englishFlavorText: "",
		sprites: {
			front_default: tyradexPokemon.sprites.regular,
			front_shiny:
				tyradexPokemon.sprites.shiny || tyradexPokemon.sprites.regular,
		},
		isShiny,
		evolvesFromSpecies: null,
		hasEvolution: false,
		evolutionStage: 1,
		isLegendary: false,
		isMythical: false,
	};
};

export const formatCryUrl = (cries: { latest: string; legacy: string }): string =>
	`${cries.latest}|${cries.legacy}`;

export const toApiError = (
	error: unknown,
): { status: number; data: unknown } => {
	if (error instanceof Error) {
		return { status: 500, data: error.message };
	}
	return { status: 500, data: "Unknown error" };
};
