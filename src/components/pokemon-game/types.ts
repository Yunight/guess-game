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
  frenchName: string;
  imageUrl: string;
  flavorText?: string;
  cryUrl?: string;
}

export interface Rankings {
  name: string;
  score: number;
  time: number;
  timestamp: Date;
} 