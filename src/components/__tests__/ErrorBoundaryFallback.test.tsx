import { describe, expect, it, vi } from "vitest";
import { render, screen, fireEvent } from "../../test/test-utils";
import { ErrorBoundaryFallback } from "../ErrorBoundaryFallback";

describe("ErrorBoundaryFallback", () => {
	it("renders desktop error message", () => {
		render(
			<ErrorBoundaryFallback
				error={new Error("boom")}
				errorInfo={undefined}
				isDev={false}
				onRetry={vi.fn()}
				onRefresh={vi.fn()}
				userAgent="Mozilla/5.0"
			/>,
		);

		expect(screen.getByText("Something went wrong")).toBeInTheDocument();
		expect(
			screen.getByText(
				"An unexpected error occurred. Please try refreshing the page.",
			),
		).toBeInTheDocument();
	});

	it("renders mobile network help for fetch errors", () => {
		render(
			<ErrorBoundaryFallback
				error={new Error("Failed to fetch module")}
				errorInfo={undefined}
				isDev={false}
				onRetry={vi.fn()}
				onRefresh={vi.fn()}
				userAgent="Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)"
			/>,
		);

		expect(screen.getByText("Mobile Loading Error")).toBeInTheDocument();
		expect(screen.getByText(/Check your internet connection/)).toBeInTheDocument();
	});

	it("calls retry and refresh handlers", () => {
		const onRetry = vi.fn();
		const onRefresh = vi.fn();

		render(
			<ErrorBoundaryFallback
				error={new Error("boom")}
				errorInfo={undefined}
				isDev={false}
				onRetry={onRetry}
				onRefresh={onRefresh}
				userAgent="Mozilla/5.0"
			/>,
		);

		fireEvent.click(screen.getByText("Try Again"));
		fireEvent.click(screen.getByText("Refresh Page"));

		expect(onRetry).toHaveBeenCalled();
		expect(onRefresh).toHaveBeenCalled();
	});
});
