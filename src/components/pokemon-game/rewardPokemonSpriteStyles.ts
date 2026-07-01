import type { Pokemon } from "./types";

export const getRewardSpriteStyle = (
	isSlotMachineRunning: boolean,
	isRevealed: boolean,
): React.CSSProperties => {
	return {
		transform: isSlotMachineRunning ? "translateY(-100%)" : "none",
		animation: isSlotMachineRunning ? "slideUp 0.03s linear infinite" : undefined,
		opacity: !isSlotMachineRunning && !isRevealed ? 0 : 1,
		transition: !isSlotMachineRunning ? "opacity 0.1s ease-in-out" : "none",
		scale: "1.3",
	};
};

export const getRewardSpriteContainerClassName = (isSlotMachineRunning: boolean): string => {
	return `
		relative flex items-center justify-center
		${isSlotMachineRunning ? "animate-slide-up" : "animate-bounce-in"}
		transition-transform duration-300 ease-in-out
	`;
};

export const getRewardLocalizedName = (pokemon: Pokemon, language: string): string => {
	return language === "fr" ? pokemon.frenchName : pokemon.englishName;
};
