import { describe, expect, it, vi } from "vitest";
import { render, screen } from "../../../test/test-utils";
import { MenuRankingsList } from "../MenuRankingsList";

describe("MenuRankingsList", () => {
	it("renders rankings and empty state", () => {
		const { rerender } = render(
			<MenuRankingsList
				rankings={[
					{
						name: "Ash",
						score: 500,
						time: 120,
						timestamp: new Date("2024-01-01"),
						uid: null,
					},
				]}
				playerName="Ash"
				formatTimeForRanking={(seconds) => `${seconds}s`}
				formatDate={() => "Jan 1"}
			/>,
		);

		expect(screen.getByText(/Ash/)).toBeInTheDocument();
		expect(screen.getByText("500")).toBeInTheDocument();

		rerender(
			<MenuRankingsList
				rankings={[]}
				playerName="Ash"
				formatTimeForRanking={(seconds) => `${seconds}s`}
				formatDate={() => "Jan 1"}
			/>,
		);

		expect(screen.getByText("noRankings")).toBeInTheDocument();
	});
});
