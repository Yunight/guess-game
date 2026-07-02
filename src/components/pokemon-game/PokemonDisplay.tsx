import { type FC, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import { PokemonDisplayFrame } from "./PokemonDisplayFrame";
import { PokemonDisplayContent, PokemonDisplayLoading } from "./PokemonDisplayContent";
import { clearPokemonCryCache, playPokemonCry } from "./pokemonCryPlayer";
import { usePokemonDisplayTransition } from "@/hooks/usePokemonDisplayTransition";
import type { Pokemon } from "./types";

interface PokemonDisplayProps {
	currentPokemon: Pokemon | undefined;
	loadingState: "loading" | "ready";
	answerState: "unknown" | "correct" | "incorrect";
	audioState: "muted" | "unmuted";
	guessTimeLeft: number;
	remainingCount: number;
	totalCount: number;
	progressCounterState?: "visible" | "hidden";
}

export const PokemonDisplay: FC<PokemonDisplayProps> = ({
	currentPokemon,
	loadingState,
	answerState,
	audioState,
	guessTimeLeft,
	remainingCount,
	totalCount,
	progressCounterState = "visible",
}) => {
	const { i18n } = useTranslation();
	const audioRef = useRef<HTMLAudioElement | null>(null);
	const soundPlayedRef = useRef(false);
	const currentPokemonIdRef = useRef<number | null>(0);
	const isPokemonLoading = loadingState === "loading";
	const isCorrect = answerState === "unknown" ? null : answerState === "correct";
	const isMuted = audioState === "muted";
	const showProgressCounter = progressCounterState === "visible";

	const { displayState, displayedPokemon } = usePokemonDisplayTransition({
		currentPokemon,
		isPokemonLoading,
		isCorrect,
		guessTimeLeft,
		audioRef,
		soundPlayedRef,
	});

	currentPokemonIdRef.current = displayedPokemon?.id ?? currentPokemon?.id ?? null;

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
			{showProgressCounter && (
				<div className="flex justify-between items-center mb-2">
					<div className="w-24">
						<slot name="quit-button" />
					</div>

					<div className="bg-black/80 text-white px-4 py-1 rounded-full text-sm font-medium">
						{remainingCount}/{totalCount}
					</div>

					<div className="w-24" />
				</div>
			)}
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
