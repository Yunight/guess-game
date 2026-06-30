import { useState, useCallback, useEffect } from "react";
import { auth } from "../firebase";
import type { User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { Generation } from "@/components/pokemon-game/generations";
import {
	convertToDisplayFormat,
	convertToStoredFormat,
	formatDisplayName,
	getRankingsCollectionName,
	NAME_CHECK_ERROR,
	shouldAllowAuthenticatedDisplayName,
	validateNameAcrossGenerations,
} from "./playerNameUtils";

interface UsePlayerNameProps {
	GENERATIONS: Generation[];
}

export const usePlayerName = ({ GENERATIONS }: UsePlayerNameProps) => {
	const [playerName, setPlayerName] = useState("");
	const [nameError, setNameError] = useState<string | null>(null);
	const [isCheckingName, setIsCheckingName] = useState(false);
	const [isAuthName, setIsAuthName] = useState(false);

	const checkNameAvailability = useCallback(
		async (name: string) => {
			const storedName = convertToStoredFormat(name.trim());
			if (!storedName) {
				setNameError(null);
				localStorage.removeItem("pokemonGamePlayerName");
				return false;
			}

			const currentUser = auth.currentUser;
			if (shouldAllowAuthenticatedDisplayName(currentUser?.displayName, name)) {
				setNameError(null);
				setIsCheckingName(false);
				return true;
			}

			setIsCheckingName(true);

			try {
				const generationOccupied: boolean[] = [];

				for (const gen of GENERATIONS) {
					const collectionName = getRankingsCollectionName(gen);
					const rankingsRef = collection(db, collectionName);
					const q = query(
						rankingsRef,
						auth.currentUser
							? where("uid", "==", auth.currentUser.uid)
							: where("name", "==", storedName),
					);
					const querySnapshot = await getDocs(q);
					generationOccupied.push(!querySnapshot.empty);
				}

				const validation = validateNameAcrossGenerations(
					generationOccupied,
					Boolean(auth.currentUser),
				);

				if (!validation.available) {
					setNameError(validation.errorMessage);
					localStorage.removeItem("pokemonGamePlayerName");
					setIsCheckingName(false);
					return false;
				}

				setNameError(null);
				setIsCheckingName(false);
				return true;
			} catch (error) {
				console.error("Error checking name availability:", error);
				setNameError(NAME_CHECK_ERROR);
				setIsCheckingName(false);
				return false;
			}
		},
		[GENERATIONS],
	);

	const debounce = <T extends (...args: never[]) => void>(
		func: T,
		wait: number,
	): ((...args: Parameters<T>) => void) => {
		let timeoutId: NodeJS.Timeout | undefined;

		return (...args: Parameters<T>) => {
			if (timeoutId) {
				clearTimeout(timeoutId);
			}

			timeoutId = setTimeout(() => {
				func(...args);
				timeoutId = undefined;
			}, wait);
		};
	};

	const debouncedCheckName = useCallback(
		debounce((name: string) => checkNameAvailability(name), 500),
		[checkNameAvailability],
	);

	const handlePlayerNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>) => {
			if (auth.currentUser) {
				return;
			}

			const exactName = e.target.value;
			setPlayerName(exactName);

			if (!exactName.trim()) {
				setNameError(null);
				setIsAuthName(false);
				localStorage.removeItem("pokemonGamePlayerName");
				return;
			}

			debouncedCheckName(exactName);
		},
		[debouncedCheckName],
	);

	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
			if (user?.displayName) {
				const formattedName = formatDisplayName(user.displayName, user.email);
				setPlayerName(formattedName);
				setIsAuthName(true);
				setNameError(null);
				setIsCheckingName(false);
				localStorage.setItem("pokemonGamePlayerName", formattedName);
			} else if (!user) {
				const savedName = localStorage.getItem("pokemonGamePlayerName");
				if (savedName) {
					setPlayerName(savedName);
					setIsAuthName(false);
				}
			}
		});

		return () => unsubscribe();
	}, []);

	useEffect(() => {
		const savedName = localStorage.getItem("pokemonGamePlayerName");
		if (savedName && !auth.currentUser) {
			setPlayerName(savedName);
			setNameError(null);
			setIsAuthName(false);
		}
	}, []);

	useEffect(() => {
		const savedName = localStorage.getItem("pokemonGamePlayerName");
		if (playerName) {
			if (playerName === savedName) {
				setIsAuthName(true);
			}
			if (playerName !== savedName) {
				localStorage.setItem("pokemonGamePlayerName", playerName);
			}
		} else {
			setIsAuthName(false);
		}
	}, [playerName]);

	return {
		playerName,
		nameError,
		isCheckingName,
		isAuthName,
		setPlayerName,
		handlePlayerNameChange,
		checkNameAvailability,
		convertToStoredFormat,
		convertToDisplayFormat,
		formatDisplayName,
	};
};
