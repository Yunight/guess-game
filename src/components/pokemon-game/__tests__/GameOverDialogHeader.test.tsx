import { describe, expect, it } from "vitest";
import { render, screen } from "../../../test/test-utils";
import { Dialog } from "@/components/ui/dialog";
import { GameOverDialogHeader } from "../GameOverDialogHeader";

const renderHeader = (props: {
	isComplete: boolean;
	playerName: string;
	selectedGeneration: { name: string };
}): void => {
	render(
		<Dialog open>
			<GameOverDialogHeader {...props} />
		</Dialog>,
	);
};

describe("GameOverDialogHeader", () => {
	it("renders standard game over header", () => {
		renderHeader({
			isComplete: false,
			playerName: "Ash",
			selectedGeneration: { name: "Generation 1" },
		});

		expect(screen.getByText("gameOver")).toBeInTheDocument();
	});

	it("renders legendary completion header", () => {
		renderHeader({
			isComplete: true,
			playerName: "Ash",
			selectedGeneration: { name: "Generation 1" },
		});

		expect(
			screen.getByText(/MAÎTRE POKÉMON LÉGENDAIRE!|LEGENDARY POKÉMON MASTER!/),
		).toBeInTheDocument();
	});
});
