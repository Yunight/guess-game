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
  sprite: string;
  isLegendary: boolean;
  isMythical: boolean;
  isShiny: boolean;
  hasEvolution: boolean;
  evolvesFromSpecies: string | null;
  evolutionStage: number;
  cryUrl?: string;
  frenchFlavorText?: string;
  englishFlavorText?: string;
}

export interface Rankings {
  id: number;
  playerName: string;
  name: string;
  score: number;
  time: number;
  date: Date;
  timestamp: Date;
  generation: Generation;
}

export type Ranking = Rankings; 