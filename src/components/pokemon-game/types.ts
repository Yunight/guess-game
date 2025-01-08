export interface Player {
	name: string;
	score: number;
	time: number;
	timestamp: Date;
}

export interface Generation {
	name: string;
	startId: number;
	endId: number;
}

export interface Pokemon {
	id: number;
	name: string;
	englishName: string;
	frenchName: string;
	frenchFlavorText: string;
	englishFlavorText: string;
	sprite: string;
	shinySprite: string;
	isShiny: boolean;
	evolvesFromSpecies: string | null;
	hasEvolution: boolean;
	evolutionStage: number;
	isLegendary: boolean;
	isMythical: boolean;
	cryUrl: {
		latest: string;
		legacy?: string;
	};
}

export interface Rankings {
	name: string;
	score: number;
	time: number;
	timestamp: Date;
	uid: string | null;
}
