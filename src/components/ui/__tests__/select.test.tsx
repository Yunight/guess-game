import { render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "../select";

// Mock ResizeObserver
const mockResizeObserver = vi.fn(() => ({
	observe: vi.fn(),
	unobserve: vi.fn(),
	disconnect: vi.fn(),
}));
vi.stubGlobal("ResizeObserver", mockResizeObserver);

// Mock pointer capture methods
Element.prototype.setPointerCapture = vi.fn();
Element.prototype.releasePointerCapture = vi.fn();
Element.prototype.hasPointerCapture = vi.fn();

describe("Select", () => {
	test("renders select with placeholder", () => {
		render(
			<Select>
				<SelectTrigger>
					<SelectValue placeholder="Select an option" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="1">Option 1</SelectItem>
					<SelectItem value="2">Option 2</SelectItem>
				</SelectContent>
			</Select>,
		);

		expect(screen.getByText("Select an option")).toBeInTheDocument();
	});

	test("renders select with custom className", () => {
		render(
			<Select>
				<SelectTrigger className="custom-class">
					<SelectValue placeholder="Select an option" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="1">Option 1</SelectItem>
				</SelectContent>
			</Select>,
		);

		expect(screen.getByRole("combobox")).toHaveClass("custom-class");
	});

	test("renders disabled select", () => {
		render(
			<Select disabled>
				<SelectTrigger>
					<SelectValue placeholder="Select an option" />
				</SelectTrigger>
				<SelectContent>
					<SelectItem value="1">Option 1</SelectItem>
				</SelectContent>
			</Select>,
		);

		expect(screen.getByRole("combobox")).toBeDisabled();
	});
});
