import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vite-plus/test";
import { GuessInput } from "../GuessInput";
import { createRef } from "react";

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		t: (key: string) => key,
	}),
}));

describe("GuessInput", () => {
	const defaultProps = {
		guess: "",
		handleGuessChange: vi.fn(),
		handleKeyDown: vi.fn(),
		suggestions: [],
		handleSuggestionClick: vi.fn(),
		highlightedIndex: -1,
		inputRef: createRef<HTMLInputElement>(),
		suggestionsRef: createRef<HTMLDivElement>(),
		isCorrect: null,
		guessTimeLeft: 60,
	};

	test("renders input field", () => {
		render(<GuessInput {...defaultProps} />);
		expect(screen.getByRole("textbox")).toBeInTheDocument();
	});

	test("handles guess input", async () => {
		const handleGuessChange = vi.fn();
		render(<GuessInput {...defaultProps} handleGuessChange={handleGuessChange} />);

		const input = screen.getByRole("textbox");
		await userEvent.type(input, "pikachu");
		expect(handleGuessChange).toHaveBeenCalled();
	});

	test("shows suggestions when available", () => {
		const suggestions = ["Pikachu", "Pichu", "Pidgey"];
		render(<GuessInput {...defaultProps} suggestions={suggestions} />);

		suggestions.forEach((suggestion) => {
			expect(screen.getByText(suggestion)).toBeInTheDocument();
		});
	});

	test("handles suggestion click", async () => {
		const handleSuggestionClick = vi.fn();
		const suggestions = ["Pikachu", "Pichu", "Pidgey"];
		render(
			<GuessInput
				{...defaultProps}
				suggestions={suggestions}
				handleSuggestionClick={handleSuggestionClick}
			/>,
		);

		await userEvent.click(screen.getByText("Pikachu"));
		expect(handleSuggestionClick).toHaveBeenCalledWith("Pikachu");
	});

	test("handles key down events", async () => {
		const handleKeyDown = vi.fn();
		render(<GuessInput {...defaultProps} handleKeyDown={handleKeyDown} />);

		const input = screen.getByRole("textbox");
		await userEvent.type(input, "{enter}");
		expect(handleKeyDown).toHaveBeenCalled();
	});

	test("disables input when time is up", () => {
		render(<GuessInput {...defaultProps} guessTimeLeft={0} />);
		expect(screen.getByRole("textbox")).toBeDisabled();
	});

	test("shows correct state styling", () => {
		render(<GuessInput {...defaultProps} isCorrect={true} />);
		expect(screen.getByRole("textbox")).toHaveClass("border-green-500");
	});

	test("shows incorrect state styling", () => {
		render(<GuessInput {...defaultProps} isCorrect={false} />);
		expect(screen.getByRole("textbox")).toHaveClass("border-red-500");
	});
});
