import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi, beforeEach } from "vite-plus/test";
import { HintButton } from "../HintButton";
import { Pokemon } from "../types";

// Mock i18next
const mockT = (str: string) => str;
let mockLanguage = "en";

vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: mockT,
		i18n: { language: mockLanguage },
	}),
}));

describe("HintButton", () => {
	const mockPokemon: Pokemon = {
		id: 25,
		name: "pikachu",
		englishName: "Pikachu",
		frenchName: "Pikachu",
		englishFlavorText:
			"When it is angered, it immediately releases the energy stored in the pouches in its cheeks.",
		frenchFlavorText:
			"Quand il est en colère, il libère instantanément l'énergie emmagasinée dans les poches de ses joues.",
		sprite: "sprite-url",
		shinySprite: null,
		isShiny: false,
		evolvesFromSpecies: null,
		hasEvolution: true,
		evolutionStage: 1,
		isLegendary: false,
		isMythical: false,
		cryUrl: "cry-url",
	};

	const defaultProps = {
		hintsLeft: 3,
		showHint: false,
		useHint: vi.fn(),
		isPokemonLoading: false,
		currentPokemon: mockPokemon,
	};

	beforeEach(() => {
		mockLanguage = "en";
	});

	test("renders with correct hint count", () => {
		render(<HintButton {...defaultProps} />);
		expect(screen.getByText("hint (3)")).toBeInTheDocument();
	});

	test("renders with infinite hints", () => {
		render(<HintButton {...defaultProps} hintsLeft={Infinity} />);
		expect(screen.getByText("hint (∞)")).toBeInTheDocument();
	});

	test("handles hint click", async () => {
		const useHint = vi.fn();
		render(<HintButton {...defaultProps} useHint={useHint} />);

		await userEvent.click(screen.getByRole("button"));
		expect(useHint).toHaveBeenCalled();
	});

	test("is disabled when no hints left", () => {
		render(<HintButton {...defaultProps} hintsLeft={0} />);
		expect(screen.getByRole("button")).toBeDisabled();
	});

	test("is disabled when Pokemon is loading", () => {
		render(<HintButton {...defaultProps} isPokemonLoading={true} />);
		expect(screen.getByRole("button")).toBeDisabled();
	});

	test("is disabled when hint is showing", () => {
		render(<HintButton {...defaultProps} showHint={true} />);
		expect(screen.getByRole("button")).toBeDisabled();
	});

	test("shows hint text when showHint is true", () => {
		render(<HintButton {...defaultProps} showHint={true} />);
		expect(screen.getByText("firstLetter : P")).toBeInTheDocument();
		expect(screen.getByText(mockPokemon.englishFlavorText)).toBeInTheDocument();
	});

	test("shows French text when language is French", () => {
		mockLanguage = "fr";
		render(<HintButton {...defaultProps} showHint={true} />);
		expect(screen.getByText("firstLetter : P")).toBeInTheDocument();
		expect(screen.getByText(mockPokemon.frenchFlavorText)).toBeInTheDocument();
	});
});
