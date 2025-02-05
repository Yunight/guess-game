import { useState, useCallback, useEffect } from "react";
import { auth } from "../firebase";
import type { User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { Generation } from "@/components/pokemon-game/types";

interface UsePlayerNameProps {
	GENERATIONS: Generation[];
}

export const usePlayerName = ({ GENERATIONS }: UsePlayerNameProps) => {
	const [playerName, setPlayerName] = useState("");
	const [nameError, setNameError] = useState<string | null>(null);
	const [isCheckingName, setIsCheckingName] = useState(false);
	const [isAuthName, setIsAuthName] = useState(false);

	const convertToStoredFormat = useCallback((name: string) => {
		const specialChars: { [key: string]: string } = {
			é: "e",
			è: "e",
			ê: "e",
			ë: "e",
			à: "a",
			â: "a",
			ä: "a",
			î: "i",
			ï: "i",
			ô: "o",
			ö: "o",
			ù: "u",
			û: "u",
			ü: "u",
			ÿ: "y",
			ñ: "n",
			ç: "c",
		};

		return name
			.trim()
			.toLowerCase()
			.replace(/[éèêëàâäîïôöùûüÿñç]/g, (char) => specialChars[char] || char)
			.replace(/\s+/g, "_");
	}, []);

	const convertToDisplayFormat = useCallback((name: string) => {
		return name.replace(/_/g, " ");
	}, []);

	const formatDisplayName = useCallback(
		(
			name: string | null | undefined,
			email: string | null | undefined,
		): string => {
			if (!name) return "";

			// Check if it's a Gmail user
			const isGmailUser = email?.includes("@gmail.com");

			if (isGmailUser && name.includes(" ")) {
				// Split the full name into parts
				const nameParts = name.split(" ");
				const firstName = nameParts[0];
				const lastNameInitial =
					nameParts[nameParts.length - 1][0].toUpperCase();
				return `${firstName} .${lastNameInitial}`;
			}

			return name;
		},
		[],
	);

	const checkNameAvailability = useCallback(
		async (name: string) => {
			const storedName = convertToStoredFormat(name.trim());
			if (!storedName) {
				setNameError(null);
				localStorage.removeItem("pokemonGamePlayerName");
				return false;
			}

			// If user is authenticated, allow it immediately
			const currentUser = auth.currentUser;
			if (currentUser?.displayName === name) {
				setNameError(null);
				setIsCheckingName(false);
				return true;
			}

			// Only set isCheckingName to true for new names
			setIsCheckingName(true);

			try {
				// Check across all generations using uid if authenticated, otherwise use name
				for (const gen of GENERATIONS) {
					const collectionName = `rankings_gen${gen.startId}_${gen.endId}`;
					const rankingsRef = collection(db, collectionName);
					const q = query(
						rankingsRef,
						auth.currentUser
							? where("uid", "==", auth.currentUser.uid)
							: where("name", "==", storedName),
					);
					const querySnapshot = await getDocs(q);

					if (!querySnapshot.empty && !auth.currentUser) {
						setNameError(
							"Ce nom est déjà utilisé. Veuillez en choisir un autre.",
						);
						localStorage.removeItem("pokemonGamePlayerName");
						setIsCheckingName(false);
						return false;
					}
				}

				setNameError(null);
				setIsCheckingName(false);
				return true;
			} catch (error) {
				console.error("Error checking name availability:", error);
				setNameError("Erreur lors de la vérification du nom");
				setIsCheckingName(false);
				return false;
			}
		},
		[GENERATIONS, convertToStoredFormat],
	);

	// Debounce function
	const debounce = <T extends (...args: any[]) => any>(
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
			// If user is authenticated, don't allow changes
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

	// Effect to handle auth state changes
	useEffect(() => {
		const unsubscribe = auth.onAuthStateChanged((user: User | null) => {
			if (user?.displayName) {
				// User is logged in with a display name
				const formattedName = formatDisplayName(user.displayName, user.email);
				setPlayerName(formattedName);
				setIsAuthName(true);
				setNameError(null);
				setIsCheckingName(false);
				localStorage.setItem("pokemonGamePlayerName", formattedName);
			} else if (!user) {
				// User logged out - restore saved name from localStorage if it exists
				const savedName = localStorage.getItem("pokemonGamePlayerName");
				if (savedName) {
					setPlayerName(savedName);
					setIsAuthName(false);
				}
			}
		});

		return () => unsubscribe();
	}, [formatDisplayName]);

	// Initial load of saved name
	useEffect(() => {
		const savedName = localStorage.getItem("pokemonGamePlayerName");
		if (savedName && !auth.currentUser) {
			setPlayerName(savedName);
			setNameError(null);
			setIsAuthName(false);
		}
	}, []);

	// Effect to handle name persistence
	useEffect(() => {
		const savedName = localStorage.getItem("pokemonGamePlayerName");
		if (playerName) {
			// Only set isAuthName if it matches the saved name
			if (playerName === savedName) {
				setIsAuthName(true);
			}
			// If it's a new name, save it
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
