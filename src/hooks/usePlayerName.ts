import { useState, useCallback, useEffect, useRef } from "react";
import { auth } from "../firebase";
import type { User } from "firebase/auth";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../firebase";
import type { Generation } from "@/components/pokemon-game/generations";
import {
	convertToDisplayFormat,
	convertToStoredFormat,
	formatDisplayName,
	NAME_CHECK_ERROR,
	performNameAvailabilityCheck,
	resolveAuthStatePlayerName,
	applyNameAvailabilityCheckResult,
} from "./playerNameUtils";

interface UsePlayerNameProps {
	GENERATIONS: Generation[];
}

const firestoreDeps = {
	query,
	where,
	getDocs,
	getCollection: (collectionName: string) => collection(db, collectionName),
};

export const usePlayerName = ({ GENERATIONS }: UsePlayerNameProps) => {
	const [playerName, setPlayerName] = useState("");
	const [nameError, setNameError] = useState<string | null>(null);
	const [isCheckingName, setIsCheckingName] = useState(false);
	const [isAuthName, setIsAuthName] = useState(false);
	const debounceTimeoutRef = useRef<NodeJS.Timeout | undefined>(undefined);
	const persistedNameRef = useRef<string | null>(null);

	const syncPlayerNameFromAuth = useCallback((user: User | null): void => {
		const savedName = localStorage.getItem("pokemonGamePlayerName");
		const authState = resolveAuthStatePlayerName(user, savedName);

		if (authState.playerName) {
			setPlayerName(authState.playerName);
			setIsAuthName(authState.isAuthName);
			setNameError(null);
			setIsCheckingName(false);
			if (authState.shouldPersist) {
				localStorage.setItem("pokemonGamePlayerName", authState.playerName);
				persistedNameRef.current = authState.playerName;
			} else {
				persistedNameRef.current = savedName;
			}
			return;
		}

		setIsAuthName(false);
	}, []);

	const checkNameAvailability = useCallback(
		async (name: string): Promise<boolean> => {
			setIsCheckingName(true);

			try {
				const result = await performNameAvailabilityCheck(
					name,
					GENERATIONS,
					auth.currentUser?.displayName,
					Boolean(auth.currentUser),
					auth.currentUser?.uid,
					firestoreDeps,
				);

				return applyNameAvailabilityCheckResult(result, {
					setNameError,
					setIsCheckingName,
				});
			} catch (error) {
				console.error("Error checking name availability:", error);
				setNameError(NAME_CHECK_ERROR);
				setIsCheckingName(false);
				return false;
			}
		},
		[GENERATIONS],
	);

	const debouncedCheckName = useCallback(
		(name: string): void => {
			if (debounceTimeoutRef.current) {
				clearTimeout(debounceTimeoutRef.current);
			}
			debounceTimeoutRef.current = setTimeout(() => {
				void checkNameAvailability(name);
				debounceTimeoutRef.current = undefined;
			}, 500);
		},
		[checkNameAvailability],
	);

	const handlePlayerNameChange = useCallback(
		(e: React.ChangeEvent<HTMLInputElement>): void => {
			if (auth.currentUser) {
				return;
			}

			const exactName = e.target.value;
			setPlayerName(exactName);

			if (!exactName.trim()) {
				setNameError(null);
				setIsAuthName(false);
				persistedNameRef.current = null;
				localStorage.removeItem("pokemonGamePlayerName");
				return;
			}

			if (exactName === persistedNameRef.current) {
				setIsAuthName(true);
			} else {
				setIsAuthName(false);
				localStorage.setItem("pokemonGamePlayerName", exactName);
				persistedNameRef.current = exactName;
			}

			debouncedCheckName(exactName);
		},
		[debouncedCheckName],
	);

	useEffect(() => {
		syncPlayerNameFromAuth(auth.currentUser);
		const unsubscribe = auth.onAuthStateChanged(syncPlayerNameFromAuth);
		return () => unsubscribe();
	}, [syncPlayerNameFromAuth]);

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
