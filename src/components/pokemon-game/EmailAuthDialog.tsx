import {
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	updateProfile,
} from "firebase/auth";
import { X } from "lucide-react";
import type { FC, FormEvent } from "react";
import { useReducer } from "react";
import { useTranslation } from "react-i18next";
import { auth } from "../../firebase";
import { EmailAuthForm } from "./EmailAuthForm";
import { EmailAuthResetForm } from "./EmailAuthResetForm";
import {
	emailAuthDialogReducer,
	initialEmailAuthDialogState,
} from "./emailAuthDialogReducer";
import {
	extractFirebaseErrorCode,
	getAuthDialogSubtitleKey,
	getAuthDialogTitleKey,
	shouldClearEmailError,
	validateForgotPassword,
} from "./emailAuthLogic";
import { executeEmailAuthSubmit } from "./emailAuthSubmitLogic";

interface EmailAuthDialogProps {
	isOpen: boolean;
	onClose: () => void;
	checkNameAvailability: (name: string) => Promise<boolean>;
}

export const EmailAuthDialog: FC<EmailAuthDialogProps> = ({
	isOpen,
	onClose,
	checkNameAvailability,
}) => {
	const { t } = useTranslation();
	const [state, dispatch] = useReducer(emailAuthDialogReducer, initialEmailAuthDialogState);
	const {
		email,
		password,
		trainerName,
		isSignUp,
		isResetMode,
		error,
		isLoading,
		successMessage,
	} = state;

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		dispatch({
			type: "email_changed",
			email: e.target.value,
			clearError: shouldClearEmailError(error),
		});
	};

	const handleTrainerNameChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
		const newName = e.target.value;
		dispatch({ type: "trainer_name_changed", trainerName: newName });

		if (!newName.trim()) {
			dispatch({ type: "set_error", error: null });
			return;
		}

		const isAvailable = await checkNameAvailability(newName);
		if (!isAvailable) {
			dispatch({ type: "set_error", error: t("trainerNameTaken") });
		} else {
			dispatch({ type: "set_error", error: null });
		}
	};

	const handleForgotPassword = async (): Promise<void> => {
		const validation = validateForgotPassword({ email });
		if (validation.action === "abort") {
			dispatch({ type: "set_error", error: t(validation.reason) });
			return;
		}

		dispatch({ type: "forgot_password_started" });

		try {
			await sendPasswordResetEmail(auth, email);
			dispatch({ type: "forgot_password_succeeded", message: t("passwordResetEmailSent") });
		} catch (caughtError: unknown) {
			if (caughtError instanceof Error) {
				const errorCode = extractFirebaseErrorCode(caughtError.message);
				dispatch({ type: "forgot_password_failed", error: t(`firebaseErrors.${errorCode}`) });
			}
		} finally {
			dispatch({ type: "forgot_password_finished" });
		}
	};

	const handleResetFormSubmit = (e: FormEvent): void => {
		e.preventDefault();
		void handleForgotPassword();
	};

	const handleSubmit = async (e: FormEvent): Promise<void> => {
		e.preventDefault();
		dispatch({ type: "submit_started" });

		const result = await executeEmailAuthSubmit(
			{
				isSignUp,
				email,
				password,
				trainerName,
				hasError: Boolean(error),
			},
			{
				createUser: (authEmail, authPassword) =>
					createUserWithEmailAndPassword(auth, authEmail, authPassword),
				signIn: (authEmail, authPassword) =>
					signInWithEmailAndPassword(auth, authEmail, authPassword),
				updateDisplayName: (user, name) => updateProfile(user, { displayName: name }),
				persistPlayerName: (name) => localStorage.setItem("pokemonGamePlayerName", name),
				reloadPage: () => {
					window.location.reload();
				},
				translateError: (code) => t(`firebaseErrors.${code}`),
				translateValidation: (key) => t(key),
			},
		);

		if (result.status === "validation_failed" || result.status === "error") {
			dispatch({ type: "submit_failed", error: result.errorKey });
		} else {
			onClose();
		}

		dispatch({ type: "submit_finished" });
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
			<div className="bg-white rounded-lg p-6 w-full max-w-md relative border-4 border-red-500 shadow-lg">
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 text-gray-500 hover:text-red-600"
				>
					<X className="h-6 w-6" />
				</button>

				<div className="text-center mb-6">
					<h2 className="text-2xl font-bold text-red-600">
						{t(getAuthDialogTitleKey(isResetMode, isSignUp))}
					</h2>
					<p className="text-sm text-gray-700 mt-1">
						{t(getAuthDialogSubtitleKey(isResetMode, isSignUp))}
					</p>
				</div>

				{error && (
					<div className="bg-red-50 border-2 border-red-500 text-red-700 px-4 py-2 rounded-lg mb-4">
						{error}
					</div>
				)}

				{successMessage && (
					<div className="bg-green-50 border-2 border-green-500 text-green-700 px-4 py-2 rounded-lg mb-4">
						{successMessage}
					</div>
				)}

				{isResetMode ? (
					<EmailAuthResetForm
						email={email}
						isLoading={isLoading}
						onEmailChange={handleEmailChange}
						onSubmit={handleResetFormSubmit}
						onBackToSignIn={() => dispatch({ type: "toggle_reset_mode" })}
					/>
				) : (
					<EmailAuthForm
						email={email}
						password={password}
						trainerName={trainerName}
						isSignUp={isSignUp}
						isLoading={isLoading}
						onEmailChange={handleEmailChange}
						onPasswordChange={(e) =>
							dispatch({ type: "password_changed", password: e.target.value })
						}
						onTrainerNameChange={handleTrainerNameChange}
						onSubmit={handleSubmit}
						onForgotPassword={() => dispatch({ type: "toggle_reset_mode" })}
						onToggleMode={() => dispatch({ type: "toggle_mode" })}
					/>
				)}
			</div>
		</div>
	);
};
