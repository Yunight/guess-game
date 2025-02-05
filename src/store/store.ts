import { configureStore } from "@reduxjs/toolkit";
import { pokemonApi } from "../services/pokemonApi";
import gameReducer from "./gameSlice";

export const store = configureStore({
	reducer: {
		game: gameReducer,
		[pokemonApi.reducerPath]: pokemonApi.reducer,
	},
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware().concat(pokemonApi.middleware),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
