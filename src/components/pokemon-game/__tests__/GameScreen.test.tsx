import { describe, it, expect, vi, beforeEach } from "vite-plus/test";
import { render, screen, fireEvent } from "../../../test/test-utils";
import { GameScreen } from "../GameScreen";
import { buildGameScreenViewProps } from "../gameScreenViewProps";
import { Pokemon } from "../types";
import { createRef } from "react";

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.load = vi.fn();
window.HTMLMediaElement.prototype.play = vi.fn();
window.HTMLMediaElement.prototype.pause = vi.fn();

// Mock UI components
vi.mock("@/components/ui/card", () => ({
	Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
		<div className={className}>{children}</div>
	),
}));

vi.mock("@/components/ui/button", () => ({
	Button: ({
		children,
		onClick,
		className,
		"data-testid": testId,
		disabled,
	}: {
		children: React.ReactNode;
		onClick?: () => void;
		className?: string;
		"data-testid"?: string;
		disabled?: boolean;
	}) => (
		<button onClick={onClick} className={className} data-testid={testId} disabled={disabled}>
			{children}
		</button>
	),
}));

// Mock child components
vi.mock("../PokemonDisplay", () => ({
	PokemonDisplay: ({
		currentPokemon,
		isPokemonLoading,
		remainingCount,
		totalCount,
	}: {
		currentPokemon: Pokemon | undefined;
		isPokemonLoading: boolean;
		remainingCount: number;
		totalCount: number;
	}) => (
		<div>
			{isPokemonLoading || !currentPokemon ? (
				<div>???</div>
			) : (
				<img alt={currentPokemon.englishName} src={currentPokemon.sprite} />
			)}
			<div data-testid="pokemon-count">
				{remainingCount}/{totalCount}
			</div>
		</div>
	),
}));

vi.mock("../GameStats", () => ({
	GameStats: ({ score, bestScore }: { score: number; bestScore: number }) => (
		<div>
			<span>{score}</span>
			<span>{bestScore}</span>
			<span>0:45</span>
		</div>
	),
}));

vi.mock("../GuessInput", () => ({
	GuessInput: ({
		guess,
		handleGuessChange,
		handleKeyDown,
		suggestions,
		handleSuggestionClick,
	}: {
		guess: string;
		handleGuessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
		handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
		suggestions: string[];
		handleSuggestionClick: (suggestion: string) => void;
	}) => (
		<div>
			<input type="text" value={guess} onChange={handleGuessChange} onKeyDown={handleKeyDown} />
			<div>
				{suggestions.map((suggestion: string) => (
					<div key={suggestion} onClick={() => handleSuggestionClick(suggestion)}>
						{suggestion}
					</div>
				))}
			</div>
		</div>
	),
}));

vi.mock("../HintButton", () => ({
	HintButton: ({ hintsLeft, useHint }: { hintsLeft: number; useHint: () => void }) => (
		<button onClick={useHint} disabled={hintsLeft === 0}>
			Hint ({hintsLeft})
		</button>
	),
}));

vi.mock("../ScoreIncrease", () => ({
	ScoreIncrease: ({ points }: { points: number }) => <div>+{points}</div>,
}));

// Mock Pokemon data
const mockPokemon: Pokemon = {
	id: 25,
	name: "pikachu",
	englishName: "Pikachu",
	frenchName: "Pikachu",
	frenchFlavorText:
		"Quand il est en colère, il libère instantanément l'énergie emmagasinée dans les poches de ses joues.",
	englishFlavorText:
		"When it is angered, it immediately releases the energy stored in the pouches in its cheeks.",
	sprite: "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
	shinySprite:
		"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png",
	isShiny: false,
	evolvesFromSpecies: "pichu",
	hasEvolution: true,
	evolutionStage: 2,
	isLegendary: false,
	isMythical: false,
	cryUrl: "https://play.pokemonshowdown.com/audio/cries/pikachu.mp3",
};

