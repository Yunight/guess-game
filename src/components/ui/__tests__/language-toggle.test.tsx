import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import { LanguageToggle } from "../language-toggle";

const changeLanguage = vi.fn();

// Mock i18next
vi.mock("react-i18next", () => ({
	useTranslation: () => ({
		i18n: {
			language: "en",
			changeLanguage,
		},
	}),
}));

describe("LanguageToggle", () => {
	test("renders language toggle button", () => {
		render(<LanguageToggle />);
		expect(screen.getByRole("button")).toBeInTheDocument();
	});

	test("displays current language", () => {
		render(<LanguageToggle />);
		expect(screen.getByTitle("Passer en Français")).toBeInTheDocument();
	});

	test("handles language change", async () => {
		render(<LanguageToggle />);
		const button = screen.getByRole("button");
		await userEvent.click(button);
		expect(changeLanguage).toHaveBeenCalledWith("fr");
	});
});
