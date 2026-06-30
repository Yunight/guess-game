export const getReplayButtonClassName = (isComplete: boolean): string => {
	return isComplete
		? "bg-yellow-400 hover:bg-yellow-500"
		: "bg-yellow-400 hover:bg-yellow-500";
};

export const getShareButtonClassName = (isComplete: boolean): string => {
	return isComplete
		? "bg-green-400 hover:bg-green-500"
		: "bg-green-500 hover:bg-green-600";
};

export const getMenuButtonClassName = (isComplete: boolean): string => {
	return isComplete
		? "bg-blue-400 hover:bg-blue-500"
		: "bg-blue-500 hover:bg-blue-600";
};

export const getActionsGridMarginClassName = (
	shareableUrl: string | null,
): string => {
	return shareableUrl ? "mt-8" : "mt-6";
};
