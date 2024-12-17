'use client'

import { useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp, where, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/PokemonGame.css';
import { useGetAllPokemonNamesQuery, useGetPokemonByIdQuery } from '../services/pokemonApi';
import { skipToken } from '@reduxjs/toolkit/query';
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Clock, Lightbulb, Volume2, VolumeX } from 'lucide-react'

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Trophy, RefreshCcw, Home } from 'lucide-react'

interface Player {
  name: string;
  score: number;
  time: number;
  timestamp: Date;
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
  const [showSuggestions, setShowSuggestions] = useState(false);
  const canStartGame = Boolean(playerName && !nameError);
  
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
      // Get the French flavor text from the currentPokemon
      const frenchFlavorText = currentPokemon.flavorText;
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

  // Update the startGame function to store the name when the game actually starts
  const startGame = async () => {
    if (!playerName) return;
    
    // Verify name availability before starting
    const isAvailable = await checkNameAvailability(playerName);
    if (!isAvailable) return;
    
    // Store the name in localStorage only when starting the game
    localStorage.setItem('pokemonGamePlayerName', playerName);
    
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
    // No need to fetch pokemon here as it will be handled by game start
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 p-4 flex items-start sm:items-center justify-center font-oswald">
      {isGameActive ? (
        <Card className="w-full max-w-md p-1 sm:p-4 relative flex flex-col min-h-0 sm:min-h-0 bg-red-500 rounded-3xl">
          {/* Top dots */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-700"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>

          {/* Blue circle light */}
          <div className="absolute top-2 left-12 w-10 h-10 rounded-full bg-blue-400 border-4 border-white"></div>

          {/* Main screen container with white border */}
          <div className="mt-12 mx-2 bg-white rounded-lg p-2">
            {/* Pokemon Image Screen */}
            <div className="bg-white rounded-lg flex items-center justify-center p-2 
              aspect-[4/3] mb-2">
              {currentPokemon && (
                <>
                  {isPokemonLoading ? (
                    <div className="pokeball-loading scale-75">
                      <div className="outer-circle" />
                      <div className="center-circle" />
                    </div>
                  ) : (
                    <img
                      src={currentPokemon.imageUrl}
                      alt="Pokémon mystère"
                      className="w-auto h-[250px] object-contain transition-all duration-300"
                      style={{ 
                        filter: isCorrect ? 'none' : 'brightness(0) saturate(100%) contrast(200%) brightness(50%)'
                      }}
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        if (!target.src.includes('sprites.pokemon.com')) {
                          target.src = `https://sprites.pokemon.com/artwork/detail/${currentPokemon.id.toString().padStart(3, '0')}.png`;
                        }
                      }}
                    />
                  )}
                </>
              )}
            </div>

            {/* Red dots under screen */}
            <div className="flex justify-center gap-2 mb-2">
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
              <div className="w-2 h-2 rounded-full bg-red-500"></div>
            </div>
          </div>

          {/* Game Stats Bar */}
          <div className="bg-gray-800 text-white rounded-lg mx-2 mb-4 p-1">
            <div className="grid grid-cols-3 gap-1 text-center">
              <div className="space-y-0">
                <p className="text-[10px] text-gray-300">Score</p>
                <p className="text-base font-bold">{score}</p>
              </div>
              <div className="space-y-0">
                <p className="text-[10px] text-gray-300">Temps</p>
                <p className="text-base font-bold flex items-center justify-center">
                  <Clock className="w-3 h-3 mr-0.5" />
                  {formatTime(guessTimeLeft)}
                </p>
              </div>
              <div className="space-y-0">
                <p className="text-[10px] text-gray-300">Indices</p>
                <p className="text-base font-bold flex items-center justify-center">
                  <Lightbulb className="w-3 h-3 mr-0.5" />
                  {hintsLeft}
                </p>
              </div>
            </div>
          </div>

          {/* D-Pad and green screen area */}
          <div className="flex items-center gap-4 mx-2 mb-2">
            {/* D-Pad */}
            <div className="w-12 h-12 bg-gray-800 rounded-full relative shadow-inner">
              {/* Vertical line */}
              <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-4 bg-gray-800">
                {/* Up button */}
                <div className="absolute top-0 left-0 right-0 h-4 bg-gray-800 rounded-sm 
                  shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),inset_-1px_-1px_1px_rgba(0,0,0,0.3)]
                  hover:brightness-110 active:brightness-90 transition-all"></div>
                {/* Down button */}
                <div className="absolute bottom-0 left-0 right-0 h-4 bg-gray-800 rounded-sm
                  shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),inset_-1px_-1px_1px_rgba(0,0,0,0.3)]
                  hover:brightness-110 active:brightness-90 transition-all"></div>
              </div>
              {/* Horizontal line */}
              <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-4 bg-gray-800">
                {/* Left button */}
                <div className="absolute left-0 top-0 bottom-0 w-4 bg-gray-800 rounded-sm
                  shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),inset_-1px_-1px_1px_rgba(0,0,0,0.3)]
                  hover:brightness-110 active:brightness-90 transition-all"></div>
                {/* Right button */}
                <div className="absolute right-0 top-0 bottom-0 w-4 bg-gray-800 rounded-sm
                  shadow-[inset_1px_1px_1px_rgba(255,255,255,0.1),inset_-1px_-1px_1px_rgba(0,0,0,0.3)]
                  hover:brightness-110 active:brightness-90 transition-all"></div>
              </div>
              {/* Center circle */}
              <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 
                bg-gray-700 rounded-full
                shadow-[inset_1px_1px_1px_rgba(0,0,0,0.3)]"></div>
            </div>
            
            {/* Pokéball types display */}
            <div className="flex-grow flex justify-around items-center">
              {/* Regular Pokéball */}
              <div className="w-8 h-8 relative ring-2 ring-white rounded-full">
                <div className="absolute inset-0 bg-red-500 rounded-full overflow-hidden">
                  <div className="absolute bottom-1/2 inset-x-0 h-[1px] bg-black"></div>
                </div>
                <div className="absolute top-1/2 inset-x-0 bottom-0 bg-white rounded-b-full border-t border-black"></div>
                <div className="absolute inset-[30%] bg-white rounded-full border-2 border-black"></div>
              </div>

              {/* Great Ball */}
              <div className="w-8 h-8 relative ring-2 ring-white rounded-full">
                <div className="absolute inset-0 bg-blue-500 rounded-full overflow-hidden">
                  <div className="absolute bottom-1/2 inset-x-0 h-[1px] bg-black"></div>
                </div>
                <div className="absolute top-1/2 inset-x-0 bottom-0 bg-white rounded-b-full border-t border-black"></div>
                <div className="absolute inset-[30%] bg-white rounded-full border-2 border-black">
                  <div className="absolute inset-1 bg-blue-500 rounded-full"></div>
                </div>
              </div>

              {/* Ultra Ball */}
              <div className="w-8 h-8 relative ring-2 ring-white rounded-full">
                <div className="absolute inset-0 bg-black rounded-full overflow-hidden">
                  <div className="absolute top-0 inset-x-0 h-1/2 bg-yellow-400"></div>
                  <div className="absolute bottom-1/2 inset-x-0 h-[1px] bg-black"></div>
                </div>
                <div className="absolute top-1/2 inset-x-0 bottom-0 bg-white rounded-b-full border-t border-black"></div>
                <div className="absolute inset-[30%] bg-white rounded-full border-2 border-black">
                  <div className="absolute inset-1 bg-gray-800 rounded-full"></div>
                </div>
              </div>

              {/* Master Ball */}
              <div className="w-8 h-8 relative ring-2 ring-white rounded-full">
                <div className="absolute inset-0 bg-purple-600 rounded-full overflow-hidden">
                  <div className="absolute top-[15%] inset-x-[15%] h-[20%] bg-pink-400 rounded-full"></div>
                  <div className="absolute bottom-1/2 inset-x-0 h-[1px] bg-black"></div>
                </div>
                <div className="absolute top-1/2 inset-x-0 bottom-0 bg-white rounded-b-full border-t border-black"></div>
                <div className="absolute inset-[30%] bg-white rounded-full border-2 border-black">
                  <div className="absolute inset-1 bg-purple-500 rounded-full"></div>
                </div>
              </div>
            </div>
          </div>

          {/* Input and Suggestions */}
          <div className="mx-2 mt-2">
            <div className="relative">
              {/* Input field with Pokédex styling */}
              <div className="relative">
                <Input
                  type="text"
                  value={guess}
                  onChange={handleGuessChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Qui est ce Pokémon?"
                  className="w-full text-center text-base h-12
                    bg-gray-100 border-2 border-gray-300 rounded-xl
                    placeholder:text-gray-500 placeholder:opacity-70
                    focus:border-blue-500 focus:ring-2 focus:ring-blue-500/50
                    transition-all duration-300 font-oswald
                    disabled:bg-gray-100 disabled:border-gray-300
                    shadow-inner"
                  style={{
                    lineHeight: '48px',
                    paddingTop: '0px',
                    paddingBottom: '0px'
                  }}
                  ref={inputRef}
                  disabled={isCorrect === true}
                />
                {/* Decorative dots */}
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-500"></div>
                  <div className="w-2 h-2 rounded-full bg-yellow-500"></div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
              </div>

              {/* Suggestions Popup with matching style */}
              {suggestions.length > 0 && !isCorrect && (
                <div 
                  ref={suggestionsRef}
                  className="absolute bottom-full left-0 right-0 mb-1 
                    bg-gray-100 rounded-xl shadow-lg border-2 border-gray-300
                    max-h-[30vh] overflow-y-auto z-50"
                >
                  {suggestions.map((suggestion, index) => (
                    <div
                      key={suggestion}
                      className={`px-4 py-2 cursor-pointer flex items-center gap-3
                        ${index === highlightedIndex ? 'bg-blue-50' : 'hover:bg-gray-50'}
                        ${index !== suggestions.length - 1 ? 'border-b border-gray-200' : ''}`}
                      onClick={() => handleSuggestionClick(suggestion)}
                    >
                      <div className="w-5 h-5 relative flex-shrink-0">
                        <div className="absolute inset-0 bg-red-500 rounded-full overflow-hidden">
                          <div className="absolute bottom-1/2 inset-x-0 h-[1px] bg-black"></div>
                        </div>
                        <div className="absolute top-1/2 inset-x-0 bottom-0 bg-white rounded-b-full border-t border-black"></div>
                        <div className="absolute inset-[30%] bg-white rounded-full border-2 border-black"></div>
                      </div>
                      <span className="flex-grow text-left">{suggestion}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Hint Button with matching style */}
            <div className="mt-2">
              <Button 
                variant="default"
                className="w-full bg-blue-500 hover:bg-blue-600 text-white py-2
                  rounded-xl shadow-lg transform hover:scale-[1.02] 
                  transition-all duration-300 font-medium font-oswald h-12
                  disabled:bg-gray-300 disabled:hover:scale-100
                  relative overflow-hidden"
                onClick={useHint}
                disabled={hintsLeft === 0 || showHint || isPokemonLoading}
              >
                <div className="absolute left-3 top-1/2 -translate-y-1/2 flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse delay-75"></div>
                </div>
                Indice ({hintsLeft})
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse"></div>
                  <div className="w-1.5 h-1.5 rounded-full bg-yellow-300 animate-pulse delay-75"></div>
                </div>
              </Button>
              
              {showHint && currentPokemon?.flavorText && (
                <div className="mt-2 p-3 bg-gray-100 border-2 border-gray-300
                  rounded-xl text-gray-700 text-sm animate-fade-in
                  shadow-inner font-oswald relative">
                  <div className="absolute left-2 top-2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  <div className="absolute right-2 top-2 w-1.5 h-1.5 rounded-full bg-red-500"></div>
                  {currentPokemon.flavorText}
                </div>
              )}
            </div>
          </div>
        </Card>
      ) : (
        <div className="w-full max-w-md p-4">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl sm:text-5xl font-bold text-center text-gray-800">
              Qui est ce Pokémon?
            </h1>
            <Button
              variant="outline"
              size="icon"
              onClick={() => setIsMuted(!isMuted)}
              className="ml-2 bg-white/80 hover:bg-white/90 border-gray-200"
            >
              {isMuted ? (
                <VolumeX className="h-5 w-5 text-gray-500" />
              ) : (
                <Volume2 className="h-5 w-5 text-blue-500" />
              )}
            </Button>
          </div>
          
          <Card className="p-6 space-y-6 bg-white/80 backdrop-blur shadow-xl">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="playerName" className="text-sm font-medium text-gray-700">
                  Nom du dresseur
                </label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder="Entrez votre nom"
                  className={`w-full h-11 px-4 text-lg transition-colors
                    ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
                  `}
                  value={playerName}
                  onChange={handlePlayerNameChange}
                />
                {nameError && (
                  <p className="text-red-500 text-sm mt-1">{nameError}</p>
                )}
              </div>

              {/* Generation Selection */}
              <div className="text-center mb-4">
                <h2 className="text-lg font-semibold mb-2 text-gray-800">
                  Génération Pokémon
                </h2>
                <div className="flex flex-wrap justify-center gap-2">
                  {GENERATIONS.map((gen) => (
                    <Button
                      key={gen.name}
                      onClick={() => handleGenerationSelect(gen)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all
                        ${selectedGeneration.name === gen.name
                          ? 'bg-blue-500 text-white shadow-lg scale-105'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {gen.name}
                    </Button>
                  ))}
                </div>
              </div>

              <Button
                onClick={startGame}
                disabled={!canStartGame}
                className={`w-full h-12 text-lg font-medium mt-4 transition-colors
                  ${canStartGame 
                    ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                    : 'bg-gray-200 text-gray-500'
                  }`}
              >
                {score > 0 ? 'Rejouer!' : 'Commencer!'}
              </Button>
            </div>
          </Card>
          
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
                <div className="col-span-2 font-bold text-center">Temps</div>
                <div className="col-span-3 font-bold text-center hidden sm:block">Date</div>
              </div>
              
              {/* Rankings list with fixed height */}
              <div className="divide-y divide-gray-200 h-[400px] overflow-y-auto">
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
                    <div className="col-span-2 text-center font-mono text-gray-700">
                      {formatTimeForRanking(player.time)}
                    </div>
                    <div className="col-span-3 text-center text-xs text-gray-500 hidden sm:block">
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
        <Dialog open={gameOver} onOpenChange={(open) => !open && setGameOver(false)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle className="text-center text-2xl font-bold flex items-center justify-center gap-2">
                <Trophy className="h-6 w-6 text-yellow-500" />
                Partie terminée!
              </DialogTitle>
            </DialogHeader>
            
            <div className="grid gap-6">
              <div className="grid grid-cols-2 gap-4 p-4 bg-blue-50 rounded-xl">
                <div className="space-y-2">
                  <p className="text-sm text-blue-600 font-medium">Dresseur</p>
                  <p className="font-semibold text-gray-900">{playerName}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-600 font-medium">Score final</p>
                  <p className="font-semibold text-gray-900">{score}</p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-600 font-medium">Classement</p>
                  <p className="font-semibold text-gray-900">
                    {userRanking !== null ? `#${userRanking}` : 'Non classé'}
                  </p>
                </div>
                <div className="space-y-2">
                  <p className="text-sm text-blue-600 font-medium">Temps total</p>
                  <p className="font-semibold text-gray-900">
                    {formatTimeForRanking(totalTimeElapsed)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Button
                  onClick={() => {
                    setGameOver(false);
                    setIsGameActive(false);
                    setScore(0);
                    setTimeLeft(GAME_TIME);
                    startGame();
                  }}
                  className="w-full"
                  variant="default"
                >
                  <RefreshCcw className="mr-2 h-4 w-4" />
                  Rejouer
                </Button>
                <Button
                  onClick={() => {
                    setGameOver(false);
                    setIsGameActive(false);
                    setScore(0);
                    setTimeLeft(GAME_TIME);
                    setCurrentPokemonId(null);
                  }}
                  className="w-full"
                  variant="outline"
                >
                  <Home className="mr-2 h-4 w-4" />
                  Menu
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default PokemonGame;
