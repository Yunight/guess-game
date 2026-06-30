import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../../../test/test-utils";
import { GameOverStats } from "../GameOverStats";

describe("GameOverStats", () => {
	it("renders score, time, and statistics", () => {
		render(
			<GameOverStats
				score={500}
				bestScore={600}
				displayTime={120}
				bestTime={90}
				userRanking={3}
				bestRanking={2}
				criticalHitCount={2}
				criticalSuccessCount={1}
				hyperTrainCount={1}
				maxHypeChain={4}
			/>,
		);

		expect(screen.getByText("500")).toBeInTheDocument();
		expect(screen.getByText("600")).toBeInTheDocument();
		expect(screen.getByText("#3")).toBeInTheDocument();
		expect(screen.getByText("2")).toBeInTheDocument();
	});
});
