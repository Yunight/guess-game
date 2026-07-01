export const GENERATIONS = [
	{ name: "1ère Génération", startId: 1, endId: 151 },
	{ name: "2ème Génération", startId: 152, endId: 251 },
	{ name: "3ème Génération", startId: 252, endId: 386 },
	{ name: "4ème Génération", startId: 387, endId: 493 },
	{ name: "5ème Génération", startId: 494, endId: 649 },
	{ name: "6ème Génération", startId: 650, endId: 721 },
	{ name: "7ème Génération", startId: 722, endId: 809 },
	{ name: "8ème Génération", startId: 810, endId: 905 },
	{ name: "9ème Génération", startId: 906, endId: 1010 },
] as const;

export type Generation = (typeof GENERATIONS)[number];

export const getGenerationI18nKey = (startId: number): string => {
	const index = GENERATIONS.findIndex((generation) => generation.startId === startId);
	if (index < 0) {
		return "gen9";
	}
	return `gen${index + 1}`;
};
