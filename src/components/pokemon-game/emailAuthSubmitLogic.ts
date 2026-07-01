import type { UserCredential } from "firebase/auth";
import {
	extractFirebaseErrorCode,
	validateSignUpSubmit,
	type SignUpValidationInput,
} from "./emailAuthLogic";

export interface EmailAuthSubmitInput {
	isSignUp: boolean;
	email: string;
	password: string;
	trainerName: string;
	hasError: boolean;
}

export type EmailAuthSubmitResult =
	| { status: "validation_failed"; errorKey: string }
	| { status: "success"; isSignUp: boolean; displayName: string | null }
	| { status: "error"; errorKey: string };

export interface EmailAuthSubmitDeps {
	createUser: (email: string, password: string) => Promise<UserCredential>;
	signIn: (email: string, password: string) => Promise<UserCredential>;
	updateDisplayName: (user: UserCredential["user"], name: string) => Promise<void>;
	persistPlayerName: (name: string) => void;
	reloadPage: () => void;
	translateError: (code: string) => string;
	translateValidation: (key: string) => string;
}

export const executeEmailAuthSubmit = async (
	input: EmailAuthSubmitInput,
	deps: EmailAuthSubmitDeps,
): Promise<EmailAuthSubmitResult> => {
	const validation = validateSignUpSubmit({
		isSignUp: input.isSignUp,
		trainerName: input.trainerName,
		hasError: input.hasError,
	} satisfies SignUpValidationInput);

	if (validation.action === "abort") {
		return {
			status: "validation_failed",
			errorKey: deps.translateValidation(validation.reason),
		};
	}

	try {
		if (input.isSignUp) {
			const userCredential = await deps.createUser(input.email, input.password);
			await deps.updateDisplayName(userCredential.user, input.trainerName);
			deps.persistPlayerName(input.trainerName);
			deps.reloadPage();
			return {
				status: "success",
				isSignUp: true,
				displayName: input.trainerName,
			};
		}

		const userCredential = await deps.signIn(input.email, input.password);
		if (userCredential.user.displayName) {
			deps.persistPlayerName(userCredential.user.displayName);
		}
		deps.reloadPage();
		return {
			status: "success",
			isSignUp: false,
			displayName: userCredential.user.displayName,
		};
	} catch (caughtError: unknown) {
		if (caughtError instanceof Error) {
			const errorCode = extractFirebaseErrorCode(caughtError.message);
			return {
				status: "error",
				errorKey: deps.translateError(errorCode),
			};
		}
		return {
			status: "error",
			errorKey: deps.translateError("auth/default"),
		};
	}
};
