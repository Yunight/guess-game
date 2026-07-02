import {
	executeRewardCryPlayback,
	getRewardCryPokemonId,
	REWARD_CRY_PLAYBACK_DELAY_MS,
	shouldScheduleRewardCry,
} from "@/components/pokemon-game/gameOverCryPlayback";
import type { GameOverDialogProps } from "@/components/pokemon-game/GameOverDialog";
import { useCallback, useEffect, useState } from "react";

export type GameOverCryEffectParams = Pick<
	GameOverDialogProps,
	"gameOver" | "rewardPokemon" | "isSlotMachineRunning" | "isMuted"
>;

const runRewardCryTimeout = (
	pokemonId: number,
	playPokemonCry: (id: number) => Promise<void>,
): NodeJS.Timeout =>
	setTimeout(() => {
		void playPokemonCry(pokemonId);
	}, REWARD_CRY_PLAYBACK_DELAY_MS);

export const useGameOverCryEffect = (params: GameOverCryEffectParams): void => {
	const { gameOver, rewardPokemon, isSlotMachineRunning, isMuted } = params;
	const [lastPlayedId, setLastPlayedId] = useState<number | null>(null);

	const playPokemonCry = useCallback(
		async (pokemonId: number): Promise<void> => {
			const effectiveLastPlayedId = isSlotMachineRunning ? null : lastPlayedId;
			const newLastPlayedId = await executeRewardCryPlayback(
				pokemonId,
				effectiveLastPlayedId,
				isMuted,
			);
			if (newLastPlayedId !== null) {
				setLastPlayedId(newLastPlayedId);
			}
		},
		[lastPlayedId, isMuted, isSlotMachineRunning],
	);

	useEffect(() => {
		if (
			!shouldScheduleRewardCry({
				gameOver,
				isMuted,
				isSlotMachineRunning,
				rewardPokemon,
			})
		) {
			return;
		}

		const pokemonId = getRewardCryPokemonId(rewardPokemon.pokemon);
		if (pokemonId === null) {
			return;
		}

		const timeoutId = runRewardCryTimeout(pokemonId, playPokemonCry);
		return () => clearTimeout(timeoutId);
	}, [
		gameOver,
		isMuted,
		rewardPokemon,
		isSlotMachineRunning,
		playPokemonCry,
	]);
};
