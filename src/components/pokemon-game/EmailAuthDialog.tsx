import {
	createUserWithEmailAndPassword,
	sendPasswordResetEmail,
	signInWithEmailAndPassword,
	updateProfile,
} from "firebase/auth";
import { X } from "lucide-react";
import type { FC } from "react";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { auth } from "../../firebase";
import { EmailAuthForm } from "./EmailAuthForm";
import { EmailAuthResetForm } from "./EmailAuthResetForm";
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
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");
	const [trainerName, setTrainerName] = useState("");
	const [isSignUp, setIsSignUp] = useState(false);
	const [isResetMode, setIsResetMode] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
		setEmail(e.target.value);
		if (shouldClearEmailError(error)) {
			setError(null);
		}
	};

	const handleTrainerNameChange = async (e: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
		const newName = e.target.value;
		setTrainerName(newName);

		if (!newName.trim()) {
			setError(null);
			return;
		}

		const isAvailable = await checkNameAvailability(newName);
		if (!isAvailable) {
			setError(t("trainerNameTaken"));
		} else {
			setError(null);
		}
	};

	const handleForgotPassword = async (): Promise<void> => {
		const validation = validateForgotPassword({ email });
		if (validation.action === "abort") {
			setError(t(validation.reason));
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccessMessage(null);

		try {
			await sendPasswordResetEmail(auth, email);
			setSuccessMessage(t("passwordResetEmailSent"));
		} catch (caughtError: unknown) {
			if (caughtError instanceof Error) {
				const errorCode = extractFirebaseErrorCode(caughtError.message);
				setError(t(`firebaseErrors.${errorCode}`));
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent): Promise<void> => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setSuccessMessage(null);

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
			setError(result.errorKey);
		} else {
			onClose();
		}

		setIsLoading(false);
	};

	const toggleMode = (): void => {
		setIsSignUp(!isSignUp);
		setError(null);
		setSuccessMessage(null);
		setIsResetMode(false);
	};

	const handleResetModeToggle = (): void => {
		setIsResetMode(!isResetMode);
		setError(null);
		setSuccessMessage(null);
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
						onSubmit={handleForgotPassword}
						onBackToSignIn={handleResetModeToggle}
					/>
				) : (
					<EmailAuthForm
						email={email}
						password={password}
						trainerName={trainerName}
						isSignUp={isSignUp}
						isLoading={isLoading}
						onEmailChange={handleEmailChange}
						onPasswordChange={(e) => setPassword(e.target.value)}
						onTrainerNameChange={handleTrainerNameChange}
						onSubmit={handleSubmit}
						onForgotPassword={handleResetModeToggle}
						onToggleMode={toggleMode}
					/>
				)}
			</div>
		</div>
	);
};
