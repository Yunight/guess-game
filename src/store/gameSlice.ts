import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { Generation } from '@/components/pokemon-game/types';

interface GameState {
  selectedGeneration: Generation;
}

const initialState: GameState = {
  selectedGeneration: {
    name: 'Kanto',
    startId: 1,
    endId: 151
  }
};

export const gameSlice = createSlice({
  name: 'game',
  initialState,
  reducers: {
    setSelectedGeneration: (state, action: PayloadAction<Generation>) => {
      state.selectedGeneration = action.payload;
    }
  }
});

export const { setSelectedGeneration } = gameSlice.actions;
export default gameSlice.reducer; 