import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, test, vi } from "vitest";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "../dialog";

describe("Dialog", () => {
	test("renders dialog with content when open", () => {
		render(
			<Dialog open>
				<DialogContent>
					<DialogHeader>
						<DialogTitle>Test Title</DialogTitle>
						<DialogDescription>Test Description</DialogDescription>
					</DialogHeader>
					<div>Test Content</div>
					<DialogFooter>Test Footer</DialogFooter>
				</DialogContent>
			</Dialog>,
		);

		expect(screen.getByText("Test Title")).toBeInTheDocument();
		expect(screen.getByText("Test Description")).toBeInTheDocument();
		expect(screen.getByText("Test Content")).toBeInTheDocument();
		expect(screen.getByText("Test Footer")).toBeInTheDocument();
	});

	test("does not render dialog content when closed", () => {
		render(
			<Dialog open={false}>
				<DialogContent>
					<DialogTitle>Test Title</DialogTitle>
					<DialogDescription>Test Description</DialogDescription>
				</DialogContent>
			</Dialog>,
		);

		expect(screen.queryByText("Test Title")).not.toBeInTheDocument();
	});

	test("calls onOpenChange when clicking outside", async () => {
		const handleOpenChange = vi.fn();
		render(
			<Dialog open onOpenChange={handleOpenChange}>
				<DialogContent>
					<DialogTitle>Test Title</DialogTitle>
					<DialogDescription>Test Description</DialogDescription>
				</DialogContent>
			</Dialog>,
		);

		const overlay = screen.getByTestId("dialog-overlay");
		await userEvent.click(overlay);
		expect(handleOpenChange).toHaveBeenCalledWith(false);
	});

	test("renders dialog with custom className", () => {
		render(
			<Dialog open>
				<DialogContent className="custom-class">
					<DialogTitle>Test Title</DialogTitle>
					<DialogDescription>Test Description</DialogDescription>
				</DialogContent>
			</Dialog>,
		);

		const dialog = screen.getByRole("dialog");
		expect(dialog).toHaveClass("custom-class");
	});
});
