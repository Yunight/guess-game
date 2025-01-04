import { describe, it, expect } from "vitest";
import { render, screen } from "../../../test/test-utils";
import { GameStats } from "../GameStats";

describe("GameStats", () => {
	const mockProps = {
		score: 100,
		bestScore: 200,
		guessTimeLeft: 30,
		hintsLeft: 3,
		formatTime: (seconds: number) =>
			`${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, "0")}`,
		bestTime: 120,
	};

	it("renders all stats correctly", () => {
		render(<GameStats {...mockProps} />);

		// Score stats
		expect(screen.getByText("100")).toBeInTheDocument();
		expect(screen.getByText(/best: 200/)).toBeInTheDocument();

		// Time stats
		expect(screen.getByText("0:30")).toBeInTheDocument();
		expect(screen.getByText(/best: 2:00/)).toBeInTheDocument();

		// Hints
		expect(screen.getByText("3")).toBeInTheDocument();
	});

	it("shows different time formats", () => {
		const { rerender } = render(<GameStats {...mockProps} guessTimeLeft={5} />);
		expect(screen.getByText("0:05")).toBeInTheDocument();

		rerender(<GameStats {...mockProps} guessTimeLeft={65} />);
		expect(screen.getByText("1:05")).toBeInTheDocument();
	});

	it("handles zero values", () => {
		render(
			<GameStats
				{...mockProps}
				score={0}
				bestScore={0}
				guessTimeLeft={0}
				hintsLeft={0}
				bestTime={0}
			/>,
		);

		expect(screen.getByText("score")).toBeInTheDocument();
		expect(
			screen.getByText("0", { selector: '[data-testid="current-score"]' }),
		).toBeInTheDocument();
		expect(screen.getByText("0:00")).toBeInTheDocument();
	});

	it("shows infinite hints correctly", () => {
		render(<GameStats {...mockProps} hintsLeft={Infinity} />);
		expect(screen.getByText("∞")).toBeInTheDocument();
	});

	it("shows warning style for low time", () => {
		render(<GameStats {...mockProps} guessTimeLeft={5} />);
		const timeElement = screen.getByText("0:05");
		expect(timeElement.className).toContain("text-red-400");
	});

	it("shows normal style for sufficient time", () => {
		render(<GameStats {...mockProps} guessTimeLeft={30} />);
		const timeElement = screen.getByText("0:30");
		expect(timeElement.className).not.toContain("text-red-400");
	});

	it("shows best score highlight when current score matches best score", () => {
		render(<GameStats {...mockProps} score={200} bestScore={200} />);
		const scoreElement = screen.getByText("200");
		expect(scoreElement.className).toContain("text-white");
	});

	it("shows score labels correctly", () => {
		render(<GameStats {...mockProps} />);
		expect(screen.getByText("score")).toBeInTheDocument();
		expect(screen.getByText("time")).toBeInTheDocument();
		expect(screen.getByText("remainingHints")).toBeInTheDocument();
	});
});
