import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
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
import { useTranslation } from 'react-i18next';
import { auth } from '../../firebase';

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
  { minScore: 2000, condition: (pokemon: Pokemon) => pokemon.isMythical && pokemon.name === 'mew' },
  { minScore: 1500, condition: (pokemon: Pokemon) => pokemon.isMythical },
  { minScore: 1000, condition: (pokemon: Pokemon) => pokemon.isLegendary },
  { minScore: 750, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 3 && !pokemon.isLegendary && !pokemon.isMythical },
  { minScore: 500, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 2 && !pokemon.isLegendary && !pokemon.isMythical },
  { minScore: 300, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 1 && !pokemon.hasEvolution && !pokemon.isLegendary && !pokemon.isMythical },
  { minScore: 0, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 1 && pokemon.hasEvolution && !pokemon.isLegendary && !pokemon.isMythical },
];

// Add this debounce utility function near other utility functions
const debounce = <T extends (...args: Parameters<T>) => ReturnType<T>>(
  func: T,
  wait: number
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

const PokemonGame = () => {
  const { i18n } = useTranslation();
  const [bestScore, setBestScore] = useLocalStorage<number>('bestScore', 0);
  const [bestTime, setBestTime] = useLocalStorage<number>('bestTime', 0);
  const [guess, setGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [isGameActive, setIsGameActive] = useState(false);
  const [isHardMode, setIsHardMode] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<Generation>(GENERATIONS[0]);
  const [remainingPokemon, setRemainingPokemon] = useState<number[]>([]);
  const [rankings, setRankings] = useState<Rankings[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [userRanking, setUserRanking] = useState<number | null>(null);
  const [showCriticalSuccess, setShowCriticalSuccess] = useState(false);
  const [showCriticalHit, setShowCriticalHit] = useState(false);
  const [showHypeTrain, setShowHypeTrain] = useState(false);
  const [consecutiveFastAnswers, setConsecutiveFastAnswers] = useState(0);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [criticalHitCount, setCriticalHitCount] = useState(0);
  const [criticalSuccessCount, setCriticalSuccessCount] = useState(0);
  const [hyperTrainCount, setHyperTrainCount] = useState(0);
  const [maxHypeChain, setMaxHypeChain] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  const timerInterval = useRef<NodeJS.Timeout | null>(null);
  const totalTimeInterval = useRef<NodeJS.Timeout | null>(null);
  const [guessTimeLeft, setGuessTimeLeft] = useState<number>(15);
  const [totalTimeElapsed, setTotalTimeElapsed] = useState<number>(0);
  const [nameError, setNameError] = useState<string | null>(null);
  const [isCheckingName, setIsCheckingName] = useState(false);
  const [currentPokemonId, setCurrentPokemonId] = useState<number | null>(null);
  const [isMuted, setIsMuted] = useState(() => {
    const savedMute = localStorage.getItem('pokemonGameMuted');
    return savedMute ? JSON.parse(savedMute) : false;
  });
  const victoryAudioRef = useRef<HTMLAudioElement | null>(null);
  const correctAudioRef = useRef<HTMLAudioElement | null>(null);
  const wrongAudioRef = useRef<HTMLAudioElement | null>(null);
  const trainHornRef = useRef<HTMLAudioElement | null>(null);
  const lowLifeRef = useRef<HTMLAudioElement | null>(null);
  const isHandlingGameOverRef = useRef<{ timestamp: number } | null>(null);
  // Track if the name came from auth
  const [isAuthName, setIsAuthName] = useState(false);
  const savedName = localStorage.getItem('pokemonGamePlayerName');
  const canStartGame = Boolean(
    (playerName && !nameError && !isCheckingName) || 
    (savedName && playerName === savedName) ||
    (playerName && isAuthName)
  );
  
  // Add sound URLs as constants at the top of the component
  const CORRECT_SOUND_URL = '/sounds/pkm_level_up.mp3';
  const WRONG_SOUND_URL = '/sounds/bump_wall.mp3';
  const VICTORY_SOUND_URL = '/sounds/battle_win.mp3';
  const TRAIN_HORN_URL = '/sounds/train_horn_bell.mp3';
  const LOW_LIFE_SOUND_URL = '/sounds/low_life.mp3';
  
  // Use cached Pokemon data or fetch from API
  const { data: apiPokemonNames = [] } = useGetAllPokemonNamesQuery({ maxHypeChain }, {
    refetchOnMountOrArgChange: false, // Don't refetch on mount
    refetchOnFocus: false, // Don't refetch when window regains focus
    refetchOnReconnect: false // Don't refetch when reconnecting
  });

  const pokemonNames = useMemo<Pokemon[]>(() => {
    return apiPokemonNames;
  }, [apiPokemonNames]);

  const { 
    data: currentPokemon,
    isLoading: isPokemonLoading 
  } = useGetPokemonByIdQuery(currentPokemonId ? { id: currentPokemonId, maxHypeChain } : skipToken, {
    skip: !currentPokemonId || !isGameActive,
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false
  });

  const { data: allPokemonData = [] } = useGetAllPokemonNamesQuery({ maxHypeChain }, {
    refetchOnMountOrArgChange: false,
    refetchOnFocus: false,
    refetchOnReconnect: false
  });

  const [rewardPokemon, setRewardPokemon] = useState<{ pokemon: Pokemon | undefined; isLoading: boolean }>({
    pokemon: undefined,
    isLoading: true
  });

  const calculateRewardPokemon = useCallback(async (score: number) => {
    console.log('🎯 calculateRewardPokemon called with score:', score);
    if (!allPokemonData || allPokemonData.length === 0) {
      console.log('❌ No Pokemon data available');
      return { pokemon: undefined, isLoading: false };
    }

    try {
      // Find the appropriate tier based on score
      const tier = POKEMON_REWARDS.find(tier => score >= tier.minScore);
      console.log('🏆 Found tier:', tier ? `minScore: ${tier.minScore}` : 'No tier found');

      if (!tier) {
        console.log('🎲 Selecting random basic Pokemon');
        // If no tier found, return a random basic Pokémon
        const basicPokemon = allPokemonData.filter(pokemon => 
          pokemon.id >= selectedGeneration.startId && 
          pokemon.id <= selectedGeneration.endId &&
          pokemon.evolvesFromSpecies === null && 
          pokemon.hasEvolution
        );
        
        if (basicPokemon.length === 0) {
          console.log('❌ No basic Pokemon found');
          return {
            pokemon: undefined,
            isLoading: false
          };
        }
        
        const randomBasic = basicPokemon[Math.floor(Math.random() * basicPokemon.length)];
        console.log('✅ Selected basic Pokemon:', randomBasic.englishName);
        
        return {
          pokemon: randomBasic,
          isLoading: false
        };
      }

      console.log('🔍 Filtering eligible Pokemon for tier');
      // Filter Pokémon based on the tier condition and selected generation
      const eligiblePokemon = allPokemonData.filter(pokemon => 
        tier.condition(pokemon) && 
        pokemon.id >= selectedGeneration.startId && 
        pokemon.id <= selectedGeneration.endId
      );
      console.log('📊 Found eligible Pokemon:', eligiblePokemon.length);

      // If no eligible Pokémon found in the current tier, try the next lower tier
      if (eligiblePokemon.length === 0) {
        console.log('⬇️ No eligible Pokemon in current tier, trying lower tiers');
        const lowerTiers = POKEMON_REWARDS.slice(POKEMON_REWARDS.indexOf(tier) + 1);
        for (const lowerTier of lowerTiers) {
          console.log('🔄 Trying lower tier with minScore:', lowerTier.minScore);
          const lowerTierPokemon = allPokemonData.filter(pokemon => 
            lowerTier.condition(pokemon) && 
            pokemon.id >= selectedGeneration.startId && 
            pokemon.id <= selectedGeneration.endId
          );
          
          if (lowerTierPokemon.length > 0) {
            const randomPokemon = lowerTierPokemon[Math.floor(Math.random() * lowerTierPokemon.length)];
            console.log('✅ Selected Pokemon from lower tier:', randomPokemon.englishName);
            
            return {
              pokemon: randomPokemon,
              isLoading: false
            };
          }
        }
        
        console.log('⚠️ No Pokemon found in lower tiers, selecting random from generation');
        // If still no Pokémon found, return a random Pokémon from the generation
        const generationPokemon = allPokemonData.filter(pokemon => 
          pokemon.id >= selectedGeneration.startId && 
          pokemon.id <= selectedGeneration.endId
        );
        
        const randomPokemon = generationPokemon[Math.floor(Math.random() * generationPokemon.length)];
        console.log('✅ Selected random Pokemon from generation:', randomPokemon.englishName);
        
        return {
          pokemon: randomPokemon,
          isLoading: false
        };
      }
      
      // Pick a random Pokémon from the eligible ones
      const randomPokemon = eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];
      console.log('✅ Selected Pokemon from eligible tier:', randomPokemon.englishName);
      
      return {
        pokemon: randomPokemon,
        isLoading: false
      };
    } catch (error) {
      console.error('❌ Error calculating reward Pokemon:', error);
      return {
        pokemon: undefined,
        isLoading: false
      };
    }
  }, [allPokemonData, selectedGeneration]);

  // Capitalize first letter of a string
  const capitalize = (str: string): string => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Normalize text to handle special characters
  const normalizeText = (text: string | undefined | null): string => {
    if (!text) return '';
    
    const lowerText = text.toLowerCase().trim();
    
    // Handle special cases first
    const specialCases: { [key: string]: string } = {
      'nidoran♂': 'nidoranm',
      'nidoran♀': 'nidoranf',
      'nidoranm': 'nidoranm',
      'nidoranf': 'nidoranf',
      'mr. mime': 'mrmime',
      'mr mime': 'mrmime',
      'mime jr.': 'mimejr',
      'mime jr': 'mimejr',
      'farfetch\'d': 'farfetchd',
      'farfetchd': 'farfetchd',
      'sirfetch\'d': 'sirfetchd',
      'sirfetchd': 'sirfetchd',
      'type: null': 'typenull',
      'type null': 'typenull',
      'flabébé': 'flabebe',
      'flabebe': 'flabebe',
      'jangmo-o': 'jangmoo',
      'jangmoo': 'jangmoo',
      'hakamo-o': 'hakamoo',
      'hakamoo': 'hakamoo',
      'kommo-o': 'kommoo',
      'kommoo': 'kommoo'
    };

    if (specialCases[lowerText]) {
      return specialCases[lowerText];
    }
    
    return lowerText
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

  const handleSuggestionClick = async (suggestion: string) => {
    if (guessTimeLeft <= 0 || isPokemonLoading) return;
    
    setGuess(suggestion);
    setSuggestions([]);
    
    // Wait for a small delay to ensure Pokemon data is loaded
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const normalizedSuggestion = normalizeText(suggestion);
    const pokemonNameFr = currentPokemon?.frenchName;
    const pokemonNameEn = currentPokemon?.englishName;
    
    if (!pokemonNameFr || !pokemonNameEn) {
      return;
    }
    
    const normalizedAnswerFr = normalizeText(pokemonNameFr);
    const normalizedAnswerEn = normalizeText(pokemonNameEn);
    
    if (normalizedSuggestion === normalizedAnswerFr || 
        normalizedSuggestion === normalizedAnswerEn ||
        suggestion.toLowerCase() === pokemonNameFr.toLowerCase() ||
        suggestion.toLowerCase() === pokemonNameEn.toLowerCase()) {
      handleCorrectAnswer();
    } else {
      setIsCorrect(false);
      if (!isMuted) {
        cleanupAllAudio();
        wrongAudioRef.current = new Audio(WRONG_SOUND_URL);
        try {
          await wrongAudioRef.current.play();
        } catch {
          if (wrongAudioRef.current) {
            wrongAudioRef.current = null;
          }
        }
      }
    }
  };

  // Update handleGuessChange to use pokemonNames
  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (guessTimeLeft <= 0) return;
    
    const value = e.target.value;
    setGuess(capitalize(value));
    setHighlightedIndex(0);
    
    if (value.length > 0) {
      const normalizedValue = normalizeText(value);
      
      const filteredSuggestions = pokemonNames
        .filter(pokemon => {
          if (!pokemon) return false;
          const pokemonNameFr = pokemon.frenchName;
          const pokemonNameEn = pokemon.name; // Use name instead of englishName
          if (!pokemonNameFr || !pokemonNameEn) return false;
          
          const normalizedNameFr = normalizeText(pokemonNameFr);
          const normalizedNameEn = normalizeText(pokemonNameEn);
          
          return (normalizedNameFr.startsWith(normalizedValue) || 
                 normalizedNameEn.startsWith(normalizedValue)) && 
                 pokemon.id >= selectedGeneration.startId && 
                 pokemon.id <= selectedGeneration.endId;
        })
        .sort((a, b) => {
          // Sort by exact match first
          const aNameFr = normalizeText(a.frenchName);
          const aNameEn = normalizeText(a.name);
          const bNameFr = normalizeText(b.frenchName);
          const bNameEn = normalizeText(b.name);
          const normalizedValue = normalizeText(value);

          const aExactMatch = aNameFr === normalizedValue || aNameEn === normalizedValue;
          const bExactMatch = bNameFr === normalizedValue || bNameEn === normalizedValue;

          if (aExactMatch && !bExactMatch) return -1;
          if (!aExactMatch && bExactMatch) return 1;

          // Then sort by length
          const aLength = Math.min(a.frenchName.length, a.name.length);
          const bLength = Math.min(b.frenchName.length, b.name.length);
          return aLength - bLength;
        })
        .map(pokemon => capitalize(i18n.language === 'fr' ? pokemon.frenchName : pokemon.name))
        .filter(Boolean)
        .slice(0, 5);

      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  };

  // Update cleanupAllAudio
  const cleanupAllAudio = () => {
    [victoryAudioRef, correctAudioRef, wrongAudioRef, trainHornRef, lowLifeRef].forEach(ref => {
      if (ref.current) {
        ref.current.pause();
        ref.current.currentTime = 0;
      }
    });
  };

  // Add cleanup effect for train horn sound when component unmounts
  useEffect(() => {
    return () => {
      if (trainHornRef.current) {
        trainHornRef.current.pause();
        trainHornRef.current.currentTime = 0;
        trainHornRef.current = null;
      }
    };
  }, []);

  // Add effect to monitor timer for Hype Train
  useEffect(() => {
    if (guessTimeLeft === 9) {
      if (showHypeTrain && consecutiveFastAnswers > 0) {
        const bonusPoints = consecutiveFastAnswers;
        setScore(prev => prev + bonusPoints);
        // Show bonus points animation
        setPointsEarned(bonusPoints);
        setTimeout(() => {
          setPointsEarned(0);
        }, 1000);
        // Increment hype train count when it ends
        setHyperTrainCount(prev => prev + 1);
      }
      setConsecutiveFastAnswers(0);
      setShowHypeTrain(false);
      // Stop train horn sound
      if (trainHornRef.current) {
        trainHornRef.current.pause();
        trainHornRef.current.currentTime = 0;
        trainHornRef.current = null;
      }
    }
  }, [guessTimeLeft, showHypeTrain, consecutiveFastAnswers]);

  // Add effect to stop train horn when game is over or when Hype Train should stop
  useEffect(() => {
    if (!showHypeTrain && trainHornRef.current) {
      trainHornRef.current.pause();
      trainHornRef.current.currentTime = 0;
      trainHornRef.current = null;
    }
  }, [showHypeTrain]);

  // Add effect to handle timer
  useEffect(() => {
    if (!isHardMode || !isGameActive) {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      return;
    }

    // Start or restart timer
    if (!timerInterval.current) {
      // Set initial time based on whether the Pokemon is shiny
      setGuessTimeLeft(currentPokemon?.isShiny ? 10 : 15);
      timerInterval.current = setInterval(() => {
        setGuessTimeLeft((prev) => {
          if (prev <= 1) {
            if (timerInterval.current) {
              clearInterval(timerInterval.current);
              timerInterval.current = null;
            }
            setIsCorrect(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    // Cleanup on unmount or when game mode changes
    return () => {
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
    };
  }, [isHardMode, isGameActive, currentPokemonId, currentPokemon?.isShiny]);

  const handleCorrectAnswer = async () => {
    setIsCorrect(true);
    
    // Stop the timer immediately to preserve the current time for points calculation
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }

    // Clean up all audio immediately when correct answer is given
    cleanupAllAudio();
    
    // Award a hint every 5 correct answers
    if ((score + 1) % 5 === 0) {
      setHintsLeft(prev => prev + 1);
    }
    
    // Handle Hype Train logic only in hard mode
    if (isHardMode && guessTimeLeft >= 10) {
      setConsecutiveFastAnswers(prev => {
        const newCount = prev + 1;
        
        // Start Hype Train when reaching 3 or more
        if (newCount >= 3) {
          setShowHypeTrain(true);
          setMaxHypeChain(prev => Math.max(prev, newCount));
        }
        return newCount;
      });
    } else {
      setConsecutiveFastAnswers(0);
      setShowHypeTrain(false);
    }

    let earnedPoints = 0;

    // Calculate points based on remaining time in Hard mode
    if (isHardMode) {
      if (currentPokemon?.isShiny) {
        earnedPoints = 5; // Always 5 points for shiny Pokemon
      } else {
        const maxTime = 15;
        const fastTime = 10;
        const mediumTime = 5;

        if (guessTimeLeft >= fastTime && guessTimeLeft <= maxTime) {
          earnedPoints = 3;
        } else if (guessTimeLeft >= mediumTime && guessTimeLeft < fastTime) {
          earnedPoints = 2;
        } else if (guessTimeLeft >= 0 && guessTimeLeft < mediumTime) {
          earnedPoints = 1;
        }
      }

      // Show special effects only if not in Hype Train
      if (!showHypeTrain) {
        // Show Succès Critique only at 0 seconds
        if (guessTimeLeft === 0) {
          setShowCriticalSuccess(true);
          setCriticalSuccessCount(prev => prev + 1);
          setTimeout(() => {
            setShowCriticalSuccess(false);
          }, 2000);
          // Base point only for Succès Critique
          earnedPoints = currentPokemon?.isShiny ? 5 : 1;
        }
        // Show Coup Critique with 20% chance
        else if (Math.random() < 0.2) {
          setShowCriticalHit(true);
          setCriticalHitCount(prev => prev + 1);
          setTimeout(() => {
            setShowCriticalHit(false);
          }, 2000);
          // Add 1 bonus point for Coup Critique (but keep 5 points for shiny)
          earnedPoints = currentPokemon?.isShiny ? 5 : earnedPoints + 1;
        }
      }
    } else {
      earnedPoints = currentPokemon?.isShiny ? 5 : 1;
    }

    // Always show points earned animation
    setPointsEarned(earnedPoints);
    setTimeout(() => {
      setPointsEarned(0);
    }, 1000);
    
    setScore(prev => prev + earnedPoints);
    
    if (!isMuted) {
      correctAudioRef.current = new Audio(CORRECT_SOUND_URL);
      try {
        await correctAudioRef.current.play();
      } catch {
        if (correctAudioRef.current) {
          correctAudioRef.current = null;
        }
      }
    }
    
    // Remove the current Pokemon from remainingPokemon
    if (currentPokemon) {
      setRemainingPokemon(prev => prev.filter(id => id !== currentPokemon.id));
    }
    
    // Check if this was the last Pokémon
    const isLastPokemon = remainingPokemon.length <= 1;
    
    if (isLastPokemon) {
      setTimeout(() => {
        handleGameOver();
      }, 1500);
    } else {
      // 1. Show the correct answer for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 2. Clear current Pokemon and set loading state
      setCurrentPokemonId(null);
      setIsCorrect(null);
      setGuess('');
      setSuggestions([]);
      setShowHint(false);
      
      // Wait for states to be cleared
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 3. Wait for loading state to be visible
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // 4. Select next Pokemon
      const nextPokemonId = remainingPokemon[Math.floor(Math.random() * remainingPokemon.length)];
      
      // 5. Update remaining pool
      setRemainingPokemon(prev => prev.filter(id => id !== nextPokemonId));
      
      // Wait for remaining pool to update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      // 6. Set new Pokemon
      setCurrentPokemonId(nextPokemonId);
      
      // 7. Focus input
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // Handle right arrow for hint regardless of suggestions
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      if (hintsLeft > 0 && currentPokemon) {
        setShowHint(true);
        setHintsLeft(prev => prev - 1);
      }
      return;
    }

    if (e.key === 'Enter') {
      e.preventDefault();
      if (suggestions.length > 0 && highlightedIndex >= 0) {
        handleSuggestionClick(suggestions[highlightedIndex]);
      } else if (guess.trim()) {
        handleSuggestionClick(guess);
      }
      return;
    }

    if (suggestions.length === 0) {
      return;
    }

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
    }
  };

  const useHint = () => {
    if (hintsLeft > 0 && currentPokemon) {
      setShowHint(true);
      setHintsLeft(prev => prev - 1);
    }
  };

  // Add effect to handle invalid Pokemon data
  useEffect(() => {
    // Only handle invalid data if we have a currentPokemonId and the game is active
    if (isGameActive && !isPokemonLoading && currentPokemonId !== null && remainingPokemon.length > 0 && 
        (currentPokemon === undefined || 
         currentPokemon?.englishName === undefined || 
         currentPokemon?.frenchName === undefined)) {
      // Reset the current Pokemon ID to trigger a new fetch
      setCurrentPokemonId(null);
      // Add the ID back to the remaining pool
      setRemainingPokemon(prev => [...prev, currentPokemonId]);
    }
  }, [currentPokemon, currentPokemonId, isGameActive, isPokemonLoading, remainingPokemon.length]);

  // Add name format conversion functions
  const convertToStoredFormat = (displayName: string): string => {
    // Keep only the part before the first space
    return displayName.trim().split(/\s+/)[0];
  };

  const convertToDisplayFormat = (storedName: string): string => {
    // Display name is the same as stored name since we only keep the first part
    return storedName;
  };

  const fetchSelectedRankings = useCallback(async () => {
    try {
      const rankingsRef = collection(db, `rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`);
      const q = query(rankingsRef, orderBy('score', 'desc'), limit(20)); // Fetch top 20 players
      const querySnapshot = await getDocs(q);
      const rankingsData: Rankings[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data() as DocumentData;
        // Convert the stored name to display format
        const storedName = data.name;
        const displayName = convertToDisplayFormat(storedName);
        
        rankingsData.push({
          ...data,
          name: displayName, // Use display name for UI
          timestamp: (data.timestamp as Timestamp)?.toDate() || new Date(data.timestamp)
        } as Rankings);
      });
      setRankings(rankingsData);

      // Find user's best record and update best time
      // Use the stored format for comparison
      const userStoredName = convertToStoredFormat(playerName);
      const userBestRecord = rankingsData.find(record => 
        convertToStoredFormat(record.name) === userStoredName
      );
      if (userBestRecord) {
        setBestTime(userBestRecord.time);
      }
    } catch {
      // Ignore database errors
    }
  }, [selectedGeneration, playerName, setBestTime]);

  const handleGameOver = useCallback(async () => {
    console.log('🎮 handleGameOver called, gameOver state:', gameOver);
    if (gameOver) {
      console.log('️ Game already over, returning');
      return;
    }
    if (isHandlingGameOverRef.current) {
      console.log('⚠️ Previous game over handling detected, checking timeout...');
      const now = Date.now();
      if (!isHandlingGameOverRef.current.timestamp || now - isHandlingGameOverRef.current.timestamp > 10000) {
        console.log('🔄 Resetting stuck game over state');
        isHandlingGameOverRef.current = null;
      } else {
        console.log('⏹️ Game over is being handled, returning');
        return;
      }
    }
    
    // Set the ref with timestamp to track how long we've been handling
    isHandlingGameOverRef.current = { timestamp: Date.now() };
    
    try {
      // Show the correct Pokemon first
      setIsCorrect(true);
      console.log('✅ Set isCorrect to true');
      
      // Wait for the reveal animation and give time to see the name
      await new Promise(resolve => setTimeout(resolve, 3000));
      console.log('⏱️ Waited for reveal animation');

      // Update states
      setIsGameActive(false);
      setGameOver(true);
      console.log('🔄 Updated game states: isGameActive=false, gameOver=true');
      
      // Always calculate reward Pokemon, regardless of remaining Pokemon
      console.log('🎁 Calculating reward Pokemon');
      // Set loading state first
      setRewardPokemon({ pokemon: undefined, isLoading: true });
      console.log('⌛ Set reward Pokemon loading state');
      // Calculate reward Pokemon
      const rewardResult = await calculateRewardPokemon(score);
      console.log('✨ Calculated reward Pokemon:', rewardResult.pokemon?.englishName);
      // Update the reward Pokemon state
      setRewardPokemon(rewardResult);
      console.log('💾 Updated reward Pokemon state');
      
      // Small delay to ensure state updates are processed
      await new Promise(resolve => setTimeout(resolve, 50));
      console.log('⏱️ Waited for state updates');
      
      // Then handle audio
      if (!isMuted) {
        cleanupAllAudio();
        console.log('🔊 Cleaned up audio');

        try {
          // Wait for any Pokemon cry handling to finish
          if (rewardResult.pokemon) {
            console.log('🎵 Playing reward Pokemon cry');
            // Wait for potential cry playback and cleanup
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          // Always play victory sound
          console.log('🎺 Playing victory sound');
          victoryAudioRef.current = new Audio(VICTORY_SOUND_URL);
          await victoryAudioRef.current.play();
          console.log('✅ Victory sound played successfully');
        } catch (error) {
          console.error('❌ Error playing audio:', error);
          if (victoryAudioRef.current) {
            victoryAudioRef.current = null;
          }
        }
      }

      // Only update best score and save to rankings in Hard mode
      if (isHardMode) {
        if (score > bestScore) {
          setBestScore(score);
        }
        
        if (score > 0 && playerName) {
          try {
            const storedName = convertToStoredFormat(playerName.trim());
            const collectionName = `rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`;
            const rankingsRef = collection(db, collectionName);
            // Use stored format for query
            const q = query(rankingsRef, where('name', '==', storedName));
            const querySnapshot = await getDocs(q);
            
            const playerData = {
              name: storedName, // Store in abbreviated format
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
          } catch {
            // Ignore database errors
          }
        }
      }
    } finally {
      // Reset the ref in finally block to ensure it's always reset
      isHandlingGameOverRef.current = null;
      console.log('🧹 Reset game over handling state');
    }
  }, [gameOver, score, isMuted, calculateRewardPokemon, selectedGeneration.startId, selectedGeneration.endId, bestScore, playerName, totalTimeElapsed, setBestTime, fetchSelectedRankings]);

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

  // Update checkNameAvailability to use stored format
  const checkNameAvailability = useCallback(async (name: string) => {
    const storedName = convertToStoredFormat(name.trim());
    if (!storedName) {
      setNameError(null);
      localStorage.removeItem('pokemonGamePlayerName');
      return false;
    }

    // If user is authenticated and this is their name, allow it immediately
    const currentUser = auth.currentUser;
    if (currentUser?.displayName === name) {
      setNameError(null);
      setIsCheckingName(false);
      return true;
    }

    // Only set isCheckingName to true for new names
    setIsCheckingName(true);

    try {
      // Check across all generations using stored format
      for (const gen of GENERATIONS) {
        const collectionName = `rankings_gen${gen.startId}_${gen.endId}`;
        const rankingsRef = collection(db, collectionName);
        const q = query(rankingsRef, where('name', '==', storedName));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          setNameError('Ce nom est déjà utilisé. Veuillez en choisir un autre.');
          localStorage.removeItem('pokemonGamePlayerName');
          setIsCheckingName(false);
          return false;
        }
      }
      
      setNameError(null);
      setIsCheckingName(false);
      return true;
    } catch (error) {
      console.error('Error checking name availability:', error);
      setNameError('Erreur lors de la vérification du nom');
      setIsCheckingName(false);
      return false;
    }
  }, [GENERATIONS]);

  // Create debounced version of checkNameAvailability
  const debouncedCheckName = useCallback(
    debounce((name: string) => checkNameAvailability(name), 500),
    [checkNameAvailability]
  );

  // Update handlePlayerNameChange to only reset auth state for manual changes
  const handlePlayerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    // If user is authenticated, don't allow changes
    if (auth.currentUser) {
      return;
    }

    const exactName = e.target.value;
    setPlayerName(exactName);
    
    if (!exactName.trim()) {
      setNameError(null);
      setIsAuthName(false);
      localStorage.removeItem('pokemonGamePlayerName');
      return;
    }
    
    debouncedCheckName(exactName);
  }, [debouncedCheckName]);

  // Add isRestarting state
  const [isRestarting, setIsRestarting] = useState(false);

  // Update the startGame function
  const startGame = async (isHardMode: boolean) => {
    if (!playerName) return;
    
    const exactName = playerName.trim(); // Store exact input name
    const isAvailable = await checkNameAvailability(exactName);
    if (!isAvailable) return;
    
    // If it's a new user (different from saved name), clean up localStorage
    const savedName = localStorage.getItem('pokemonGamePlayerName');
    if (savedName !== exactName) {
      localStorage.clear();
      localStorage.setItem('pokemonGamePlayerName', exactName);
    }
    
    // Ensure we're in restarting state
    setIsRestarting(true);
    
    // Reset all game states first
    setIsHardMode(isHardMode);
    setConsecutiveFastAnswers(0);
    setShowHypeTrain(false);
    setPointsEarned(0);
    setCurrentPokemonId(null);
    setIsCorrect(null);
    setGuess('');
    setSuggestions([]);
    setShowHint(false);
    
    // Reset reward Pokemon state
    setRewardPokemon({
      pokemon: undefined,
      isLoading: true
    });
    
    // Clean up all audio
    cleanupAllAudio();
    
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
    // In Chill mode, set hints to Infinity, in Hard mode set to 0
    setHintsLeft(isHardMode ? 0 : Infinity);
    // In Chill mode, no timer (set to Infinity), in Hard mode set to 15
    setGuessTimeLeft(isHardMode ? 15 : Infinity);
    setTotalTimeElapsed(0);
    setGameOver(false);
    setUserRanking(null);
    setHighlightedIndex(-1);
    
    // Initialize Pokémon list for selected generation
    const allPokemonIds = Array.from(
      { length: selectedGeneration.endId - selectedGeneration.startId + 1 },
      (_, i) => selectedGeneration.startId + i
    );
    
    // Set initial state and wait for it to be updated
    setRemainingPokemon(allPokemonIds);
    
    // Add a delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Set game active and clear restarting state
    setIsGameActive(true);
    
    // Start timers based on game mode
    if (isHardMode) {
      startGuessTimer();
    }
    startTotalTimer();
    
    // Add another small delay before setting the first Pokemon
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Start the game by fetching first Pokemon
    const randomIndex = Math.floor(Math.random() * allPokemonIds.length);
    const firstPokemonId = allPokemonIds[randomIndex];
    
    // Remove the first Pokémon from the pool before setting it
    setRemainingPokemon(prev => prev.filter(id => id !== firstPokemonId));
    
    // Finally set the current Pokemon ID and clear restarting state
    setCurrentPokemonId(firstPokemonId);
    setIsRestarting(false);
    
    // Focus the input
    inputRef.current?.focus();
  };

  // Add this effect to handle mute state persistence
  useEffect(() => {
    localStorage.setItem('pokemonGameMuted', JSON.stringify(isMuted));
  }, [isMuted]);

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

  // Modify the startGuessTimer function
  const startGuessTimer = useCallback(() => {
    // Only start the timer in hard mode
    if (!isHardMode) return;

    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }

    setGuessTimeLeft(15);
    timerInterval.current = setInterval(() => {
      setGuessTimeLeft((prev) => {
        if (prev <= 1) {
          if (timerInterval.current) {
            clearInterval(timerInterval.current);
            timerInterval.current = null;
          }
          setIsCorrect(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [isHardMode]);

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
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      if (totalTimeInterval.current) {
        clearInterval(totalTimeInterval.current);
        totalTimeInterval.current = null;
      }
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

  // Update the initial useEffect for loading the username
  useEffect(() => {
    const savedName = localStorage.getItem('pokemonGamePlayerName');
    if (savedName) {
      setPlayerName(savedName);
      setNameError(null);
      setIsAuthName(true); // Set auth name state for saved names
      // For saved names, we don't need to set isCheckingName to true
      // Just validate silently in the background
      checkNameAvailability(savedName).then(isAvailable => {
        if (!isAvailable) {
          localStorage.removeItem('pokemonGamePlayerName');
          setPlayerName('');
          setNameError('Ce nom est déjà utilisé. Veuillez en choisir un autre.');
          setIsAuthName(false);
        }
      }).catch(() => {
        // If check fails, still allow using the saved name
        setNameError(null);
      });
    }
  }, [checkNameAvailability]);

  // Modify the auth name effect to be more immediate
  useEffect(() => {
    const savedName = localStorage.getItem('pokemonGamePlayerName');
    if (playerName) {
      // Only set isAuthName if it matches the saved name
      if (playerName === savedName) {
        setIsAuthName(true);
      }
      // If it's a new name, save it
      if (playerName !== savedName) {
        localStorage.setItem('pokemonGamePlayerName', playerName);
      }
    } else {
      setIsAuthName(false);
    }
  }, [playerName]);

  const handleGenerationSelect = (generation: Generation) => {
    setSelectedGeneration(generation);
    // Reset game state
    setScore(0);
    setGuess('');
    setSuggestions([]);
    setIsCorrect(null);
    setShowHint(false);
  };

  // Add back the necessary functions
  const handleQuit = useCallback(() => {
    handleGameOver();
  }, [handleGameOver]);

  const handleRestart = () => {
    // Clean up all audio first
    cleanupAllAudio();
    
    // Reset Pokemon-related states first
    setCurrentPokemonId(null);
    setIsCorrect(null);
    setGuess('');
    setSuggestions([]);
    setShowHint(false);
    
    // Set restarting state to true
    setIsRestarting(true);
    
    // Add a small delay to ensure states are cleared before starting new game
    setTimeout(() => {
      // Start a new game with the same mode
      startGame(isHardMode);
    }, 100);
  };

  const handleBackToMenu = () => {
    // Stop any ongoing timers
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (totalTimeInterval.current) {
      clearInterval(totalTimeInterval.current);
      totalTimeInterval.current = null;
    }
    
    // Clean up all audio
    cleanupAllAudio();
    
    // Reset game state
    setIsGameActive(false);
    setGameOver(false);
    setScore(0);
    setHintsLeft(MAX_HINTS);
    setIsCorrect(null);
    setGuess('');
    setSuggestions([]);
    setShowHint(false);
    setConsecutiveFastAnswers(0);
    setShowHypeTrain(false);
    setCriticalHitCount(0);
    setCriticalSuccessCount(0);
    setHyperTrainCount(0);
    setMaxHypeChain(0);
    setTotalTimeElapsed(0);
  };

  // Add effect to log Pokemon data when it loads
  useEffect(() => {
    if (currentPokemon && !isPokemonLoading) {
      // Pokemon data loaded, no need to log
    }
  }, [currentPokemon, isPokemonLoading]);

  // Remove duplicate useEffect hooks and cleanup functions
  useEffect(() => {
    // Cleanup function for all audio and timers
    return () => {
      cleanupAllAudio();
      if (timerInterval.current) {
        clearInterval(timerInterval.current);
        timerInterval.current = null;
      }
      if (totalTimeInterval.current) {
        clearInterval(totalTimeInterval.current);
        totalTimeInterval.current = null;
      }
    };
  }, []);

  // Consolidate train horn and low life sound effects
  useEffect(() => {
    // Handle train horn sound
    if (showHypeTrain && !isMuted && !trainHornRef.current) {
      trainHornRef.current = new Audio(TRAIN_HORN_URL);
      trainHornRef.current.volume = 0.05;
      trainHornRef.current.loop = true;
      trainHornRef.current.play().catch(() => {
        if (trainHornRef.current) {
          trainHornRef.current = null;
        }
      });
    } else if (!showHypeTrain && trainHornRef.current) {
      trainHornRef.current.pause();
      trainHornRef.current.currentTime = 0;
      trainHornRef.current = null;
    }

    // Handle low life sound
    if (isHardMode && guessTimeLeft <= 5 && guessTimeLeft > 0 && !isMuted && !lowLifeRef.current) {
      lowLifeRef.current = new Audio(LOW_LIFE_SOUND_URL);
      lowLifeRef.current.volume = 0.1;
      lowLifeRef.current.loop = true;
      lowLifeRef.current.play().catch(() => {
        if (lowLifeRef.current) {
          lowLifeRef.current = null;
        }
      });
    } else if ((guessTimeLeft > 5 || guessTimeLeft <= 0 || !isHardMode) && lowLifeRef.current) {
      lowLifeRef.current.pause();
      lowLifeRef.current.currentTime = 0;
      lowLifeRef.current = null;
    }
  }, [showHypeTrain, isMuted, isHardMode, guessTimeLeft]);

  // Add formatDisplayName function
  const formatDisplayName = useCallback((name: string | null | undefined, email: string | null | undefined): string => {
    if (!name) return '';
    
    // Check if it's a Gmail user
    const isGmailUser = email?.includes('@gmail.com');
    
    if (isGmailUser && name.includes(' ')) {
      // Split the full name into parts
      const nameParts = name.split(' ');
      const firstName = nameParts[0];
      const lastNameInitial = nameParts[nameParts.length - 1][0].toUpperCase();
      return `${firstName} .${lastNameInitial}`;
    }
    
    return name;
  }, []);

  // Add effect to handle auth state changes
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user?.displayName) {
        const formattedName = formatDisplayName(user.displayName, user.email);
        setPlayerName(formattedName);
        setIsAuthName(true);
        setNameError(null);
        setIsCheckingName(false);
        localStorage.setItem('pokemonGamePlayerName', formattedName);
      } else {
        // If no user, only clear if we were using an auth name
        if (isAuthName) {
          setPlayerName('');
          setIsAuthName(false);
          localStorage.removeItem('pokemonGamePlayerName');
        }
      }
    });

    return () => unsubscribe();
  }, [formatDisplayName]);

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
          onQuit={handleQuit}
          isHardMode={isHardMode}
          showCriticalSuccess={showCriticalSuccess}
          showCriticalHit={showCriticalHit}
          showHypeTrain={showHypeTrain}
          consecutiveFastAnswers={consecutiveFastAnswers}
          pointsEarned={pointsEarned}
          remainingCount={remainingPokemon.length}
          totalCount={selectedGeneration.endId - selectedGeneration.startId + 1}
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
          checkNameAvailability={checkNameAvailability}
        />
      )}

      <GameOverDialog
        gameOver={gameOver}
        setGameOver={setGameOver}
        playerName={playerName}
        score={score}
        bestScore={bestScore}
        bestTime={bestTime}
        userRanking={userRanking}
        totalTimeElapsed={totalTimeElapsed}
        formatTimeForRanking={formatTimeForRanking}
        rewardPokemon={rewardPokemon}
        remainingPokemon={remainingPokemon}
        handleRestart={handleRestart}
        handleBackToMenu={handleBackToMenu}
        isMuted={isMuted}
        criticalHitCount={criticalHitCount}
        criticalSuccessCount={criticalSuccessCount}
        hyperTrainCount={hyperTrainCount}
        maxHypeChain={maxHypeChain}
        selectedGeneration={selectedGeneration}
      />
    </div>
  );
};

export default PokemonGame;
