import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/PokemonGame.css';
import { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } from '../services/pokemonApi';
import { skipToken } from '@reduxjs/toolkit/query';

interface Pokemon {
  id: number;
  name: string;
  frenchName: string;
  imageUrl: string;
  flavorText?: string;
  cryUrl?: string;
}

interface Player {
  name: string;
  score: number;
  time: number;
  timestamp: any;
}

interface Generation {
  name: string;
  startId: number;
  endId: number;
}

const GAME_TIME = 120; // 2 minutes in seconds
const GENERATIONS: Generation[] = [
  { name: "1ère Génération", startId: 1, endId: 151 },
  { name: "2ème Génération", startId: 152, endId: 251 },
  { name: "3ème Génération", startId: 252, endId: 386 },
  { name: "4ème Génération", startId: 387, endId: 493 },
  { name: "5ème Génération", startId: 494, endId: 649 },
  { name: "6ème Génération", startId: 650, endId: 721 },
  { name: "7ème Génération", startId: 722, endId: 809 },
  { name: "8ème Génération", startId: 810, endId: 905 },
  { name: "9ème Génération", startId: 906, endId: 1010 },
];
const MAX_HINTS = 10;

const PokemonGame = () => {
  const [guess, setGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [isGameActive, setIsGameActive] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<Generation>(GENERATIONS[0]);
  const [remainingPokemon, setRemainingPokemon] = useState<number[]>([]);
  const [rankings, setRankings] = useState<Player[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [userRanking, setUserRanking] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
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
  
  // Use RTK Query hooks with proper typing
  const { data: allPokemonNames = [] } = useGetAllPokemonNamesQuery();
  const { 
    data: currentPokemon,
    isLoading: isPokemonLoading 
  } = useGetPokemonByIdQuery(currentPokemonId ?? skipToken, {
    skip: !currentPokemonId || !isGameActive,
  });

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
        setShowSuggestions(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGuess(capitalize(value));
    
    if (value.length > 0) {
      const normalizedValue = normalizeText(value);
      const filteredSuggestions = allPokemonNames
        .filter(name => {
          const normalizedName = normalizeText(name);
          const pokemonId = allPokemonNames.indexOf(name) + 1;
          const generation = GENERATIONS.find(gen =>
            pokemonId >= gen.startId && pokemonId <= gen.endId
          );
          return normalizedName.startsWith(normalizedValue) && generation;
        })
        .map(name => capitalize(name))
        .sort((a, b) => {
          // First, prioritize exact matches
          const normalizedA = normalizeText(a);
          const normalizedB = normalizeText(b);
          const normalizedValue = normalizeText(value);
          
          if (normalizedA === normalizedValue && normalizedB !== normalizedValue) return -1;
          if (normalizedB === normalizedValue && normalizedA !== normalizedValue) return 1;
          
          // Then sort by length (shorter names first)
          return normalizedA.length - normalizedB.length;
        })
        .slice(0, 5);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const correctSoundUrl = 'https://www.myinstants.com/media/sounds/pokemon-red_blue_yellow-item-found-sound-effect.mp3'; // Replace with actual sound URL

  // Add this new function to handle correct answers
  const handleCorrectAnswer = () => {
    setIsCorrect(true);
    setScore(prev => prev + 1);
    
    if (!isMuted) {
      const audio = new Audio(correctSoundUrl);
      audio.play();
    }
    
    setTimeout(() => {
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
    if (e.key === 'ArrowDown') {
      setHighlightedIndex((prevIndex) => {
        const newIndex = Math.min(prevIndex + 1, suggestions.length - 1);
        return newIndex;
      });
    } else if (e.key === 'ArrowUp') {
      setHighlightedIndex((prevIndex) => {
        const newIndex = Math.max(prevIndex - 1, 0);
        return newIndex;
      });
    } else if (e.key === 'Enter') {
      if (suggestions.length > 0) {
        // Always use the first suggestion when pressing Enter
        handleSuggestionClick(suggestions[0]);
      }
    }
  };

  // Update handleSuggestionClick to use handleCorrectAnswer
  const handleSuggestionClick = (suggestion: string) => {
    setGuess(suggestion);
    setSuggestions([]);
    
    const normalizedSuggestion = normalizeText(suggestion);
    const normalizedAnswer = normalizeText(currentPokemon?.frenchName || '');
    
    if (normalizedSuggestion === normalizedAnswer) {
      handleCorrectAnswer();
    } else {
      setIsCorrect(false);
    }
  };

  const useHint = () => {
    if (hintsLeft > 0 && currentPokemon) {
      setShowHint(true);
      setHintsLeft(prev => prev - 1);
    }
  };

  // Remove these states as they'll be handled by RTK Query

  const [timeLeft, setTimeLeft] = useState<number | null>(null);

  // Move fetchRandomPokemon declaration before handleGameOver
  const fetchRandomPokemon = useCallback(() => {
    if (remainingPokemon.length === 0 && isGameActive) {
      setIsGameActive(false);
      setGameOver(true);
      return;
    }

    const randomIndex = Math.floor(Math.random() * remainingPokemon.length);
    const pokemonId = remainingPokemon[randomIndex];
    
    setCurrentPokemonId(pokemonId);
    setRemainingPokemon(prev => prev.filter(id => id !== pokemonId));
  }, [remainingPokemon, isGameActive]);

  // Update the useEffect to handle pokemon state updates
  useEffect(() => {
    if (currentPokemon && !isPokemonLoading && !isMuted) {
      if (currentPokemon.cryUrl) {
        const audio = new Audio(currentPokemon.cryUrl);
        audioRef.current = audio;
        audio.play().catch(console.error);
      }
    }
  }, [currentPokemon, isPokemonLoading, isMuted]);

  const fetchSelectedRankings = useCallback(async () => {
    try {
      const rankingsRef = collection(db, `rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`);
      const q = query(rankingsRef, orderBy('score', 'desc'), limit(20)); // Fetch top 20 players
      const querySnapshot = await getDocs(q);
      const rankingsData: Player[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as Player;
        data.timestamp = data.timestamp?.toDate(); // Convert Firestore timestamp to JavaScript Date
        rankingsData.push(data);
      });
      setRankings(rankingsData);
      console.log('Fetched Rankings:', rankingsData);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    }
  }, [selectedGeneration]);

  const handleGameOver = useCallback(async () => {
    // Prevent multiple executions
    if (gameOver) return;
    
    setIsGameActive(false);
    setGameOver(true);
    
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    if (totalTimeInterval.current) {
      clearInterval(totalTimeInterval.current);
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
          
          if (score > existingScore) {
            await updateDoc(existingDoc.ref, playerData);
          }
        } else {
          await addDoc(rankingsRef, playerData);
        }
        
        // Add delay before fetching rankings
        await new Promise(resolve => setTimeout(resolve, 500));
        await fetchSelectedRankings();
        
        const userRanking = rankings.findIndex(player => player.name === playerName) + 1;
        setUserRanking(userRanking);
        
      } catch (error) {
        console.error('Error saving score:', error);
      }
    }
  }, [score, playerName, selectedGeneration, totalTimeElapsed, gameOver, rankings, fetchSelectedRankings]);

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

  const startGame = () => {
    if (!playerName) return;
    
    // Reset all game states
    setScore(0);
    setHintsLeft(10);
    setIsGameActive(true);
    setShowHint(false);
    setIsCorrect(null);
    setGuess('');
    setSuggestions([]);
    setGuessTimeLeft(15);
    setTotalTimeElapsed(0);
    setGameOver(false); // Make sure gameOver is set to false when starting
    
    // Start both timers
    startGuessTimer();
    startTotalTimer();
    
    // Initialize Pokémon list for selected generation
    const filteredIds = Array.from(
      { length: selectedGeneration.endId - selectedGeneration.startId + 1 },
      (_, i) => selectedGeneration.startId + i
    );
    setRemainingPokemon(filteredIds);
    
    // Fetch first Pokémon
    fetchRandomPokemon();
    
    // Focus input after a short delay to ensure DOM is ready
    setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
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
  }, [selectedGeneration, isGameActive,fetchSelectedRankings]);

  const formatDate = (timestamp: Date): string => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
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

  // Add this useEffect to load username from localStorage on mount
  useEffect(() => {
    const savedName = localStorage.getItem('pokemonGamePlayerName');
    if (savedName) {
      setPlayerName(savedName);
    }
  }, []);

  // Update the name validation and setting logic
  const checkNameAvailability = async (name: string) => {
    if (!name.trim()) {
      setNameError(null);
      return false;
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
          return false;
        }
      }
      
      setNameError(null);
      return true;
    } catch (error) {
      console.error('Error checking name availability:', error);
      setNameError('Erreur lors de la vérification du nom');
      return false;
    }
  };

  const handlePlayerNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName);
    
    // If there's a saved name in localStorage and it matches the new name, accept it
    const savedName = localStorage.getItem('pokemonGamePlayerName');
    if (savedName === newName) {
      setNameError(null);
      return;
    }
    
    // Otherwise, check if the name is available
    const isAvailable = await checkNameAvailability(newName);
    if (isAvailable) {
      localStorage.setItem('pokemonGamePlayerName', newName);
    }
  };

  // Update the start game button to be disabled if there's a name error
  const canStartGame = playerName && !nameError;

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

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-b from-blue-100 to-blue-200 p-4">
      <button
        onClick={() => setIsMuted(prev => !prev)}
        className="absolute top-4 right-4 p-3 rounded-full bg-blue-500 shadow-xl hover:bg-blue-600 transition-colors"
        aria-label={isMuted ? 'Unmute' : 'Mute'}
      >
        {isMuted ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" />
          </svg>
        )}
      </button>
      {isGameActive ? (
        <div className="flex-1 flex flex-col w-full max-w-md">
          <div className={`bg-white shadow-lg rounded-lg p-4 sm:p-8 w-full transition-all duration-300 ${
            suggestions.length > 0 ? 'sm:transform-none transform -translate-y-20' : ''
          }`}>
            <h2 className="text-2xl sm:text-3xl font-semibold text-gray-700 mb-4">Écran de Jeu</h2>
            <div className="flex flex-col space-y-2 text-sm sm:text-lg text-gray-600 mb-4">
              <div>Score: <span className="font-bold text-blue-600">{score}</span></div>
              <div>Temps: <span className="font-bold text-blue-600">{guessTimeLeft}s</span></div>
              <div>Total: <span className="font-bold text-blue-600">{formatTime(totalTimeElapsed)}</span></div>
              <div>Indices: <span className="font-bold text-blue-600">{hintsLeft}</span></div>
            </div>
            <div className="pokemon-container">
              {currentPokemon && (
                <>
                  {isPokemonLoading ? (
                    <div className="pokemon-placeholder text-6xl sm:text-8xl">?</div>
                  ) : (
                    <img
                      src={currentPokemon.imageUrl}
                      alt="Pokémon mystère"
                      className="w-48 h-48 sm:w-64 sm:h-64 object-contain mx-auto"
                      style={{ 
                        filter: isCorrect ? 'none' : 'brightness(0) saturate(100%)'
                      }}
                    />
                  )}
                </>
              )}
              <div className="mt-4 space-y-2">
                <div className="relative" ref={suggestionsRef}>
                  <input
                    type="text"
                    value={guess}
                    onChange={handleGuessChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Qui est ce Pokémon?"
                    className="w-full p-2 border rounded-lg text-lg text-gray-800 placeholder-gray-500 bg-white"
                    ref={inputRef}
                    disabled={isCorrect === true}
                  />
                  {suggestions.length > 0 && !isCorrect && (
                    <ul className="absolute z-10 w-full bg-white border rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto">
                      {suggestions.map((suggestion, index) => (
                        <li
                          key={index}
                          onClick={() => handleSuggestionClick(suggestion)}
                          className={`p-2 hover:bg-gray-100 cursor-pointer text-gray-800 ${
                            index === highlightedIndex ? 'bg-gray-100' : ''
                          }`}
                        >
                          {suggestion}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {!isCorrect && (
                  <button 
                    onClick={useHint}
                    disabled={hintsLeft === 0 || showHint}
                    className="w-full p-2 bg-blue-500 text-white rounded-lg disabled:opacity-50"
                  >
                    Indice ({hintsLeft})
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="w-full max-w-md p-4">
          <h1 className="text-3xl sm:text-5xl font-bold text-center text-gray-800 mb-6">
            Qui est ce Pokémon?
          </h1>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Entrez votre nom"
              className={`w-full p-3 border rounded-lg text-gray-800 bg-white placeholder-gray-500 ${
                nameError ? 'border-red-500' : 'border-gray-300'
              }`}
              value={playerName}
              onChange={handlePlayerNameChange}
            />
            {nameError && (
              <p className="text-red-500 text-sm">{nameError}</p>
            )}
            <select
              className="w-full p-3 border rounded-lg"
              value={JSON.stringify(selectedGeneration)}
              onChange={(e) => {
                const selectedGen = JSON.parse(e.target.value);
                setSelectedGeneration(selectedGen);
              }}
            >
              {GENERATIONS.map((gen, index) => (
                <option key={index} value={JSON.stringify(gen)}>
                  {gen.name} (#{gen.startId}-{gen.endId})
                </option>
              ))}
            </select>
            <button
              onClick={startGame}
              disabled={!canStartGame}
              className={`w-full p-3 bg-blue-500 text-white rounded-lg ${
                !canStartGame ? 'opacity-50 cursor-not-allowed' : ''
              }`}
            >
              {score > 0 ? 'Rejouer!' : 'Commencer!'}
            </button>
          </div>
          
          <div className="mt-8">
            <h2 className="text-2xl font-bold mb-4 text-center text-blue-600 shadow-text">
              Meilleurs Scores - {selectedGeneration.name}
            </h2>
            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-blue-600 text-white p-3 grid grid-cols-12 gap-2 text-sm sm:text-base">
                <div className="col-span-1 font-bold">#</div>
                <div className="col-span-4 font-bold">Dresseur</div>
                <div className="col-span-2 font-bold text-center">Score</div>
                <div className="col-span-3 font-bold text-center">Temps</div>
                <div className="col-span-2 font-bold text-center hidden sm:block">Date</div>
              </div>
              
              {/* Rankings list */}
              <div className="divide-y divide-gray-200">
                {rankings.map((player, index) => (
                  <div 
                    key={index}
                    className={`grid grid-cols-12 gap-2 p-3 items-center hover:bg-blue-50 transition-colors
                      ${player.name === playerName ? 'bg-yellow-50' : ''}
                      ${index < 3 ? 'font-semibold' : ''}`}
                  >
                    <div className="col-span-1 text-gray-800">
                      {index < 3 ? (
                        <span className={`
                          inline-block w-6 h-6 rounded-full text-center leading-6 text-white
                          ${index === 0 ? 'bg-yellow-400' : ''}
                          ${index === 1 ? 'bg-gray-400' : ''}
                          ${index === 2 ? 'bg-orange-600' : ''}
                        `}>
                          {index + 1}
                        </span>
                      ) : (
                        <span className="text-gray-600">#{index + 1}</span>
                      )}
                    </div>
                    <div className="col-span-4 truncate text-gray-800">
                      {player.name === playerName ? (
                        <span className="text-blue-600 font-semibold">★ {player.name}</span>
                      ) : (
                        player.name
                      )}
                    </div>
                    <div className="col-span-2 text-center font-mono text-gray-800 font-semibold">
                      {player.score}
                    </div>
                    <div className="col-span-3 text-center font-mono text-gray-700">
                      {formatTimeForRanking(player.time)}
                    </div>
                    <div className="col-span-2 text-center text-sm text-gray-500 hidden sm:block">
                      {formatDate(player.timestamp)}
                    </div>
                  </div>
                ))}
                
                {rankings.length === 0 && (
                  <div className="p-4 text-center text-gray-500">
                    Aucun score enregistré pour cette génération
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
      
      {gameOver && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-sm w-full">
            <h2 className="text-2xl font-bold mb-4 text-gray-800">Partie terminée!</h2>
            <div className="space-y-2 mb-6 text-gray-700">
              <p><span className="font-semibold">Nom:</span> {playerName}</p>
              <p><span className="font-semibold">Score final:</span> {score}</p>
              <p><span className="font-semibold">Classement:</span> {userRanking !== null ? `#${userRanking}` : 'Non classé'}</p>
              <p><span className="font-semibold">Temps total:</span> {formatTimeForRanking(totalTimeElapsed)}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => {
                  setGameOver(false);
                  setIsGameActive(false);
                  setScore(0);
                  setTimeLeft(GAME_TIME);
                  startGame();
                }}
                className="p-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
              >
                Rejouer
              </button>
              <button 
                onClick={() => {
                  setGameOver(false);
                  setIsGameActive(false);
                  setScore(0);
                  setTimeLeft(GAME_TIME);
                  setCurrentPokemonId(null);
                }}
                className="p-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
              >
                Menu Principal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonGame;
