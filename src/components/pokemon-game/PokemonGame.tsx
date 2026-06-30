import { usePokemonGameController } from "../../hooks/usePokemonGameController";
import { PokemonGameLayout } from "./PokemonGameLayout";
import "../../styles/PokemonGame.css";

const PokemonGame = (): JSX.Element => {
	const controller = usePokemonGameController();
	return <PokemonGameLayout controller={controller} />;
};

export default PokemonGame;
