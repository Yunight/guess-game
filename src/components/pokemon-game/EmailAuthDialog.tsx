import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setEmail(e.target.value);
		// Clear error when email is changed
		if (error?.includes("email")) {
			setError(null);
		}
	};

	const handleTrainerNameChange = async (
		e: React.ChangeEvent<HTMLInputElement>,
	) => {
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

	const handleForgotPassword = async () => {
		if (!email.trim()) {
			setError(t("emailRequired"));
			return;
		}

		setIsLoading(true);
		setError(null);
		setSuccessMessage(null);

		try {
			await sendPasswordResetEmail(auth, email);
			setSuccessMessage(t("passwordResetEmailSent"));
			// Don't exit reset mode on success to keep showing the success message
		} catch (error: unknown) {
			if (error instanceof Error) {
				const errorCode =
					error.message.match(/\(([^)]+)\)/)?.[1] || "auth/default";
				setError(t(`firebaseErrors.${errorCode}`));
			}
		} finally {
			setIsLoading(false);
		}
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);
		setError(null);
		setSuccessMessage(null);

		try {
			if (isSignUp) {
				if (!trainerName.trim()) {
					setError(t("trainerNameRequired"));
					setIsLoading(false);
					return;
				}

				if (error) {
					setIsLoading(false);
					return;
				}

				const userCredential = await createUserWithEmailAndPassword(
					auth,
					email,
					password,
				);

				// Update profile with trainer name
				await updateProfile(userCredential.user, {
					displayName: trainerName,
				});

				// Store trainer name in localStorage
				localStorage.setItem("pokemonGamePlayerName", trainerName);

				// Force a refresh to ensure all auth states are updated
				window.location.reload();
			} else {
				const userCredential = await signInWithEmailAndPassword(
					auth,
					email,
					password,
				);
				if (userCredential.user.displayName) {
					localStorage.setItem(
						"pokemonGamePlayerName",
						userCredential.user.displayName,
					);
				}
				// Force a refresh to ensure all auth states are updated
				window.location.reload();
			}
			onClose();
		} catch (error: unknown) {
			if (error instanceof Error) {
				// Extract the error code from the Firebase error message
				const errorCode =
					error.message.match(/\(([^)]+)\)/)?.[1] || "auth/default";
				setError(t(`firebaseErrors.${errorCode}`));
			}
		} finally {
			setIsLoading(false);
		}
	};

	const toggleMode = () => {
		setIsSignUp(!isSignUp);
		setError(null);
		setSuccessMessage(null);
		setIsResetMode(false);
	};

	const handleResetModeToggle = () => {
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
						{isResetMode
							? t("forgotPassword")
							: isSignUp
								? t("signUp")
								: t("signIn")}
					</h2>
					<p className="text-sm text-gray-700 mt-1">
						{isResetMode
							? t("enterEmailForReset")
							: isSignUp
								? t("startYourJourney")
								: t("welcomeBack")}
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
					<form
						onSubmit={(e) => {
							e.preventDefault();
							handleForgotPassword();
						}}
						className="space-y-4"
					>
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium mb-1 text-gray-800"
							>
								{t("email")}
							</label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={handleEmailChange}
								required
								className="w-full border-2 border-red-200 focus:border-red-500 rounded-lg"
								placeholder={t("emailPlaceholder")}
							/>
						</div>
						<Button
							type="submit"
							className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-200"
							disabled={isLoading}
						>
							{isLoading ? t("loading") : t("sendResetLink")}
						</Button>
						<div className="text-center">
							<button
								type="button"
								onClick={handleResetModeToggle}
								className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline transform hover:scale-105 transition-transform duration-200"
								disabled={isLoading}
							>
								{t("backToSignIn")}
							</button>
						</div>
					</form>
				) : (
					<form onSubmit={handleSubmit} className="space-y-4">
						<div>
							<label
								htmlFor="email"
								className="block text-sm font-medium mb-1 text-gray-800"
							>
								{t("email")}
							</label>
							<Input
								id="email"
								type="email"
								value={email}
								onChange={handleEmailChange}
								required
								className="w-full border-2 border-red-200 focus:border-red-500 rounded-lg"
								placeholder={t("emailPlaceholder")}
							/>
						</div>

						{isSignUp && (
							<div>
								<label
									htmlFor="trainerName"
									className="block text-sm font-medium mb-1 text-gray-800"
								>
									{t("trainerName")}
								</label>
								<Input
									id="trainerName"
									type="text"
									value={trainerName}
									onChange={handleTrainerNameChange}
									required
									className="w-full border-2 border-red-200 focus:border-red-500 rounded-lg"
									placeholder={t("trainerNamePlaceholder")}
								/>
							</div>
						)}

						<div>
							<label
								htmlFor="password"
								className="block text-sm font-medium mb-1 text-gray-800"
							>
								{t("password")}
							</label>
							<Input
								id="password"
								type="password"
								value={password}
								onChange={(e) => setPassword(e.target.value)}
								required
								className="w-full border-2 border-red-200 focus:border-red-500 rounded-lg"
								placeholder={t("passwordPlaceholder")}
							/>
						</div>

						<Button
							type="submit"
							className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-200"
							disabled={isLoading}
						>
							{isLoading ? t("loading") : isSignUp ? t("signUp") : t("signIn")}
						</Button>

						<div className="mt-4 text-center space-y-2">
							{!isSignUp && (
								<button
									type="button"
									onClick={handleResetModeToggle}
									className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline transform hover:scale-105 transition-transform duration-200"
									disabled={isLoading}
								>
									{t("forgotPassword")}
								</button>
							)}
							<div>
								<button
									type="button"
									onClick={toggleMode}
									className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline transform hover:scale-105 transition-transform duration-200"
									disabled={isLoading}
								>
									{isSignUp ? t("alreadyHaveAccount") : t("needAccount")}
								</button>
							</div>
						</div>
					</form>
				)}
			</div>
		</div>
	);
};