// Mock props
const baseMockProps = {
	currentPokemon: mockPokemon,
	isPokemonLoading: false,
	isCorrect: null,
	score: 0,
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
	formatTime: (seconds: number) =>
		`${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`,
	isMuted: false,
	setIsMuted: vi.fn(),
	totalTimeElapsed: 0,
	bestScore: 0,
	bestTime: 0,
	onQuit: vi.fn(),
	isHardMode: false,
	showCriticalSuccess: false,
	showCriticalHit: false,
	showHypeTrain: false,
	consecutiveFastAnswers: 0,
	pointsEarned: 0,
	remainingCount: 5,
	totalCount: 10,
};

const createGameScreenView = (
	overrides: Partial<typeof baseMockProps> = {},
) => {
	const props = { ...baseMockProps, ...overrides };
	return buildGameScreenViewProps({
		currentPokemon: props.currentPokemon,
		isPokemonLoading: props.isPokemonLoading,
		isCorrect: props.isCorrect,
		isMuted: props.isMuted,
		setIsMuted: props.setIsMuted,
		isHardMode: props.isHardMode,
		showCriticalSuccess: props.showCriticalSuccess,
		showCriticalHit: props.showCriticalHit,
		showHypeTrain: props.showHypeTrain,
		consecutiveFastAnswers: props.consecutiveFastAnswers,
		totalTimeElapsed: props.totalTimeElapsed,
		formatTime: props.formatTime,
		onQuit: props.onQuit,
		pointsEarned: props.pointsEarned,
		guessTimeLeft: props.guessTimeLeft,
		remainingCount: props.remainingCount,
		totalCount: props.totalCount,
		criticalSuccessLabel: "criticalSuccess",
		criticalHitLabel: "criticalHit",
		hypeTrainLabel: "hypeTrain",
		controlsSection: {
			...props,
			criticalSuccessLabel: "criticalSuccess",
			criticalHitLabel: "criticalHit",
			hypeTrainLabel: "hypeTrain",
		},
	});
};

const mockProps = baseMockProps;

