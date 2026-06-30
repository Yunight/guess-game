import { createRef } from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../../../test/test-utils";
import { GameScreenPlayArea } from "../GameScreenPlayArea";
import type { Pokemon } from "../types";

vi.mock("../PokemonDisplay", () => ({
	PokemonDisplay: () => <div data-testid="pokemon-display" />,
}));

vi.mock("../GameScreenCriticalBanner", () => ({
	GameScreenCriticalBanner: () => <div data-testid="critical-banner" />,
}));

vi.mock("../GameStats", () => ({
	GameStats: () => <div data-testid="game-stats" />,
}));

vi.mock("../GameScreenInputArea", () => ({
	GameScreenInputArea: () => <div data-testid="input-area" />,
}));

vi.mock("../HintButton", () => ({
	HintButton: () => <button type="button">hint</button>,
}));

const mockPokemon: Pokemon = {
	id: 25,
	name: "pikachu",
	englishName: "Pikachu",
	frenchName: "Pikachu",
	frenchFlavorText: "",
	englishFlavorText: "",
	sprite: "",
	shinySprite: "",
	isShiny: false,
	evolvesFromSpecies: "pichu",
	hasEvolution: true,
	evolutionStage: 2,
	isLegendary: false,
	isMythical: false,
	cryUrl: "",
};

const baseProps = {
	currentPokemon: mockPokemon,
	isPokemonLoading: false,
	isCorrect: null,
	score: 10,
	bestScore: 20,
	bestTime: 60,
	guessTimeLeft: 30,
	hintsLeft: 3,
	guess: "",
	handleGuessChange: vi.fn(),
	handleKeyDown: vi.fn(),
	suggestions: [],
	handleSuggestionClick: vi.fn(),
	highlightedIndex: -1,
	showHint: false,
	useHint: vi.fn(),
	inputRef: createRef<HTMLInputElement>(),
	suggestionsRef: createRef<HTMLDivElement>(),
	formatTime: (seconds: number): string => `${seconds}s`,
	isMuted: false,
	remainingCount: 5,
	totalCount: 10,
	showCriticalSuccess: false,
	showCriticalHit: false,
	showHypeTrain: false,
	consecutiveFastAnswers: 0,
	criticalSuccessLabel: "critical",
	criticalHitLabel: "hit",
	hypeTrainLabel: "hype",
};

describe("GameScreenPlayArea", () => {
	it("renders pokemon, stats, and input sections", () => {
		render(<GameScreenPlayArea {...baseProps} />);

		expect(screen.getByTestId("pokemon-display")).toBeInTheDocument();
		expect(screen.getByTestId("game-stats")).toBeInTheDocument();
		expect(screen.getByTestId("input-area")).toBeInTheDocument();
		expect(screen.getByText("hint")).toBeInTheDocument();
	});
});
