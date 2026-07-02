import type { KeyboardEvent, ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";

interface EmailAuthResetFormProps {
	email: string;
	isLoading: boolean;
	onEmailChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	onSubmit: () => void;
	onBackToSignIn: () => void;
}

export const EmailAuthResetForm = ({
	email,
	isLoading,
	onEmailChange,
	onSubmit,
	onBackToSignIn,
}: EmailAuthResetFormProps): ReactNode => {
	const { t } = useTranslation();

	const handleEmailKeyDown = (event: KeyboardEvent<HTMLInputElement>): void => {
		if (event.key === "Enter" && !isLoading) {
			onSubmit();
		}
	};

	return (
		<div className="space-y-4">
			<div>
				<label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-800">
					{t("email")}
				</label>
				<Input
					id="email"
					type="email"
					value={email}
					onChange={onEmailChange}
					onKeyDown={handleEmailKeyDown}
					required
					className="w-full border-2 border-red-200 focus:border-red-500 rounded-lg"
					placeholder={t("emailPlaceholder")}
				/>
			</div>
			<Button
				type="button"
				onClick={onSubmit}
				className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg shadow-md transform hover:scale-105 transition-transform duration-200"
				disabled={isLoading}
			>
				{isLoading ? t("loading") : t("sendResetLink")}
			</Button>
			<div className="text-center">
				<button
					type="button"
					onClick={onBackToSignIn}
					className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline transform hover:scale-105 transition-transform duration-200"
					disabled={isLoading}
				>
					{t("backToSignIn")}
				</button>
			</div>
		</div>
	);
};
