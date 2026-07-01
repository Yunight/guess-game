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
}: EmailAuthResetFormProps): JSX.Element => {
	const { t } = useTranslation();

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				onSubmit();
			}}
			className="space-y-4"
		>
			<div>
				<label htmlFor="email" className="block text-sm font-medium mb-1 text-gray-800">
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
					onClick={onBackToSignIn}
					className="text-red-600 hover:text-red-800 text-sm font-medium hover:underline transform hover:scale-105 transition-transform duration-200"
					disabled={isLoading}
				>
					{t("backToSignIn")}
				</button>
			</div>
		</form>
	);
};
