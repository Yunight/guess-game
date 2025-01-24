import { Input } from "@/components/ui/input";
import type { FC, RefObject } from "react";
import { useCallback } from "react";
import { useTranslation } from "react-i18next";

interface GuessInputProps {
	guess: string;
	handleGuessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
	handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
	suggestions: string[];
	handleSuggestionClick: (suggestion: string) => void;
	highlightedIndex: number;
	inputRef: RefObject<HTMLInputElement>;
	suggestionsRef: RefObject<HTMLSelectElement>;
	isCorrect: boolean | null;
	guessTimeLeft: number;
}

export const GuessInput: FC<GuessInputProps> = ({
	guess,
	handleGuessChange,
	handleKeyDown,
	suggestions,
	handleSuggestionClick,
	highlightedIndex,
	inputRef,
	suggestionsRef,
	isCorrect,
	guessTimeLeft,
}) => {
	const { t } = useTranslation();

	const handleSuggestionKeyDown = useCallback(
		(e: React.KeyboardEvent<HTMLDivElement>, suggestion: string) => {
			if (e.key === "Enter" || e.key === " ") {
				e.preventDefault();
				handleSuggestionClick(suggestion);
			}
		},
		[handleSuggestionClick],
	);

	return (
		<form className="relative w-full" onSubmit={(e) => e.preventDefault()}>
			<div className={`relative ${isCorrect === false ? "animate-shake" : ""}`}>
				<Input
					ref={inputRef}
					type="text"
					value={guess}
					onChange={handleGuessChange}
					onKeyDown={handleKeyDown}
					placeholder={t("guessInputPlaceholder")}
					disabled={guessTimeLeft <= 0}
					style={{ fontSize: "1.1rem", lineHeight: "1.75rem" }}
					aria-label="Pokemon guess input"
					aria-invalid={isCorrect === false}
					aria-controls="suggestions-list"
					aria-expanded={suggestions.length > 0}
					role="combobox"
					aria-autocomplete="list"
					autoComplete="off"
					className={[
						"w-full h-14 px-6 font-medium bg-green-100/80 border-2 text-center",
						"focus:ring-2 focus:ring-white/50 placeholder:text-gray-500/50 placeholder:text-xl rounded-xl",
						isCorrect === true && "border-green-500 text-green-700",
						isCorrect === false && "border-red-500 text-red-700 animate-pulse",
						isCorrect === null && "border-transparent text-gray-700",
						guessTimeLeft <= 0 && "opacity-50 cursor-not-allowed",
					]
						.filter(Boolean)
						.join(" ")}
				/>
				{isCorrect === false && (
					<div className="absolute inset-0 rounded-xl bg-red-500/10 animate-pulse pointer-events-none" />
				)}
			</div>

			{suggestions.length > 0 && guessTimeLeft > 0 && (
				<div className="relative">
					<select
						ref={suggestionsRef}
						className="sr-only"
						id="suggestions-list"
						aria-label="Pokemon suggestions"
						size={suggestions.length}
						value={highlightedIndex !== -1 ? suggestions[highlightedIndex] : ""}
						onChange={(e) => handleSuggestionClick(e.target.value)}
					>
						{suggestions.map((suggestion, index) => (
							<option
								key={suggestion}
								id={`suggestion-${index}`}
								value={suggestion}
								aria-selected={index === highlightedIndex}
							>
								{suggestion}
							</option>
						))}
					</select>

					{/* Visual presentation */}
					<div
						className="absolute bottom-full left-0 right-0 mb-1 bg-white rounded-lg shadow-lg overflow-hidden z-50 border-2 border-gray-200"
						aria-hidden="true"
					>
						{suggestions.map((suggestion, index) => (
							<div
								key={suggestion}
								onClick={() => handleSuggestionClick(suggestion)}
								onKeyDown={(e) => handleSuggestionKeyDown(e, suggestion)}
								className={`px-4 py-2.5 cursor-pointer flex items-center gap-3 hover:bg-gray-100 text-gray-700 outline-none focus:bg-gray-100 focus:font-medium
                ${index === highlightedIndex ? "bg-gray-100 font-medium" : ""}`}
							>
								<div className="w-6 h-6 relative">
									{index === highlightedIndex ? (
										<div className="w-full h-full relative">
											<div className="absolute inset-0 rounded-full overflow-hidden border-2 border-black">
												<div className="absolute top-0 inset-x-0 h-[50%] bg-red-500" />
												<div className="absolute bottom-0 inset-x-0 h-[50%] bg-white" />
												<div className="absolute inset-y-[45%] inset-x-0 h-[10%] bg-black" />
												<div className="absolute inset-[30%] rounded-full bg-white border-2 border-black" />
											</div>
										</div>
									) : (
										<div className="w-full h-full relative">
											<div className="absolute inset-0 rounded-full bg-white border-2 border-gray-300" />
											<div className="absolute inset-y-[45%] inset-x-0 h-[10%] bg-gray-300" />
											<div className="absolute inset-[30%] rounded-full bg-gray-300 border-2 border-white" />
										</div>
									)}
								</div>
								{suggestion}
							</div>
						))}
					</div>
				</div>
			)}
		</form>
	);
};
