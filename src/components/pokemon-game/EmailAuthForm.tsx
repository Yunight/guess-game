import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface EmailAuthFormProps {
	email: string;
	password: string;
	trainerName: string;
	isSignUp: boolean;
	isLoading: boolean;
	onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onPasswordChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onTrainerNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSubmit: (e: React.FormEvent) => void;
	onForgotPassword: () => void;
	onToggleMode: () => void;
}

export const EmailAuthForm = ({
	email,
	password,
	trainerName,
	isSignUp,
	isLoading,
	onEmailChange,
	onPasswordChange,
	onTrainerNameChange,
	onSubmit,
	onForgotPassword,
	onToggleMode,
}: EmailAuthFormProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<form onSubmit={onSubmit} className="space-y-4">
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
					onChange={onEmailChange}
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
						onChange={onTrainerNameChange}
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
					onChange={onPasswordChange}
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
						onClick={onForgotPassword}
						className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline transform hover:scale-105 transition-transform duration-200"
						disabled={isLoading}
					>
						{t("forgotPassword")}
					</button>
				)}
				<div>
					<button
						type="button"
						onClick={onToggleMode}
						className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline transform hover:scale-105 transition-transform duration-200"
						disabled={isLoading}
					>
						{isSignUp ? t("alreadyHaveAccount") : t("needAccount")}
					</button>
				</div>
			</div>
		</form>
	);
};