describe("GameScreen", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders basic game elements", () => {
		render(<GameScreen {...createGameScreenView()} />);

		// Check for Pokemon display
		expect(screen.getByAltText("Pikachu")).toBeInTheDocument();

		// Check for Pokemon number
		expect(screen.getByText("#025")).toBeInTheDocument();

		// Check for quit button in non-hard mode
		expect(screen.getByText("Quitter")).toBeInTheDocument();
	});

	it("hides quit button in hard mode", () => {
		render(<GameScreen {...createGameScreenView({ isHardMode: true })} />);
		expect(screen.queryByText("Quitter")).not.toBeInTheDocument();
	});

	it("toggles mute when clicking sound button", () => {
		render(<GameScreen {...createGameScreenView()} />);

		const soundButton = screen.getByTestId("volume-toggle-button");
		fireEvent.click(soundButton);

		expect(mockProps.setIsMuted).toHaveBeenCalledWith(true);
	});

	it("handles guess input", () => {
		render(<GameScreen {...createGameScreenView()} />);

		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "pika" } });

		expect(mockProps.handleGuessChange).toHaveBeenCalled();
	});

	it("handles key down events", () => {
		render(<GameScreen {...createGameScreenView()} />);

		const input = screen.getByRole("textbox");
		fireEvent.keyDown(input, { key: "Enter" });

		expect(mockProps.handleKeyDown).toHaveBeenCalled();
	});

	it("displays correct score and best score", () => {
		render(<GameScreen {...createGameScreenView({ score: 100, bestScore: 200 })} />);
		expect(screen.getByText("100")).toBeInTheDocument();
		expect(screen.getByText("200")).toBeInTheDocument();
	});

	it("shows points earned animation", () => {
		render(<GameScreen {...createGameScreenView({ pointsEarned: 5 })} />);
		expect(screen.getByText("+5")).toBeInTheDocument();
	});

	it("displays remaining Pokemon count", () => {
		render(<GameScreen {...createGameScreenView({ remainingCount: 3, totalCount: 10 })} />);
		expect(screen.getByTestId("pokemon-count")).toHaveTextContent("3/10");
	});

	it("handles quit button click", () => {
		render(<GameScreen {...createGameScreenView()} />);
		const quitButton = screen.getByText("Quitter");
		fireEvent.click(quitButton);
		expect(mockProps.onQuit).toHaveBeenCalled();
	});

	it("shows hint button when hints are available", () => {
		render(<GameScreen {...createGameScreenView({ hintsLeft: 2 })} />);
		const hintButton = screen.getByText(/Hint/i);
		fireEvent.click(hintButton);
		expect(mockProps.useHint).toHaveBeenCalled();
	});

	it("disables hint button when no hints left", () => {
		render(<GameScreen {...createGameScreenView({ hintsLeft: 0 })} />);
		const hintButton = screen.getByText(/Hint/i);
		expect(hintButton).toBeDisabled();
	});

	it("shows loading state", () => {
		render(
			<GameScreen
				{...createGameScreenView({
					isPokemonLoading: true,
					currentPokemon: undefined,
				})}
			/>,
		);
		expect(screen.getByText("???")).toBeInTheDocument();
	});

	it("handles suggestion clicks", () => {
		render(<GameScreen {...createGameScreenView({ suggestions: ["Pikachu", "Raichu"] })} />);
		const suggestion = screen.getByText("Pikachu");
		fireEvent.click(suggestion);
		expect(mockProps.handleSuggestionClick).toHaveBeenCalledWith("Pikachu");
	});

	describe("visual effects", () => {
		it("renders fire effects when hype train is active", () => {
			render(<GameScreen {...createGameScreenView({ showHypeTrain: true })} />);
			expect(screen.getByTestId("fire-effects")).toBeInTheDocument();
		});

		it("does not render fire effects when hype train is inactive", () => {
			render(<GameScreen {...createGameScreenView({ showHypeTrain: false })} />);
			expect(screen.queryByTestId("fire-effects")).not.toBeInTheDocument();
		});
	});

	describe("critical messages", () => {
		it("shows critical success message with highest priority", () => {
			render(
				<GameScreen
					{...createGameScreenView({
						showCriticalSuccess: true,
						showCriticalHit: true,
						showHypeTrain: true,
					})}
				/>,
			);
			expect(screen.getByText("criticalSuccess")).toBeInTheDocument();
			expect(screen.queryByText("criticalHit")).not.toBeInTheDocument();
			expect(screen.queryByText("hypeTrain")).not.toBeInTheDocument();
		});

		it("shows critical hit message with medium priority", () => {
			render(
				<GameScreen
					{...createGameScreenView({
						showCriticalSuccess: false,
						showCriticalHit: true,
						showHypeTrain: true,
					})}
				/>,
			);
			expect(screen.queryByText("criticalSuccess")).not.toBeInTheDocument();
			expect(screen.getByText("criticalHit")).toBeInTheDocument();
			expect(screen.queryByText("hypeTrain")).not.toBeInTheDocument();
		});

		it("shows hype train message with lowest priority", () => {
			render(
				<GameScreen
					{...createGameScreenView({
						showCriticalSuccess: false,
						showCriticalHit: false,
						showHypeTrain: true,
						consecutiveFastAnswers: 5,
					})}
				/>,
			);
			expect(screen.queryByText("criticalSuccess")).not.toBeInTheDocument();
			expect(screen.queryByText("criticalHit")).not.toBeInTheDocument();
			expect(screen.getByText("hypeTrain")).toBeInTheDocument();
		});
	});

	describe("mute functionality", () => {
		it("shows muted icon when sound is muted", () => {
			render(<GameScreen {...createGameScreenView({ isMuted: true })} />);
			expect(screen.getByTestId("volume-x-icon")).toBeInTheDocument();
		});

		it("shows unmuted icon when sound is not muted", () => {
			render(<GameScreen {...createGameScreenView({ isMuted: false })} />);
			expect(screen.getByTestId("volume-2-icon")).toBeInTheDocument();
		});
	});

	describe("game state interactions", () => {
		it("formats time correctly", () => {
			render(<GameScreen {...createGameScreenView({ totalTimeElapsed: 65 })} />);
			expect(screen.getByText("1:05")).toBeInTheDocument();
		});

		it("formats pokemon number with leading zeros", () => {
			const pokemonWithLowId = { ...mockPokemon, id: 5 };
			render(<GameScreen {...createGameScreenView({ currentPokemon: pokemonWithLowId })} />);
			expect(screen.getByText("#005")).toBeInTheDocument();
		});

		it("handles undefined pokemon gracefully", () => {
			render(<GameScreen {...createGameScreenView({ currentPokemon: undefined })} />);
			expect(screen.getByText("???")).toBeInTheDocument();
		});

		it("shows correct remaining count", () => {
			render(<GameScreen {...createGameScreenView({ remainingCount: 8, totalCount: 10 })} />);
			expect(screen.getByTestId("pokemon-count")).toHaveTextContent("8/10");
		});
	});

	describe("suggestion handling", () => {
		it("shows multiple suggestions", () => {
			render(
				<GameScreen
					{...createGameScreenView({
						suggestions: ["Pikachu", "Raichu", "Pichu"],
						highlightedIndex: 1,
					})}
				/>,
			);
			expect(screen.getByText("Pikachu")).toBeInTheDocument();
			expect(screen.getByText("Raichu")).toBeInTheDocument();
			expect(screen.getByText("Pichu")).toBeInTheDocument();
		});

		it("handles empty suggestions list", () => {
			render(<GameScreen {...createGameScreenView({ suggestions: [] })} />);
			const input = screen.getByRole("textbox");
			expect(input).toBeInTheDocument();
		});
	});

	describe("hint system", () => {
		it("shows infinite hints in non-hard mode", () => {
			render(<GameScreen {...createGameScreenView({ hintsLeft: Infinity })} />);
			expect(screen.getByText("Hint (Infinity)")).toBeInTheDocument();
		});

		it("shows hint button as enabled when hints are available", () => {
			render(<GameScreen {...createGameScreenView({ hintsLeft: 3 })} />);
			const hintButton = screen.getByText(/Hint/i);
			expect(hintButton).not.toBeDisabled();
		});

		it("handles hint usage", () => {
			render(<GameScreen {...createGameScreenView({ hintsLeft: 2, showHint: true })} />);
			const hintButton = screen.getByText(/Hint/i);
			fireEvent.click(hintButton);
			expect(mockProps.useHint).toHaveBeenCalled();
		});
	});

	describe("game mode specific behavior", () => {
		it("shows quit button only in non-hard mode", () => {
			const { rerender } = render(<GameScreen {...createGameScreenView({ isHardMode: false })} />);
			expect(screen.getByText("Quitter")).toBeInTheDocument();

			rerender(<GameScreen {...createGameScreenView({ isHardMode: true })} />);
			expect(screen.queryByText("Quitter")).not.toBeInTheDocument();
		});

		it("handles quit button click", () => {
			render(<GameScreen {...createGameScreenView({ isHardMode: false })} />);
			const quitButton = screen.getByText("Quitter");
			fireEvent.click(quitButton);
			expect(mockProps.onQuit).toHaveBeenCalled();
		});
	});

	describe("input handling", () => {
		it("updates input value on change", () => {
			render(<GameScreen {...createGameScreenView({ guess: "pika" })} />);
			const input = screen.getByRole("textbox") as HTMLInputElement;
			expect(input.value).toBe("pika");
		});

		it("handles key navigation", () => {
			render(<GameScreen {...createGameScreenView()} />);
			const input = screen.getByRole("textbox");
			fireEvent.keyDown(input, { key: "ArrowDown" });
			fireEvent.keyDown(input, { key: "ArrowUp" });
			fireEvent.keyDown(input, { key: "Enter" });
			expect(mockProps.handleKeyDown).toHaveBeenCalledTimes(3);
		});
	});
});
