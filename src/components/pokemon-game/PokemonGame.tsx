import type { ReactNode } from "react";
import { usePokemonGameController } from "../../hooks/usePokemonGameController";
import { PokemonGameLayout } from "./PokemonGameLayout";
import "../../styles/PokemonGame.css";

const PokemonGame = (): ReactNode => {
	const controller = usePokemonGameController();
	return <PokemonGameLayout controller={controller} />;
};

export default PokemonGame;
