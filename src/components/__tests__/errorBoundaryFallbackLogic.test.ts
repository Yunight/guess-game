import { describe, expect, it } from "vite-plus/test";
import { getErrorBoundaryTitle, shouldShowMobileNetworkHelp } from "../errorBoundaryFallbackLogic";

describe("errorBoundaryFallbackLogic", () => {
	it("detects mobile network help scenarios", () => {
		expect(
			shouldShowMobileNetworkHelp(
				"Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)",
				"Failed to fetch module",
			),
		).toBe(true);
	});

	it("returns mobile title for phone user agents", () => {
		expect(getErrorBoundaryTitle("Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X)")).toBe(
			"Mobile Loading Error",
		);
	});
});
