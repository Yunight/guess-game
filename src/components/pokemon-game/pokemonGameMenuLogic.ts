export const resolveCanStartGame = (input: {
	playerName: string;
	nameError: string | null;
	isCheckingName: boolean;
	savedName: string | null;
	isAuthName: boolean;
}): boolean => {
	if (input.savedName && input.playerName === input.savedName) {
		return true;
	}

	if (input.playerName && input.isAuthName) {
		return true;
	}

	return Boolean(
		input.playerName && !input.nameError && !input.isCheckingName,
	);
};
