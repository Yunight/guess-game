import { Input } from "@/components/ui/input";
import { useTranslation } from "react-i18next";
import { auth } from "../../firebase";
import { AuthButtons } from "./AuthButtons";

export interface MenuPlayerFormProps {
	playerName: string;
	nameError: string | null;
	onPlayerNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	checkNameAvailability: (name: string) => Promise<boolean>;
}

export const MenuPlayerForm = ({
	playerName,
	nameError,
	onPlayerNameChange,
	checkNameAvailability,
}: MenuPlayerFormProps): JSX.Element => {
	const { t } = useTranslation();
	const isAuthenticated = Boolean(auth.currentUser);

	return (
		<>
			<div className="space-y-2">
				<div className="flex items-center gap-4">
					{!isAuthenticated && (
						<div className="flex items-center gap-2">
							<div className="w-6 h-6 bg-blue-500 rounded-full border-4 border-white shadow-md" />
							<h2 className="text-lg font-semibold text-gray-800">{t("connexion")}</h2>
						</div>
					)}
					<AuthButtons
						isAuthenticated={isAuthenticated}
						userName={auth.currentUser?.displayName || null}
						checkNameAvailability={checkNameAvailability}
					/>
				</div>
			</div>

			<div className="space-y-2">
				<label htmlFor="playerName" className="text-sm font-medium text-gray-700">
					{t("trainerName")}
				</label>
				<Input
					id="playerName"
					type="text"
					placeholder={t("enterName")}
					className={`w-full h-10 px-4 text-lg transition-colors
                    ${nameError ? "border-red-500 focus:ring-red-500" : "border-gray-300"}
                    ${isAuthenticated ? "bg-gray-100 border-transparent cursor-not-allowed opacity-75 hover:bg-gray-100 focus:bg-gray-100 select-none" : ""}
                  `}
					value={playerName}
					onChange={onPlayerNameChange}
					readOnly={isAuthenticated}
					disabled={isAuthenticated}
				/>
				{nameError && !isAuthenticated && <p className="text-red-500 text-sm">{nameError}</p>}
			</div>
		</>
	);
};
