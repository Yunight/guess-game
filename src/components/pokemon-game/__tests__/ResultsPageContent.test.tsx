import type { ComponentProps } from "react";
import { describe, expect, it, vi } from "vite-plus/test";
import { MemoryRouter } from "react-router-dom";
import { fireEvent, render, screen } from "../../../test/test-utils";
import type { GameResult } from "@/services/gameResultsService";
import { ResultsPageContent } from "../ResultsPageContent";

vi.mock("../StaticPokemonDisplay", () => ({
	StaticPokemonDisplay: () => <div data-testid="reward-pokemon" />,
}));

vi.mock("../ResultsPageDebugPanel", () => ({
	ResultsPageDebugPanel: () => <div data-testid="debug-panel" />,
}));

vi.mock("../../../services/gameResultsService", () => ({
	gameResultsService: {
		generateShareableUrl: (id: string): string => `https://example.com/results/${id}`,
	},
}));

const mockGameResult = {
	id: "result-1",
	playerName: "Ash",
	score: 500,
	totalTimeElapsed: 125,
	selectedGeneration: { name: "Generation 1", startId: 1, endId: 151 },
	remainingPokemon: [1, 2, 3],
	userRanking: 5,
	criticalHitCount: 2,
	criticalSuccessCount: 0,
	hyperTrainCount: 0,
	maxHypeChain: 3,
	rewardPokemon: null,
	gameMode: "normal",
	createdAt: { seconds: 0, nanoseconds: 0 },
} satisfies GameResult;

const renderContent = (
	props: ComponentProps<typeof ResultsPageContent>,
): ReturnType<typeof render> =>
	render(
		<MemoryRouter>
			<ResultsPageContent {...props} />
		</MemoryRouter>,
	);

describe("ResultsPageContent", () => {
	it("renders game result summary", () => {
		renderContent({
			gameResult: mockGameResult,
			urlCopied: false,
			debugMode: false,
			debugRemainingPokemon: null,
			setDebugRemainingPokemon: vi.fn(),
			copyUrl: vi.fn(),
			handleShare: vi.fn(),
		});

		expect(screen.getByText("gameComplete")).toBeInTheDocument();
		expect(screen.getByText("500")).toBeInTheDocument();
		expect(screen.getByText("2:05")).toBeInTheDocument();
		expect(screen.getByText("#5")).toBeInTheDocument();
	});

	it("copies shareable url when link is clicked", () => {
		const copyUrl = vi.fn();
		renderContent({
			gameResult: mockGameResult,
			urlCopied: false,
			debugMode: false,
			debugRemainingPokemon: null,
			setDebugRemainingPokemon: vi.fn(),
			copyUrl,
			handleShare: vi.fn(),
		});

		fireEvent.click(screen.getByText("https://example.com/results/result-1"));
		expect(copyUrl).toHaveBeenCalled();
	});

	it("shows debug panel in debug mode", () => {
		renderContent({
			gameResult: mockGameResult,
			urlCopied: false,
			debugMode: true,
			debugRemainingPokemon: null,
			setDebugRemainingPokemon: vi.fn(),
			copyUrl: vi.fn(),
			handleShare: vi.fn(),
		});

		expect(screen.getByTestId("debug-panel")).toBeInTheDocument();
	});
});
