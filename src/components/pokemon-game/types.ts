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

interface PokemonColor {
  name: string;
  url: string;
}

interface PokemonShape {
  name: string;
  url: string;
}

interface PokemonHabitat {
  name: string;
  url: string;
}

interface GrowthRate {
  name: string;
  url: string;
}

interface Language {
  name: string;
  url: string;
}

interface FlavorTextEntry {
  flavor_text: string;
  language: Language;
  version: {
    name: string;
    url: string;
  };
}

interface Genus {
  genus: string;
  language: Language;
}

export interface Pokemon {
  id: number;
  name: string;
  frenchName: string;
  frenchFlavorText: string;
  englishFlavorText: string;
  sprite: string;
  evolvesFromSpecies: string | null;
  hasEvolution: boolean;
  evolutionStage: number;
  isLegendary: boolean;
  isMythical: boolean;
  cryUrl: string;
  // Additional species data
  genera?: Genus[];
  flavor_text_entries?: FlavorTextEntry[];
  color?: PokemonColor;
  shape?: PokemonShape;
  habitat?: PokemonHabitat | null;
  growth_rate?: GrowthRate;
  capture_rate?: number;
  base_happiness?: number;
}

export interface Rankings {
  name: string;
  score: number;
  time: number;
  timestamp: Date;
} 