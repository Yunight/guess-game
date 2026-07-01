export const extractFirebaseErrorCode = (message: string): string => {
	const match = message.match(/\(([^)]+)\)/);
	if (match?.[1]) {
		return match[1];
	}
	return "auth/default";
};

export interface SignUpValidationInput {
	isSignUp: boolean;
	trainerName: string;
	hasError: boolean;
}

export type SignUpValidationResult =
	| { action: "proceed" }
	| { action: "abort"; reason: "trainerNameRequired" | "existingError" };

export const validateSignUpSubmit = (input: SignUpValidationInput): SignUpValidationResult => {
	if (!input.isSignUp) {
		return { action: "proceed" };
	}

	if (!input.trainerName.trim()) {
		return { action: "abort", reason: "trainerNameRequired" };
	}

	if (input.hasError) {
		return { action: "abort", reason: "existingError" };
	}

	return { action: "proceed" };
};

export interface ForgotPasswordValidationInput {
	email: string;
}

export type ForgotPasswordValidationResult =
	| { action: "proceed" }
	| { action: "abort"; reason: "emailRequired" };

export const validateForgotPassword = (
	input: ForgotPasswordValidationInput,
): ForgotPasswordValidationResult => {
	if (!input.email.trim()) {
		return { action: "abort", reason: "emailRequired" };
	}
	return { action: "proceed" };
};

export const shouldClearEmailError = (error: string | null): boolean => {
	return Boolean(error?.includes("email"));
};

export const getAuthDialogTitleKey = (isResetMode: boolean, isSignUp: boolean): string => {
	if (isResetMode) {
		return "forgotPassword";
	}
	return isSignUp ? "signUp" : "signIn";
};

export const getAuthDialogSubtitleKey = (isResetMode: boolean, isSignUp: boolean): string => {
	if (isResetMode) {
		return "enterEmailForReset";
	}
	return isSignUp ? "startYourJourney" : "welcomeBack";
};
