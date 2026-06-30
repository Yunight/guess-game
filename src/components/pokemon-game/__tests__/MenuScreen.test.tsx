import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "../../../test/test-utils";
import { GENERATIONS } from "../generations";
import { MenuScreen } from "../MenuScreen";

vi.mock("../HowToPlay", () => ({
	HowToPlay: () => null,
}));

vi.mock("../GameModeDialog", () => ({
	GameModeDialog: ({
		isOpen,
		onSelectMode,
	}: {
		isOpen: boolean;
		onSelectMode: (hard: boolean) => void;
	}) =>
		isOpen ? (
			<div>
				<button type="button" onClick={() => onSelectMode(false)}>
					easy-mode
				</button>
			</div>
		) : null,
}));

vi.mock("../MenuPlayerForm", () => ({
	MenuPlayerForm: () => <div data-testid="menu-player-form" />,
}));

vi.mock("../MenuGenerationPicker", () => ({
	MenuGenerationPicker: () => <div data-testid="menu-generation-picker" />,
}));

vi.mock("../MenuRankingsList", () => ({
	MenuRankingsList: () => <div data-testid="menu-rankings-list" />,
}));

const baseProps = {
	player: {
		playerName: "Ash",
		nameError: null,
		onPlayerNameChange: vi.fn(),
		checkNameAvailability: vi.fn().mockResolvedValue(true),
	},
	generation: {
		selectedGeneration: GENERATIONS[0],
		onGenerationSelect: vi.fn(),
	},
	canStartGame: true,
	startGame: vi.fn(),
	onStartMulti: vi.fn(),
	isCreatingMultiRoom: false,
	multiError: null,
	score: 0,
	audio: {
		isMuted: false,
		setIsMuted: vi.fn(),
	},
	rankings: {
		rankings: [],
		rankingError: null,
		formatTimeForRanking: (seconds: number): string => `${seconds}s`,
		formatDate: (): string => "today",
	},
};

describe("MenuScreen", () => {
	it("renders title and rankings panel", () => {
		render(<MenuScreen {...baseProps} />);

		expect(screen.getByText("title")).toBeInTheDocument();
		expect(screen.getByTestId("menu-rankings-list")).toBeInTheDocument();
	});

	it("disables solo button when cannot start", () => {
		render(<MenuScreen {...baseProps} canStartGame={false} />);
		expect(screen.getByRole("button", { name: /solo/i })).toBeDisabled();
	});

	it("opens game mode dialog and starts game", () => {
		const startGame = vi.fn();
		render(<MenuScreen {...baseProps} startGame={startGame} />);

		fireEvent.click(screen.getByRole("button", { name: /solo/i }));
		fireEvent.click(screen.getByText("easy-mode"));

		expect(startGame).toHaveBeenCalledWith(false);
	});

	it("shows replay label when score is positive", () => {
		render(<MenuScreen {...baseProps} score={100} />);
		expect(screen.getByText("replay")).toBeInTheDocument();
	});
});
