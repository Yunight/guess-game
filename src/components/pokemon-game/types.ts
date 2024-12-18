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
  frenchName: string;
  imageUrl: string;
  flavorText?: string;
  englishFlavorText?: string;
  cryUrl?: string;
  isLegendary?: boolean;
  isMythical?: boolean;
  evolvesFromSpecies: string | null;
  hasEvolution?: boolean;
}

export interface Rankings {
  name: string;
  score: number;
  time: number;
  timestamp: Date;
} 