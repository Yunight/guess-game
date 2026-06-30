import { describe, expect, it } from "vitest";
import {
	extractFirebaseErrorCode,
	getAuthDialogSubtitleKey,
	getAuthDialogTitleKey,
	shouldClearEmailError,
	validateForgotPassword,
	validateSignUpSubmit,
} from "../emailAuthLogic";

describe("extractFirebaseErrorCode", () => {
	it("extracts error code from firebase message", () => {
		expect(
			extractFirebaseErrorCode("Firebase: Error (auth/wrong-password)."),
		).toBe("auth/wrong-password");
	});

	it("returns default when no code found", () => {
		expect(extractFirebaseErrorCode("Unknown error")).toBe("auth/default");
	});
});

describe("validateSignUpSubmit", () => {
	it("proceeds for sign in mode", () => {
		expect(
			validateSignUpSubmit({
				isSignUp: false,
				trainerName: "",
				hasError: false,
			}),
		).toEqual({ action: "proceed" });
	});

	it("aborts when trainer name is missing on sign up", () => {
		expect(
			validateSignUpSubmit({
				isSignUp: true,
				trainerName: "  ",
				hasError: false,
			}),
		).toEqual({ action: "abort", reason: "trainerNameRequired" });
	});

	it("aborts when existing error on sign up", () => {
		expect(
			validateSignUpSubmit({
				isSignUp: true,
				trainerName: "Ash",
				hasError: true,
			}),
		).toEqual({ action: "abort", reason: "existingError" });
	});

	it("proceeds for valid sign up", () => {
		expect(
			validateSignUpSubmit({
				isSignUp: true,
				trainerName: "Ash",
				hasError: false,
			}),
		).toEqual({ action: "proceed" });
	});
});

describe("validateForgotPassword", () => {
	it("aborts when email is empty", () => {
		expect(validateForgotPassword({ email: "  " })).toEqual({
			action: "abort",
			reason: "emailRequired",
		});
	});

	it("proceeds when email is provided", () => {
		expect(validateForgotPassword({ email: "ash@example.com" })).toEqual({
			action: "proceed",
		});
	});
});

describe("shouldClearEmailError", () => {
	it("returns true when error mentions email", () => {
		expect(shouldClearEmailError("Invalid email format")).toBe(true);
	});

	it("returns false when error does not mention email", () => {
		expect(shouldClearEmailError("Wrong password")).toBe(false);
	});
});

describe("getAuthDialogTitleKey", () => {
	it("returns forgotPassword in reset mode", () => {
		expect(getAuthDialogTitleKey(true, false)).toBe("forgotPassword");
	});

	it("returns signUp when signing up", () => {
		expect(getAuthDialogTitleKey(false, true)).toBe("signUp");
	});

	it("returns signIn by default", () => {
		expect(getAuthDialogTitleKey(false, false)).toBe("signIn");
	});
});

describe("getAuthDialogSubtitleKey", () => {
	it("returns enterEmailForReset in reset mode", () => {
		expect(getAuthDialogSubtitleKey(true, false)).toBe("enterEmailForReset");
	});

	it("returns startYourJourney when signing up", () => {
		expect(getAuthDialogSubtitleKey(false, true)).toBe("startYourJourney");
	});

	it("returns welcomeBack by default", () => {
		expect(getAuthDialogSubtitleKey(false, false)).toBe("welcomeBack");
	});
});
