export interface Pokemon {
	id: number;
	name: string;
	englishName: string;
	frenchName: string;
	frenchFlavorText: string;
	englishFlavorText: string;
	isShiny: boolean;
	isMythical: boolean;
	isLegendary: boolean;
	evolutionStage: number;
	hasEvolution: boolean;
	evolvesFromSpecies: string | null;
	sprites: {
		front_default: string;
		front_shiny: string;
	};
	cryUrl: string;
}

export interface Rankings {
	name: string;
	score: number;
	time: number;
	timestamp: Date;
	uid: string | null;
}
