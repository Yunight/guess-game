import { describe, expect, it, vi } from "vite-plus/test";
import { render, screen, fireEvent } from "../../../test/test-utils";
import { GameOverActions } from "../GameOverActions";

describe("GameOverActions", () => {
	it("renders action buttons and share link", () => {
		const onCopyUrl = vi.fn();
		const onRestart = vi.fn();
		const onShare = vi.fn();
		const onBackToMenu = vi.fn();

		render(
			<GameOverActions
				shareableUrl="https://example.com/results/abc"
				urlCopied={false}
				isSavingResult={false}
				isComplete={false}
				onCopyUrl={onCopyUrl}
				onRestart={onRestart}
				onShare={onShare}
				onBackToMenu={onBackToMenu}
			/>,
		);

		expect(screen.getByText("https://example.com/results/abc")).toBeInTheDocument();
		fireEvent.click(screen.getByText("share"));
		expect(onShare).toHaveBeenCalled();
	});
});
