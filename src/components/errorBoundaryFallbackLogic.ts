const isMobileUserAgent = (userAgent: string): boolean => {
	return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
		userAgent,
	);
};

const isNetworkErrorMessage = (message: string | undefined): boolean => {
	if (!message) {
		return false;
	}
	return (
		message.includes("fetch") ||
		message.includes("network") ||
		message.includes("load")
	);
};

export const shouldShowMobileNetworkHelp = (
	userAgent: string,
	errorMessage: string | undefined,
): boolean => isMobileUserAgent(userAgent) && isNetworkErrorMessage(errorMessage);

export const getErrorBoundaryTitle = (
	userAgent: string,
): string =>
	isMobileUserAgent(userAgent)
		? "Mobile Loading Error"
		: "Something went wrong";
