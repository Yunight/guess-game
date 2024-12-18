import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp, where, updateDoc, Timestamp, DocumentData } from 'firebase/firestore';
import { db } from '../../firebase';
import '../../styles/PokemonGame.css';
import { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } from '../../services/pokemonApi';
import { skipToken } from '@reduxjs/toolkit/query';
import { GameScreen } from './GameScreen';
import { MenuScreen } from './MenuScreen';
import { GameOverDialog } from './GameOverDialog';
import { Generation, Pokemon, Rankings } from '@/components/pokemon-game/types';
import { useLocalStorage } from '@/hooks/useLocalStorage';

const GENERATIONS: Generation[] = [
  { name: '1ère Génération', startId: 1, endId: 151 },
  { name: '2ème Génération', startId: 152, endId: 251 },
  { name: '3ème Génération', startId: 252, endId: 386 },
  { name: '4ème Génération', startId: 387, endId: 493 },
  { name: '5ème Génération', startId: 494, endId: 649 },
  { name: '6ème Génération', startId: 650, endId: 721 },
  { name: '7ème Génération', startId: 722, endId: 809 },
  { name: '8ème Génération', startId: 810, endId: 905 },
  { name: '9ème Génération', startId: 906, endId: 1010 },
];
const MAX_HINTS = 10;

// Add rarity tiers for Pokémon rewards
const POKEMON_REWARDS = [
  { minScore: 151, condition: (pokemon: Pokemon) => pokemon.isMythical && pokemon.name === 'mew' }, // Mew only
  { minScore: 100, condition: (pokemon: Pokemon) => pokemon.isMythical }, // Other Mythical
  { minScore: 80, condition: (pokemon: Pokemon) => pokemon.isLegendary }, // Legendary
  { minScore: 60, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 3 && !pokemon.isLegendary && !pokemon.isMythical }, // Final evolution (like Venusaur)
  { minScore: 40, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 2 && !pokemon.isLegendary && !pokemon.isMythical }, // Middle evolution (like Ivysaur)
  { minScore: 20, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 1 && !pokemon.hasEvolution && !pokemon.isLegendary && !pokemon.isMythical }, // No evolution (like Tauros)
  { minScore: 0, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 1 && pokemon.hasEvolution && !pokemon.isLegendary && !pokemon.isMythical }, // Base form (like Bulbasaur)
];

