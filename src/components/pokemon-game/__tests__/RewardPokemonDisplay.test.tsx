import { describe, expect, it, vi } from "vitest";
import { render } from "../../../test/test-utils";
import { RewardPokemonDisplay } from "../RewardPokemonDisplay";
import type { Pokemon } from "../types";

vi.mock("../PokemonDisplayFrame", () => ({
	PokemonDisplayFrame: ({ children }: { children: React.ReactNode }) => (
		<div>{children}</div>
	),
}));

vi.mock("../RewardPokemonSprite", () => ({
	RewardPokemonSprite: () => <div data-testid="reward-sprite" />,
}));

vi.mock("../RewardPokemonLabels", () => ({
	RewardPokemonLabels: () => <div data-testid="reward-labels" />,
}));

const pokemon: Pokemon = {
	id: 25,
	name: "pikachu",
	englishName: "Pikachu",
	frenchName: "Pikachu",
	frenchFlavorText: "",
	englishFlavorText: "",
	isShiny: false,
	isMythical: false,
	isLegendary: false,
	evolutionStage: 1,
	hasEvolution: true,
	evolvesFromSpecies: "pichu",
	sprites: { front_default: "sprite.png", front_shiny: "" },
	cryUrl: "",
};

describe("RewardPokemonDisplay", () => {
	it("renders reward pokemon content", () => {
		const { getByTestId } = render(
			<RewardPokemonDisplay
				pokemon={pokemon}
				isLoading={false}
				selectedGeneration={{ name: "Gen 1", startId: 1, endId: 151 }}
				isSlotMachineRunning={false}
			/>,
		);

		expect(getByTestId("reward-sprite")).toBeInTheDocument();
	});

	it("renders spinning pokemon while loading", () => {
		const spinningPokemon = { ...pokemon, id: 1, englishName: "Bulbasaur" };
		const { getByTestId } = render(
			<RewardPokemonDisplay
				pokemon={undefined}
				isLoading={true}
				selectedGeneration={{ name: "Gen 1", startId: 1, endId: 151 }}
				isSlotMachineRunning={true}
				spinningPokemon={spinningPokemon}
			/>,
		);

		expect(getByTestId("reward-sprite")).toBeInTheDocument();
	});
});
