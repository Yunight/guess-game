import { describe, expect, it, vi } from "vite-plus/test";
import { copyTextToClipboard, createFallbackCopyHandler, shareOrCopyUrl } from "../resultsPageCopy";

describe("copyTextToClipboard", () => {
	it("returns success when clipboard write succeeds", async () => {
		const writeText = vi.fn().mockResolvedValue(undefined);
		const fallbackCopy = vi.fn().mockReturnValue(false);

		await expect(copyTextToClipboard("https://example.com", writeText, fallbackCopy)).resolves.toBe(
			"success",
		);
	});

	it("returns fallbackSuccess when clipboard fails but fallback succeeds", async () => {
		const writeText = vi.fn().mockRejectedValue(new Error("denied"));
		const fallbackCopy = vi.fn().mockReturnValue(true);

		await expect(copyTextToClipboard("https://example.com", writeText, fallbackCopy)).resolves.toBe(
			"fallbackSuccess",
		);
	});

	it("returns failure when both methods fail", async () => {
		const writeText = vi.fn().mockRejectedValue(new Error("denied"));
		const fallbackCopy = vi.fn().mockReturnValue(false);

		await expect(copyTextToClipboard("https://example.com", writeText, fallbackCopy)).resolves.toBe(
			"failure",
		);
	});
});

describe("createFallbackCopyHandler", () => {
	it("copies text using execCommand", () => {
		const textArea = document.createElement("textarea");
		const selectSpy = vi.spyOn(textArea, "select");
		const appendChild = vi.fn();
		const removeChild = vi.fn();
		const execCommand = vi.fn().mockReturnValue(true);

		const handler = createFallbackCopyHandler(
			() => textArea,
			appendChild,
			removeChild,
			execCommand,
		);

		expect(handler("https://example.com")).toBe(true);
		expect(textArea.value).toBe("https://example.com");
		expect(selectSpy).toHaveBeenCalled();
		expect(appendChild).toHaveBeenCalledWith(textArea);
		expect(removeChild).toHaveBeenCalledWith(textArea);
	});
});

describe("shareOrCopyUrl", () => {
	it("uses native share when available", async () => {
		const share = vi.fn().mockResolvedValue(undefined);
		const writeClipboard = vi.fn();

		await expect(shareOrCopyUrl("text", "url", true, share, writeClipboard)).resolves.toBe(
			"shared",
		);
		expect(share).toHaveBeenCalledWith({ text: "text", url: "url" });
	});

	it("copies to clipboard when native share is unavailable", async () => {
		const share = vi.fn();
		const writeClipboard = vi.fn().mockResolvedValue(undefined);

		await expect(shareOrCopyUrl("text", "url", false, share, writeClipboard)).resolves.toBe(
			"clipboard",
		);
	});

	it("falls back to clipboard when share fails", async () => {
		const share = vi.fn().mockRejectedValue(new Error("cancelled"));
		const writeClipboard = vi.fn().mockResolvedValue(undefined);

		await expect(shareOrCopyUrl("text", "url", true, share, writeClipboard)).resolves.toBe(
			"clipboardFallback",
		);
	});

	it("returns failure when all copy methods fail", async () => {
		const share = vi.fn().mockRejectedValue(new Error("cancelled"));
		const writeClipboard = vi.fn().mockRejectedValue(new Error("denied"));

		await expect(shareOrCopyUrl("text", "url", true, share, writeClipboard)).resolves.toBe(
			"failure",
		);
	});
});
