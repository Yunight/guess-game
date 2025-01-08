import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "../../../test/test-utils";
import { GameScreen } from "../GameScreen";
import { Pokemon } from "../types";
import { createRef } from "react";

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.load = vi.fn();
window.HTMLMediaElement.prototype.play = vi.fn();
window.HTMLMediaElement.prototype.pause = vi.fn();

// Mock UI components
vi.mock("@/components/ui/card", () => ({
	Card: ({
		children,
		className,
	}: { children: React.ReactNode; className?: string }) => (
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
		<button
			onClick={onClick}
			className={className}
			data-testid={testId}
			disabled={disabled}
		>
			{children}
		</button>
	),
}));

// Mock child components
vi.mock("../PokemonDisplay", () => ({
	PokemonDisplay: ({
		currentPokemon,
		isPokemonLoading,
		isCorrect,
		remainingCount,
		totalCount,
	}: {
		currentPokemon: Pokemon | undefined;
		isPokemonLoading: boolean;
		isCorrect: boolean | null;
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
	GameStats: ({
		score,
		bestScore,
		guessTimeLeft,
		hintsLeft,
		formatTime,
	}: {
		score: number;
		bestScore: number;
		guessTimeLeft: number;
		hintsLeft: number;
		formatTime: (seconds: number) => string;
	}) => (
		<div>
			<span>{score}</span>
			<span>{bestScore}</span>
			<span>{formatTime(guessTimeLeft)}</span>
			<span>Hints: {hintsLeft === Infinity ? "∞" : hintsLeft}</span>
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
		isCorrect,
		guessTimeLeft,
	}: {
		guess: string;
		handleGuessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
		handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
		suggestions: string[];
		handleSuggestionClick: (suggestion: string) => void;
		isCorrect: boolean | null;
		guessTimeLeft: number;
	}) => (
		<div>
			<input
				type="text"
				value={guess}
				onChange={handleGuessChange}
				onKeyDown={handleKeyDown}
				disabled={guessTimeLeft === 0}
				className={
					isCorrect === true
						? "border-green-500"
						: isCorrect === false
						? "border-red-500"
						: ""
				}
			/>
			<div>
				{suggestions.map((suggestion: string) => (
					<div
						key={suggestion}
						onClick={() => handleSuggestionClick(suggestion)}
					>
						{suggestion}
					</div>
				))}
			</div>
		</div>
	),
}));

vi.mock("../HintButton", () => ({
	HintButton: ({
		hintsLeft,
		useHint,
	}: { hintsLeft: number; useHint: () => void }) => (
		<button onClick={useHint} disabled={hintsLeft === 0}>
			Hint ({hintsLeft === Infinity ? "∞" : hintsLeft})
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
	sprite:
		"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png",
	shinySprite:
		"https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png",
	isShiny: false,
	evolvesFromSpecies: "pichu",
	hasEvolution: true,
	evolutionStage: 2,
	isLegendary: false,
	isMythical: false,
	cryUrl: {
		latest: "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/25.ogg",
		legacy: "https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/legacy/25.ogg"
	},
};

// Mock props
const mockProps = {
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

describe("GameScreen", () => {
	beforeEach(() => {
		vi.clearAllMocks();
	});

	it("renders basic game elements", () => {
		render(<GameScreen {...mockProps} />);

		// Check for Pokemon display
		expect(screen.getByAltText("Pikachu")).toBeInTheDocument();

		// Check for Pokemon number
		expect(screen.getByText("#025")).toBeInTheDocument();

		// Check for quit button in non-hard mode
		expect(screen.getByText("Quitter")).toBeInTheDocument();
	});

	it("hides quit button in hard mode", () => {
		render(<GameScreen {...mockProps} isHardMode={true} />);
		expect(screen.queryByText("Quitter")).not.toBeInTheDocument();
	});

	it("toggles mute when clicking sound button", () => {
		render(<GameScreen {...mockProps} />);

		const soundButton = screen.getByTestId("volume-toggle-button");
		fireEvent.click(soundButton);

		expect(mockProps.setIsMuted).toHaveBeenCalledWith(true);
	});

	it("handles guess input", () => {
		render(<GameScreen {...mockProps} />);

		const input = screen.getByRole("textbox");
		fireEvent.change(input, { target: { value: "pika" } });

		expect(mockProps.handleGuessChange).toHaveBeenCalled();
	});

	it("handles key down events", () => {
		render(<GameScreen {...mockProps} />);

		const input = screen.getByRole("textbox");
		fireEvent.keyDown(input, { key: "Enter" });

		expect(mockProps.handleKeyDown).toHaveBeenCalled();
	});

	it("displays correct score and best score", () => {
		render(<GameScreen {...mockProps} score={100} bestScore={200} />);
		expect(screen.getByText("100")).toBeInTheDocument();
		expect(screen.getByText("200")).toBeInTheDocument();
	});

	it("shows points earned animation", () => {
		render(<GameScreen {...mockProps} pointsEarned={5} />);
		expect(screen.getByText("+5")).toBeInTheDocument();
	});

	it("shows loading state", () => {
		render(
			<GameScreen
				{...mockProps}
				isPokemonLoading={true}
				currentPokemon={undefined}
			/>,
		);
		expect(screen.getByText("???")).toBeInTheDocument();
	});

	it("handles suggestion clicks", () => {
		render(<GameScreen {...mockProps} suggestions={["Pikachu", "Raichu"]} />);
		const suggestion = screen.getByText("Pikachu");
		fireEvent.click(suggestion);
		expect(mockProps.handleSuggestionClick).toHaveBeenCalledWith("Pikachu");
	});

	describe("visual effects", () => {
		it("renders fire effects when hype train is active", () => {
			render(<GameScreen {...mockProps} showHypeTrain={true} />);
			expect(screen.getByTestId("fire-effects")).toBeInTheDocument();
		});

		it("does not render fire effects when hype train is inactive", () => {
			render(<GameScreen {...mockProps} showHypeTrain={false} />);
			expect(screen.queryByTestId("fire-effects")).not.toBeInTheDocument();
		});
	});

	describe("critical messages", () => {
		it("shows critical success message with highest priority", () => {
			render(
				<GameScreen
					{...mockProps}
					showCriticalSuccess={true}
					showCriticalHit={true}
					showHypeTrain={true}
				/>,
			);
			expect(screen.getByText("criticalSuccess")).toBeInTheDocument();
			expect(screen.queryByText("criticalHit")).not.toBeInTheDocument();
			expect(screen.queryByText("hypeTrain")).not.toBeInTheDocument();
		});

		it("shows critical hit message with medium priority", () => {
			render(
				<GameScreen
					{...mockProps}
					showCriticalSuccess={false}
					showCriticalHit={true}
					showHypeTrain={true}
				/>,
			);
			expect(screen.queryByText("criticalSuccess")).not.toBeInTheDocument();
			expect(screen.getByText("criticalHit")).toBeInTheDocument();
			expect(screen.queryByText("hypeTrain")).not.toBeInTheDocument();
		});

		it("shows hype train message with lowest priority", () => {
			render(
				<GameScreen
					{...mockProps}
					showCriticalSuccess={false}
					showCriticalHit={false}
					showHypeTrain={true}
					consecutiveFastAnswers={5}
				/>,
			);
			expect(screen.queryByText("criticalSuccess")).not.toBeInTheDocument();
			expect(screen.queryByText("criticalHit")).not.toBeInTheDocument();
			expect(screen.getByText("hypeTrain (5)")).toBeInTheDocument();
		});
	});

	describe("mute functionality", () => {
		it("shows muted icon when sound is muted", () => {
			render(<GameScreen {...mockProps} isMuted={true} />);
			expect(screen.getByTestId("volume-x-icon")).toBeInTheDocument();
		});

		it("shows unmuted icon when sound is not muted", () => {
			render(<GameScreen {...mockProps} isMuted={false} />);
			expect(screen.getByTestId("volume-2-icon")).toBeInTheDocument();
		});
	});

	describe("game state interactions", () => {
		it("formats time correctly", () => {
			render(<GameScreen {...mockProps} totalTimeElapsed={65} />);
			expect(screen.getByText("1:05")).toBeInTheDocument();
		});

		it("formats pokemon number with leading zeros", () => {
			const pokemonWithLowId = { ...mockPokemon, id: 5 };
			render(<GameScreen {...mockProps} currentPokemon={pokemonWithLowId} />);
			expect(screen.getByText("#005")).toBeInTheDocument();
		});

		it("handles undefined pokemon gracefully", () => {
			render(<GameScreen {...mockProps} currentPokemon={undefined} />);
			expect(screen.getByText("???")).toBeInTheDocument();
		});

		it("shows correct remaining count", () => {
			render(<GameScreen {...mockProps} remainingCount={8} totalCount={10} />);
			expect(screen.getByTestId("pokemon-count")).toHaveTextContent("8/10");
		});
	});
});
