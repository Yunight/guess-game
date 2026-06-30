import {
	getCachedCryUrl,
	playCryAudio,
	resolveCryAudioUrl,
	shouldSkipCryPlayback,
} from "./gameOverCryCache";

export const executeRewardCryPlayback = async (
	pokemonId: number,
	lastPlayedId: number | null,
	isMuted: boolean,
): Promise<number | null> => {
	if (shouldSkipCryPlayback(pokemonId, lastPlayedId, isMuted)) {
		if (pokemonId === lastPlayedId) {
			console.log(
				"⏭️ Skip playing cry - same Pokémon as last time:",
				lastPlayedId,
			);
		} else {
			console.log(
				"🔇 Audio is muted, setting last played ID without playing",
			);
		}
		return pokemonId;
	}

	try {
		const cries = await getCachedCryUrl(pokemonId);
		const audioUrl = resolveCryAudioUrl(cries);

		console.log("🔊 Playing cry URL:", audioUrl);
		const playedSuccessfully = await playCryAudio(audioUrl);

		if (playedSuccessfully) {
			console.log("✅ Reward Pokemon cry played successfully");
			return pokemonId;
		}

		console.log("❌ Not setting lastPlayedId due to error");
		return null;
	} catch (err) {
		if (err instanceof Error) {
			console.error("❌ Error playing reward Pokemon cry:", {
				name: err.name,
				message: err.message,
				stack: err.stack,
				type: Object.prototype.toString.call(err),
			});
		} else {
			console.error("❌ Error playing reward Pokemon cry:", err);
		}
		console.log("❌ Not setting lastPlayedId due to error");
		return null;
	}
};

export const REWARD_CRY_PLAYBACK_DELAY_MS = 500;

export interface RewardCryScheduleInput {
	gameOver: boolean;
	isMuted: boolean;
	isSlotMachineRunning: boolean;
	rewardPokemon: { pokemon?: { id: number }; isLoading: boolean };
}

export const shouldScheduleRewardCry = (
	input: RewardCryScheduleInput,
): boolean => {
	if (input.isSlotMachineRunning) {
		return false;
	}

	return (
		input.gameOver &&
		!input.isMuted &&
		Boolean(input.rewardPokemon.pokemon) &&
		!input.rewardPokemon.isLoading
	);
};

export const getRewardCryPokemonId = (
	pokemon: { id: number } | undefined,
): number | null => {
	if (!pokemon) {
		return null;
	}
	return pokemon.id;
};
