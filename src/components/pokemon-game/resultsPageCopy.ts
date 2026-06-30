export type CopyUrlResult = "success" | "fallbackSuccess" | "failure";

export const copyTextToClipboard = async (
	text: string,
	writeText: (value: string) => Promise<void>,
	fallbackCopy: (value: string) => boolean,
): Promise<CopyUrlResult> => {
	try {
		await writeText(text);
		return "success";
	} catch {
		const fallbackSucceeded = fallbackCopy(text);
		return fallbackSucceeded ? "fallbackSuccess" : "failure";
	}
};

export const createFallbackCopyHandler = (
	createTextArea: () => HTMLTextAreaElement,
	appendChild: (element: HTMLTextAreaElement) => void,
	removeChild: (element: HTMLTextAreaElement) => void,
	execCommand: (command: string) => boolean,
): ((text: string) => boolean) => {
	return (text: string): boolean => {
		const textArea = createTextArea();
		textArea.value = text;
		appendChild(textArea);
		textArea.select();
		try {
			return execCommand("copy");
		} catch {
			return false;
		} finally {
			removeChild(textArea);
		}
	};
};

export type ShareResultOutcome = "shared" | "clipboard" | "clipboardFallback" | "failure";

export const shareOrCopyUrl = async (
	shareText: string,
	shareUrl: string,
	canNativeShare: boolean,
	share: (data: { text: string; url: string }) => Promise<void>,
	writeClipboard: (text: string) => Promise<void>,
): Promise<ShareResultOutcome> => {
	try {
		if (canNativeShare) {
			await share({ text: shareText, url: shareUrl });
			return "shared";
		}
		await writeClipboard(shareUrl);
		return "clipboard";
	} catch {
		try {
			await writeClipboard(shareUrl);
			return "clipboardFallback";
		} catch {
			return "failure";
		}
	}
};
