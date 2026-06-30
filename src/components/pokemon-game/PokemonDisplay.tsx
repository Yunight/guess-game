import { type FC, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { PokemonDisplayFrame } from "./PokemonDisplayFrame";
import {
	PokemonDisplayContent,
	PokemonDisplayLoading,
} from "./PokemonDisplayContent";
import { computePokemonDisplayTransition } from "./pokemonDisplayState";
import { clearPokemonCryCache, playPokemonCry } from "./pokemonCryPlayer";
import type { Pokemon } from "./types";

interface PokemonDisplayProps {
	currentPokemon: Pokemon | undefined;
	isPokemonLoading: boolean;
	isCorrect: boolean | null;
	isMuted: boolean;
	guessTimeLeft: number;
	remainingCount: number;
	totalCount: number;
}

export const PokemonDisplay: FC<PokemonDisplayProps> = ({
	currentPokemon,
	isPokemonLoading,
	isCorrect,
	isMuted,
	guessTimeLeft,
	remainingCount,
	totalCount,
}) => {
	const { i18n } = useTranslation();
	const [displayState, setDisplayState] = useState<
		"loading" | "ready" | "revealed"
	>("loading");
	const [displayedPokemon, setDisplayedPokemon] = useState<
		Pokemon | undefined
	>();
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const soundPlayedRef = useRef(false);
	const currentPokemonIdRef = useRef<number | null>(0);

	useEffect(() => {
		const transition = computePokemonDisplayTransition({
			currentPokemon,
			isPokemonLoading,
			isCorrect,
			guessTimeLeft,
			displayState,
			displayedPokemon,
			currentPokemonId: currentPokemonIdRef.current,
		});

		if (transition.shouldClearAudio && audioRef.current) {
			audioRef.current.pause();
			audioRef.current.currentTime = 0;
			audioRef.current.remove();
			audioRef.current = null;
		}

		if (transition.shouldResetSoundPlayed) {
			soundPlayedRef.current = false;
		}

		currentPokemonIdRef.current = transition.currentPokemonId;
		setDisplayState(transition.displayState);
		setDisplayedPokemon(transition.displayedPokemon);
	}, [
		currentPokemon,
		isPokemonLoading,
		isCorrect,
		displayState,
		displayedPokemon,
		guessTimeLeft,
	]);

	useEffect(() => {
		if (
			!displayedPokemon?.cryUrl ||
			isMuted ||
			soundPlayedRef.current ||
			displayState !== "ready" ||
			displayedPokemon.id !== currentPokemonIdRef.current
		) {
			return;
		}

		void playPokemonCry({
			pokemon: displayedPokemon,
			isMuted,
			currentPokemonIdRef,
			audioRef,
			soundPlayedRef,
		});
	}, [displayState, displayedPokemon, isMuted]);

	useEffect(() => {
		return () => {
			clearPokemonCryCache();
		};
	}, []);

	const hasSprite = displayedPokemon?.sprites.front_default;

	return (
		<div className="w-full max-w-2xl mx-auto px-4">
			<div className="flex justify-between items-center mb-2">
				<div className="w-24">
					<slot name="quit-button" />
				</div>

				<div className="bg-black/80 text-white px-4 py-1 rounded-full text-sm font-medium">
					{remainingCount}/{totalCount}
				</div>

				<div className="w-24" />
			</div>
			<PokemonDisplayFrame
				className="rounded-lg flex items-center justify-center p-2 aspect-[4/3] mb-2 shadow-inner"
				contentClassName="w-full h-full flex items-center justify-center"
			>
				{!hasSprite ? (
					<PokemonDisplayLoading />
				) : (
					<PokemonDisplayContent
						displayedPokemon={displayedPokemon}
						displayState={displayState}
						language={i18n.language}
					/>
				)}
			</PokemonDisplayFrame>
		</div>
	);
};
