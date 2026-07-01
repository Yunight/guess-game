import type { Pokemon } from "./types";

export const getLocalizedPokemonName = (pokemon: Pokemon, language: string): string => {
	return language === "fr" ? pokemon.frenchName : pokemon.englishName;
};

export const getYouAreLabel = (language: string): string => {
	return language === "fr" ? "Tu es " : "You are ";
};

export const getShinyBadgeLabel = (language: string): string => {
	return language === "fr" ? "Chromatique ✨" : "Shiny ✨";
};

export const getLegendaryBadgeLabel = (language: string): string => {
	return language === "fr" ? "Légendaire" : "Legendary";
};

export const getMythicalBadgeLabel = (language: string): string => {
	return language === "fr" ? "Mythique" : "Mythical";
};
