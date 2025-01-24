import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
	createUserWithEmailAndPassword,
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
	const [error, setError] = useState<string | null>(null);
	const [isLoading, setIsLoading] = useState(false);

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

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setIsLoading(true);

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
				setError(error.message);
			}
		} finally {
			setIsLoading(false);
		}
	};

	const toggleMode = () => {
		setIsSignUp(!isSignUp);
		setError(null);
		setTrainerName("");
	};

	if (!isOpen) return null;

	return (
		<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
			<div className="bg-white rounded-xl p-6 w-full max-w-md relative">
				<button
					type="button"
					onClick={onClose}
					className="absolute -top-2 -right-2 bg-black text-white rounded-full p-1 hover:bg-gray-800 transition-colors"
					aria-label="Close"
				>
					<X className="h-5 w-5" />
				</button>

				<h2 className="text-2xl font-bold mb-6">
					{isSignUp ? t("signUp") : t("signIn")}
				</h2>

				<form onSubmit={handleSubmit} className="space-y-4">
					{isSignUp && (
						<div>
							<label
								htmlFor="trainerName"
								className="block text-sm font-medium text-gray-700 mb-1"
							>
								{t("trainerName")}
							</label>
							<Input
								id="trainerName"
								type="text"
								value={trainerName}
								onChange={handleTrainerNameChange}
								required
								className="w-full"
								placeholder={t("enterName")}
								disabled={isLoading}
							/>
						</div>
					)}

					<div>
						<label
							htmlFor="email"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							{t("email")}
						</label>
						<Input
							id="email"
							type="email"
							value={email}
							onChange={handleEmailChange}
							required
							className="w-full"
							disabled={isLoading}
						/>
					</div>

					<div>
						<label
							htmlFor="password"
							className="block text-sm font-medium text-gray-700 mb-1"
						>
							{t("password")}
						</label>
						<Input
							id="password"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							required
							className="w-full"
							disabled={isLoading}
						/>
					</div>

					{error && <p className="text-red-500 text-sm">{error}</p>}

					<div className="flex flex-col gap-2">
						<Button
							type="submit"
							className="w-full bg-black hover:bg-gray-800 text-white"
							disabled={isLoading || (isSignUp && error !== null)}
						>
							{isSignUp ? t("signUp") : t("signIn")}
						</Button>
						<Button
							type="button"
							variant="outline"
							onClick={toggleMode}
							className="w-full text-black hover:text-black hover:bg-gray-100"
							disabled={isLoading}
						>
							{isSignUp ? t("alreadyHaveAccount") : t("needAccount")}
						</Button>
					</div>
				</form>
			</div>
		</div>
	);
};