const PokemonGame = () => {
  const [bestScore, setBestScore] = useLocalStorage<number>('bestScore', 0);
  const [bestTime, setBestTime] = useLocalStorage<number>('bestTime', 0);
  const [guess, setGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [isGameActive, setIsGameActive] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<Generation>(GENERATIONS[0]);
  const [remainingPokemon, setRemainingPokemon] = useState<number[]>([]);
  const [rankings, setRankings] = useState<Rankings[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [userRanking, setUserRanking] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const totalTimeInterval = useRef<NodeJS.Timeout | null>(null);
  const [guessTimeLeft, setGuessTimeLeft] = useState<number>(15);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState<number>(0);
  const [nameError, setNameError] = useState<string | null>(null);
  const [currentPokemonId, setCurrentPokemonId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    const savedMute = localStorage.getItem('pokemonGameMuted');
    return savedMute ? JSON.parse(savedMute) : false;
  });
  const victoryAudioRef = useRef<HTMLAudioElement | null>(null);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);
  const canStartGame = Boolean(playerName && !nameError);
  
  // Use RTK Query hooks with proper typing
  const { data: allPokemonNames = [] } = useGetAllPokemonNamesQuery();
  const { 
    data: currentPokemon,
    isLoading: isPokemonLoading 
  } = useGetPokemonByIdQuery(currentPokemonId ?? skipToken, {
    skip: !currentPokemonId || !isGameActive,
  });

  const { data: allPokemonData = [] } = useGetAllPokemonNamesQuery();

  const getRewardPokemon = useCallback((score: number) => {
    // Return loading state if data is not yet available
    if (!allPokemonData || allPokemonData.length === 0) {
      return { id: 25, name: '', isLoading: true };
    }

    try {
      // Find the appropriate tier based on score
      const tier = POKEMON_REWARDS.find(tier => score >= tier.minScore);
      if (!tier) {
        // If no tier found, return a random basic Pokémon
        const basicPokemon = allPokemonData.filter(pokemon => 
          pokemon.id >= selectedGeneration.startId && 
          pokemon.id <= selectedGeneration.endId &&
          pokemon.evolvesFromSpecies === null && 
          pokemon.hasEvolution
        );
        
        if (basicPokemon.length === 0) {
          return { 
            id: 25, // Default to Pikachu
            name: '', 
            isLoading: false 
          }; 
        }
        
        const randomBasic = basicPokemon[Math.floor(Math.random() * basicPokemon.length)];
        return {
          id: randomBasic.id,
          name: randomBasic.frenchName,
          isLoading: false
        };
      }

      // Filter Pokémon based on the tier condition and selected generation
      const eligiblePokemon = allPokemonData.filter(pokemon => 
        tier.condition(pokemon) && 
        pokemon.id >= selectedGeneration.startId && 
        pokemon.id <= selectedGeneration.endId
      );

      // If no eligible Pokémon found in the current tier, try the next lower tier
      if (eligiblePokemon.length === 0) {
        const lowerTiers = POKEMON_REWARDS.slice(POKEMON_REWARDS.indexOf(tier) + 1);
        for (const lowerTier of lowerTiers) {
          const lowerTierPokemon = allPokemonData.filter(pokemon => 
            lowerTier.condition(pokemon) && 
            pokemon.id >= selectedGeneration.startId && 
            pokemon.id <= selectedGeneration.endId
          );
          
          if (lowerTierPokemon.length > 0) {
            const randomPokemon = lowerTierPokemon[Math.floor(Math.random() * lowerTierPokemon.length)];
            return {
              id: randomPokemon.id,
              name: randomPokemon.frenchName,
              isLoading: false
            };
          }
        }
        
        // If still no Pokémon found, return a random Pokémon from the generation
        const generationPokemon = allPokemonData.filter(pokemon => 
          pokemon.id >= selectedGeneration.startId && 
          pokemon.id <= selectedGeneration.endId
        );
        
        const randomPokemon = generationPokemon[Math.floor(Math.random() * generationPokemon.length)];
        return {
          id: randomPokemon.id,
          name: randomPokemon.frenchName,
          isLoading: false
        };
      }

      // Pick a random Pokémon from the eligible ones
      const randomPokemon = eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];
      return {
        id: randomPokemon.id,
        name: randomPokemon.frenchName,
        isLoading: false
      };
    } catch (error) {
      console.error('Error getting reward pokemon:', error);
      return { id: 25, name: '', isLoading: true };
    }
  }, [allPokemonData, selectedGeneration]);

  // Capitalize first letter of a string
  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Normalize text to handle special characters
  const normalizeText = (text: string): string => {
    return text
      .toLowerCase()
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove diacritics
      .replace(/[^a-z0-9]/g, ''); // Remove special characters
  };

  // Handle click outside suggestions
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(event.target as Node)) {
        setSuggestions([]);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGuess(capitalize(value));
    setHighlightedIndex(0);
    
    if (value.length > 0) {
      const normalizedValue = normalizeText(value);
      const filteredSuggestions = allPokemonNames
        .filter(pokemon => {
          const normalizedName = normalizeText(pokemon.frenchName);
          return normalizedName.startsWith(normalizedValue) && 
                 pokemon.id >= selectedGeneration.startId && 
                 pokemon.id <= selectedGeneration.endId;
        })
        .map(pokemon => capitalize(pokemon.frenchName))
        .sort((a, b) => {
          const normalizedA = normalizeText(a);
          const normalizedB = normalizeText(b);
          const normalizedValue = normalizeText(value);
          
          if (normalizedA === normalizedValue && normalizedB !== normalizedValue) return -1;
          if (normalizedB === normalizedValue && normalizedA !== normalizedValue) return 1;
          
          return normalizedA.length - normalizedB.length;
        })
        .slice(0, 5);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  };

  // Add sound URLs as constants at the top of the component
  const CORRECT_SOUND_URL = '/sounds/pkm_level_up.mp3';
  const WRONG_SOUND_URL = '/sounds/bump_wall.mp3';
  const VICTORY_SOUND_URL = '/sounds/battle_win.mp3';

  // Add a function to clean up all audio instances
  const cleanupAllAudio = () => {
    console.log('🧹 Cleaning up all audio');
    if (victoryAudioRef.current) {
      victoryAudioRef.current.pause();
      victoryAudioRef.current = null;
    }
    if (correctAudioRef.current) {
      correctAudioRef.current.pause();
      correctAudioRef.current = null;
    }
    if (wrongAudioRef.current) {
      wrongAudioRef.current.pause();
      wrongAudioRef.current = null;
    }
  };

  const handleCorrectAnswer = async () => {
    console.log('✅ Handling correct answer');
    setIsCorrect(true);
    setScore(prev => prev + 1);
    
    if (!isMuted) {
      console.log('🎵 About to play correct answer sound');
      cleanupAllAudio();
      correctAudioRef.current = new Audio(CORRECT_SOUND_URL);
      try {
        await correctAudioRef.current.play();
        console.log('✅ Correct answer sound played successfully');
      } catch (error) {
        console.error('❌ Error playing correct sound:', error);
      }
    }
    
    setTimeout(() => {
      console.log('⏲️ Correct answer timeout - fetching new Pokemon');
      setIsCorrect(null);
      setGuess('');
      setSuggestions([]);
      setShowHint(false);
      fetchRandomPokemon();
      startGuessTimer();
      inputRef.current?.focus();
    }, 1500);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) => {
        const newIndex = prevIndex < suggestions.length - 1 ? prevIndex + 1 : 0;
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setHighlightedIndex((prevIndex) => {
        const newIndex = prevIndex > 0 ? prevIndex - 1 : suggestions.length - 1;
        return newIndex;
      });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (highlightedIndex >= 0) {
        handleSuggestionClick(suggestions[highlightedIndex]);
      }
    }
  };

  const handleSuggestionClick = async (suggestion: string) => {
    setGuess(suggestion);
    setSuggestions([]);
    
    const normalizedSuggestion = normalizeText(suggestion);
    const normalizedAnswer = normalizeText(currentPokemon?.frenchName || '');
    
    if (normalizedSuggestion === normalizedAnswer) {
      handleCorrectAnswer();
    } else {
      console.log('❌ Handling wrong answer');
      setIsCorrect(false);
      if (!isMuted) {
        console.log('🎵 About to play wrong answer sound');
        cleanupAllAudio();
        wrongAudioRef.current = new Audio(WRONG_SOUND_URL);
        try {
          await wrongAudioRef.current.play();
          console.log('✅ Wrong answer sound played successfully');
        } catch (error) {
          console.error('❌ Error playing wrong sound:', error);
        }
      }
    }
  };

  const useHint = () => {
    if (hintsLeft > 0 && currentPokemon) {
      setShowHint(true);
      setHintsLeft(prev => prev - 1);
    }
  };

  // Move fetchRandomPokemon declaration before handleGameOver
  const fetchRandomPokemon = useCallback(() => {
    console.log('🎯 Starting fetchRandomPokemon');
    if (remainingPokemon.length === 0) {
      console.log('No remaining Pokemon, ending game');
      if (isGameActive) {
        setIsGameActive(false);
        setGameOver(true);
      }
      return;
    }

    const randomIndex = Math.floor(Math.random() * remainingPokemon.length);
    const pokemonId = remainingPokemon[randomIndex];
    
    if (!pokemonId) {
      console.error('Invalid Pokemon ID generated');
      return;
    }

    console.log('🎵 Setting currentPokemonId to:', pokemonId);
    setCurrentPokemonId(pokemonId);
    setRemainingPokemon(prev => prev.filter(id => id !== pokemonId));
  }, [remainingPokemon, isGameActive]);

  const fetchSelectedRankings = useCallback(async () => {
    try {
      const rankingsRef = collection(db, `rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`);
      const q = query(rankingsRef, orderBy('score', 'desc'), limit(20)); // Fetch top 20 players
      const querySnapshot = await getDocs(q);
      const rankingsData: Rankings[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        data.timestamp = (data.timestamp as Timestamp)?.toDate() || new Date(data.timestamp);
        rankingsData.push(data as Rankings);
      });
      setRankings(rankingsData);

      // Find user's best record and update best time
      const userBestRecord = rankingsData.find(record => record.name === playerName);
      if (userBestRecord) {
        setBestTime(userBestRecord.time);
      }
    } catch (error) {
      console.error('Error fetching rankings:', error);
    }
  }, [selectedGeneration, playerName, setBestTime]);

  const handleGameOver = useCallback(async () => {
    if (gameOver) return;
    
    console.log('🏁 Starting game over sequence');
    // Stop timers first
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (totalTimeInterval.current) {
      clearInterval(totalTimeInterval.current);
      totalTimeInterval.current = null;
    }

    // Update states first
    setIsGameActive(false);
    setGameOver(true);
    
    // Small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Then handle audio
    if (!isMuted) {
      console.log('🎵 About to play victory sound');
      cleanupAllAudio();
      victoryAudioRef.current = new Audio(VICTORY_SOUND_URL);
      try {
        await victoryAudioRef.current.play();
        console.log('✅ Victory sound played successfully');
      } catch (error) {
        console.error('❌ Error playing victory sound:', error);
      }
    }
    
    if (score > bestScore) {
      setBestScore(score);
    }
    
    if (score > 0 && playerName) {
      try {
        const collectionName = `rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`;
        const rankingsRef = collection(db, collectionName);
        const q = query(rankingsRef, where('name', '==', playerName));
        const querySnapshot = await getDocs(q);
        
        const playerData = {
          name: playerName,
          score: score,
          time: totalTimeElapsed,
          timestamp: serverTimestamp()
        };

        if (!querySnapshot.empty) {
          const existingDoc = querySnapshot.docs[0];
          const existingScore = existingDoc.data().score;
          const existingTime = existingDoc.data().time;
          
          if (score > existingScore || (score === existingScore && totalTimeElapsed < existingTime)) {
            await updateDoc(existingDoc.ref, playerData);
            if (totalTimeElapsed < existingTime) {
              setBestTime(totalTimeElapsed);
            }
          }
        } else {
          await addDoc(rankingsRef, playerData);
          setBestTime(totalTimeElapsed);
        }
        
        await fetchSelectedRankings();
        
        // Get updated ranking position
        const rankingsQuery = query(rankingsRef, orderBy('score', 'desc'));
        const allRankings = await getDocs(rankingsQuery);
        const userRankingPosition = allRankings.docs.findIndex(doc => doc.data().name === playerName) + 1;
        setUserRanking(userRankingPosition);
        
      } catch (error) {
        console.error('Error saving score:', error);
      }
    }
  }, [score, playerName, selectedGeneration, totalTimeElapsed, gameOver, fetchSelectedRankings, bestScore, setBestScore, setBestTime, isMuted]);

  // Update the effect to use both functions
  useEffect(() => {
    if (isGameActive && (guessTimeLeft <= 0 || remainingPokemon.length === 0)) {
      handleGameOver();
    }
  }, [guessTimeLeft, remainingPokemon.length, handleGameOver, isGameActive]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Update the checkNameAvailability function
  const checkNameAvailability = async (name: string) => {
    if (!name.trim()) {
      setNameError(null);
      localStorage.removeItem('pokemonGamePlayerName');
      return false;
    }

    // If it's the user's saved name, allow it
    const savedName = localStorage.getItem('pokemonGamePlayerName');
    if (savedName === name) {
      setNameError(null);
      return true;
    }

    try {
      // Check across all generations
      for (const gen of GENERATIONS) {
        const collectionName = `rankings_gen${gen.startId}_${gen.endId}`;
        const rankingsRef = collection(db, collectionName);
        const q = query(rankingsRef, where('name', '==', name));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setNameError('Ce nom est déjà utilisé. Veuillez en choisir un autre.');
          localStorage.removeItem('pokemonGamePlayerName');
          return false;
        }
      }
      
      // Only set error to null, don't store in localStorage yet
      setNameError(null);
      return true;
    } catch (error) {
      console.error('Error checking name availability:', error);
      setNameError('Erreur lors de la vérification du nom');
      return false;
    }
  };

  // Simplify handlePlayerNameChange since storage is handled in checkNameAvailability
  const handlePlayerNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName);
    
    if (!newName.trim()) {
      setNameError(null);
      localStorage.removeItem('pokemonGamePlayerName');
      return;
    }
    
    await checkNameAvailability(newName);
  };

  // Add isRestarting state
  const [isRestarting, setIsRestarting] = useState(false);

  // Update the startGame function
  const startGame = async () => {
    console.log('🎮 Starting new game');
    if (!playerName) return;
    
    const isAvailable = await checkNameAvailability(playerName);
    if (!isAvailable) return;
    
    setIsRestarting(true);
    
    // Clean up all audio
    cleanupAllAudio();
    
    console.log('🔄 Resetting current Pokemon');
    setCurrentPokemonId(null);
    
    // If it's a new user (different from saved name), clean up localStorage
    const savedName = localStorage.getItem('pokemonGamePlayerName');
    if (savedName !== playerName) {
      localStorage.clear();
      localStorage.setItem('pokemonGamePlayerName', playerName);
    }
    
    // Stop any existing timers
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (totalTimeInterval.current) {
      clearInterval(totalTimeInterval.current);
      totalTimeInterval.current = null;
    }
    
    // Reset all game states
    setScore(0);
    setHintsLeft(10);
    setShowHint(false);
    setIsCorrect(null);
    setGuess('');
    setSuggestions([]);
    setGuessTimeLeft(15);
    setTotalTimeElapsed(0);
    setGameOver(false);
    setUserRanking(null);
    setHighlightedIndex(-1);
    
    // Initialize Pokémon list for selected generation
    const filteredIds = Array.from(
      { length: selectedGeneration.endId - selectedGeneration.startId + 1 },
      (_, i) => selectedGeneration.startId + i
    );
    setRemainingPokemon(filteredIds);
    
    // Add a small delay to ensure state is reset before fetching new Pokemon
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Set game active and clear restarting state
    setIsGameActive(true);
    setIsRestarting(false);
    
    // Start both timers and fetch new Pokemon
    startGuessTimer();
    startTotalTimer();
    fetchRandomPokemon();
    inputRef.current?.focus();
  };

  useEffect(() => {
    const initializeGame = () => {
      setRemainingPokemon(
        Array.from(
          { length: selectedGeneration.endId - selectedGeneration.startId + 1 },
          (_, i) => selectedGeneration.startId + i
        )
      );
    };
    initializeGame();
  }, [selectedGeneration]);

  // Add this effect to fetch rankings only when the generation selector changes
  useEffect(() => {
    if (!isGameActive) {
      fetchSelectedRankings();
    }
  }, [selectedGeneration, isGameActive, fetchSelectedRankings]);

  const formatDate = (timestamp: Date): string => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    return `${day}/${month}/${date.getFullYear()}`;
  };

  const startGuessTimer = () => {
    setGuessTimeLeft(15); // Reset to 15 seconds for new guess
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    
    timerInterval.current = setInterval(() => {
      setGuessTimeLeft(prev => {
        if (prev <= 0) {
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startTotalTimer = () => {
    if (totalTimeInterval.current) {
      clearInterval(totalTimeInterval.current);
    }
    
    setTotalTimeElapsed(0);
    totalTimeInterval.current = setInterval(() => {
      setTotalTimeElapsed(prev => prev + 1);
    }, 1000);
  };

  useEffect(() => {
    return () => {
      if (timerInterval.current) clearInterval(timerInterval.current);
      if (totalTimeInterval.current) clearInterval(totalTimeInterval.current);
    };
  }, []);

  // Add this useEffect to handle auto-focus when pokemon changes
  useEffect(() => {
    if (isGameActive && inputRef.current) {
      inputRef.current.focus();
    }
  }, [currentPokemon, isGameActive]);

  // Add this helper function near your other utility functions
  const formatTimeForRanking = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Add this effect to handle mute state persistence
  useEffect(() => {
    localStorage.setItem('pokemonGameMuted', JSON.stringify(isMuted));
  }, [isMuted]);

  // Update the initial useEffect for loading the username
  useEffect(() => {
    const savedName = localStorage.getItem('pokemonGamePlayerName');
    if (savedName) {
      setPlayerName(savedName);
      setNameError(null); // Clear any errors since this is a valid saved name
    }
  }, []); // Empty dependency array means this runs once on mount

  const handleGenerationSelect = (generation: Generation) => {
    setSelectedGeneration(generation);
    // Reset game state
    setScore(0);
    setGuess('');
    setSuggestions([]);
    setIsCorrect(null);
    setShowHint(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 p-4 flex items-start sm:items-center justify-center font-oswald">
      {isGameActive ? (
        <GameScreen
          currentPokemon={isRestarting ? undefined : currentPokemon}
          isPokemonLoading={isRestarting || isPokemonLoading}
          isCorrect={isCorrect}
          score={score}
          bestScore={bestScore}
          bestTime={bestTime}
          guessTimeLeft={guessTimeLeft}
          hintsLeft={hintsLeft}
          guess={guess}
          handleGuessChange={handleGuessChange}
          handleKeyDown={handleKeyDown}
          suggestions={suggestions}
          handleSuggestionClick={handleSuggestionClick}
          highlightedIndex={highlightedIndex}
          showHint={showHint}
          useHint={useHint}
          inputRef={inputRef}
          suggestionsRef={suggestionsRef}
          formatTime={formatTime}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          totalTimeElapsed={totalTimeElapsed}
        />
      ) : (
        <MenuScreen
          playerName={playerName}
          handlePlayerNameChange={handlePlayerNameChange}
          nameError={nameError}
          selectedGeneration={selectedGeneration}
          handleGenerationSelect={handleGenerationSelect}
          GENERATIONS={GENERATIONS}
          canStartGame={canStartGame}
          startGame={startGame}
          score={score}
          bestScore={bestScore}
          isMuted={isMuted}
          setIsMuted={setIsMuted}
          rankings={rankings}
          formatTimeForRanking={formatTimeForRanking}
          formatDate={formatDate}
        />
      )}

      <GameOverDialog
        gameOver={gameOver}
        setGameOver={(open) => {
          setGameOver(open);
          if (!open) {
            console.log('Closing GameOverDialog, cleaning up victory sound');
            if (victoryAudioRef.current) {
              victoryAudioRef.current.pause();
              victoryAudioRef.current = null;
            }
          }
        }}
        playerName={playerName}
        score={score}
        bestScore={bestScore}
        bestTime={bestTime}
        userRanking={userRanking}
        totalTimeElapsed={totalTimeElapsed}
        formatTimeForRanking={formatTimeForRanking}
        rewardPokemon={getRewardPokemon(score)}
        totalPokemonCount={selectedGeneration.endId - selectedGeneration.startId + 1}
        handleRestart={() => {
          console.log('Restarting game, cleaning up victory sound');
          if (victoryAudioRef.current) {
            victoryAudioRef.current.pause();
            victoryAudioRef.current = null;
          }
          setGameOver(false);
          setIsGameActive(false);
          setScore(0);
          startGame();
        }}
        handleBackToMenu={() => {
          console.log('Going back to menu, cleaning up victory sound');
          if (victoryAudioRef.current) {
            victoryAudioRef.current.pause();
            victoryAudioRef.current = null;
          }
          setGameOver(false);
          setIsGameActive(false);
          setScore(0);
          setCurrentPokemonId(null);
        }}
      />
    </div>
  );
};

export default PokemonGame;
