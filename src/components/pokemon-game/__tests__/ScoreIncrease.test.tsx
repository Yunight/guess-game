import { describe, it, expect } from "vitest";
import { render, screen } from "../../../test/test-utils";
import { ScoreIncrease } from "../ScoreIncrease";

describe("ScoreIncrease", () => {
	it("renders score increase with correct value", () => {
		render(<ScoreIncrease points={5} />);
		expect(screen.getByText("+5")).toBeInTheDocument();
	});

	it("shows bonus styling for high points", () => {
		render(<ScoreIncrease points={3} />);
		const scoreElement = screen.getByText("+3");
		expect(scoreElement.className).toContain("text-yellow-300");
		expect(scoreElement.className).toContain("bg-purple-900/80");
	});

	it("shows normal styling for low points", () => {
		render(<ScoreIncrease points={2} />);
		const scoreElement = screen.getByText("+2");
		expect(scoreElement.className).toContain("text-green-400");
		expect(scoreElement.className).toContain("bg-black/50");
	});

	it("shows bonus emoji for high points", () => {
		render(<ScoreIncrease points={3} />);
		expect(screen.getByText("🎯")).toBeInTheDocument();
	});

	it("does not show bonus emoji for low points", () => {
		render(<ScoreIncrease points={2} />);
		expect(screen.queryByText("🎯")).not.toBeInTheDocument();
	});
});
