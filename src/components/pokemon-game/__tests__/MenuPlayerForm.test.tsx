import { describe, expect, it, vi } from "vite-plus/test";
import { render, screen } from "../../../test/test-utils";
import { MenuPlayerForm } from "../MenuPlayerForm";

vi.mock("../../../firebase", () => ({
	auth: { currentUser: null },
}));

vi.mock("../AuthButtons", () => ({
	AuthButtons: () => <div data-testid="auth-buttons" />,
}));

describe("MenuPlayerForm", () => {
	it("renders trainer name input for guests", () => {
		render(
			<MenuPlayerForm
				playerName=""
				nameError={null}
				onPlayerNameChange={vi.fn()}
				checkNameAvailability={vi.fn().mockResolvedValue(true)}
			/>,
		);

		expect(screen.getByLabelText("trainerName")).toBeInTheDocument();
		expect(screen.getByTestId("auth-buttons")).toBeInTheDocument();
	});

	it("shows name error when provided", () => {
		render(
			<MenuPlayerForm
				playerName="Ash"
				nameError="Name taken"
				onPlayerNameChange={vi.fn()}
				checkNameAvailability={vi.fn().mockResolvedValue(true)}
			/>,
		);

		expect(screen.getByText("Name taken")).toBeInTheDocument();
	});
});
