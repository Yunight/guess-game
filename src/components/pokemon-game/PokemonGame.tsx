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
  const lowLifeAudioRef = useRef<HTMLAudioElement | null>(null);
  const canStartGame = Boolean(playerName && !nameError && !isCheckingName);
  
  // Add sound URLs as constants at the top of the component
  const CORRECT_SOUND_URL = '/sounds/pkm_level_up.mp3';
  const WRONG_SOUND_URL = '/sounds/bump_wall.mp3';
  const VICTORY_SOUND_URL = '/sounds/battle_win.mp3';
  const TRAIN_HORN_URL = '/sounds/train_horn_bell.mp3';
  const LOW_LIFE_URL = '/sounds/low_life.mp3';
  
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
    console.log('🎮 Starting reward calculation with score:', score);
    setRewardPokemon({ pokemon: undefined, isLoading: true });

    if (!allPokemonData || allPokemonData.length === 0) {
      console.log('❌ No Pokémon data available');
      return;
    }

    console.log(`📊 Total Pokémon in data: ${allPokemonData.length}`);
    console.log(` Selected generation range: ${selectedGeneration.startId} - ${selectedGeneration.endId}`);

    try {
      // Find the appropriate tier based on score
      const tier = POKEMON_REWARDS.find(tier => score >= tier.minScore);
      console.log(' Selected tier:', tier ? `Score ${tier.minScore}+` : 'No tier found');

      if (!tier) {
        console.log('⚠ No tier found, selecting random basic Pokémon');
        // If no tier found, return a random basic Pokémon
        const basicPokemon = allPokemonData.filter(pokemon => 
          pokemon.id >= selectedGeneration.startId && 
          pokemon.id <= selectedGeneration.endId &&
          pokemon.evolvesFromSpecies === null && 
          pokemon.hasEvolution
        );
        
        console.log(`📝 Found ${basicPokemon.length} basic Pokémon in generation`);
        
        if (basicPokemon.length === 0) {
          console.log('❌ No basic Pokémon found in generation');
          setRewardPokemon({
            pokemon: undefined,
            isLoading: false
          });
          return;
        }
        
        const randomBasic = basicPokemon[Math.floor(Math.random() * basicPokemon.length)];
        console.log('✨ Selected basic Pokémon:', {
          id: randomBasic.id,
          name: randomBasic.frenchName,
          isLegendary: randomBasic.isLegendary,
          isMythical: randomBasic.isMythical,
          evolutionStage: randomBasic.evolutionStage
        });
        
        setRewardPokemon({
          pokemon: randomBasic,
          isLoading: false
        });
        return;
      }

      // Filter Pokémon based on the tier condition and selected generation
      const eligiblePokemon = allPokemonData.filter(pokemon => 
        tier.condition(pokemon) && 
        pokemon.id >= selectedGeneration.startId && 
        pokemon.id <= selectedGeneration.endId
      );

      console.log(`📝 Found ${eligiblePokemon.length} eligible Pokémon in tier`);
      
      // If no eligible Pokémon found in the current tier, try the next lower tier
      if (eligiblePokemon.length === 0) {
        console.log('⚠️ No eligible Pokémon in current tier, trying lower tiers');
        const lowerTiers = POKEMON_REWARDS.slice(POKEMON_REWARDS.indexOf(tier) + 1);
        for (const lowerTier of lowerTiers) {
          console.log(`🔍 Checking lower tier with minScore: ${lowerTier.minScore}`);
          const lowerTierPokemon = allPokemonData.filter(pokemon => 
            lowerTier.condition(pokemon) && 
            pokemon.id >= selectedGeneration.startId && 
            pokemon.id <= selectedGeneration.endId
          );
          
          console.log(`📝 Found ${lowerTierPokemon.length} Pokémon in lower tier`);
          
          if (lowerTierPokemon.length > 0) {
            const randomPokemon = lowerTierPokemon[Math.floor(Math.random() * lowerTierPokemon.length)];
            console.log('✨ Selected Pokémon from lower tier:', {
              id: randomPokemon.id,
              name: randomPokemon.frenchName,
              isLegendary: randomPokemon.isLegendary,
              isMythical: randomPokemon.isMythical,
              evolutionStage: randomPokemon.evolutionStage
            });
            
            setRewardPokemon({
              pokemon: randomPokemon,
              isLoading: false
            });
            return;
          }
        }
        
        console.log('⚠️ No Pokémon found in any tier, selecting random from generation');
        // If still no Pokémon found, return a random Pokémon from the generation
        const generationPokemon = allPokemonData.filter(pokemon => 
          pokemon.id >= selectedGeneration.startId && 
          pokemon.id <= selectedGeneration.endId
        );
        
        console.log(`📝 Found ${generationPokemon.length} Pokémon in generation`);
        
        const randomPokemon = generationPokemon[Math.floor(Math.random() * generationPokemon.length)];
        console.log('✨ Selected random Pokémon from generation:', {
          id: randomPokemon.id,
          name: randomPokemon.frenchName,
          isLegendary: randomPokemon.isLegendary,
          isMythical: randomPokemon.isMythical,
          evolutionStage: randomPokemon.evolutionStage
        });
        
        setRewardPokemon({
          pokemon: randomPokemon,
          isLoading: false
        });
        return;
      }
      
      // Pick a random Pokémon from the eligible ones
      const randomPokemon = eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];
      console.log('✨ Selected Pokémon from eligible tier:', {
        id: randomPokemon.id,
        name: randomPokemon.frenchName,
        isLegendary: randomPokemon.isLegendary,
        isMythical: randomPokemon.isMythical,
        evolutionStage: randomPokemon.evolutionStage
      });
      
      setRewardPokemon({
        pokemon: randomPokemon,
        isLoading: false
      });
    } catch (error) {
      console.error('❌ Error getting reward pokemon:', error);
      setRewardPokemon({
        pokemon: undefined,
        isLoading: false
      });
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
      console.log('❌ Missing Pokemon names:', { pokemonNameFr, pokemonNameEn, currentPokemon });
      return;
    }
    
    const normalizedAnswerFr = normalizeText(pokemonNameFr);
    const normalizedAnswerEn = normalizeText(pokemonNameEn);
    
    console.log('🔍 Checking answer:', {
      suggestion,
      normalizedSuggestion,
      pokemonNameFr,
      pokemonNameEn,
      normalizedAnswerFr,
      normalizedAnswerEn,
      currentPokemon
    });
    
    if (normalizedSuggestion === normalizedAnswerFr || 
        normalizedSuggestion === normalizedAnswerEn ||
        suggestion.toLowerCase() === pokemonNameFr.toLowerCase() ||
        suggestion.toLowerCase() === pokemonNameEn.toLowerCase()) {
      console.log('✅ Correct answer! Remaining Pokémon:', remainingPokemon.length);
      handleCorrectAnswer();
    } else {
      console.log('❌ Wrong answer:', {
        suggestionMatch: normalizedSuggestion === normalizedAnswerFr || normalizedSuggestion === normalizedAnswerEn,
        exactMatch: suggestion.toLowerCase() === pokemonNameFr.toLowerCase() || suggestion.toLowerCase() === pokemonNameEn.toLowerCase()
      });
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

  // Update handleGuessChange to use pokemonNames
  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (guessTimeLeft <= 0) return;
    
    const value = e.target.value;
    setGuess(capitalize(value));
    setHighlightedIndex(0);
    
    if (value.length > 0) {
      const normalizedValue = normalizeText(value);
      console.log('Input value:', value);
      console.log('Normalized value:', normalizedValue);
      
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

      console.log('Filtered suggestions:', filteredSuggestions);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
      setHighlightedIndex(-1);
    }
  };

  // Add a function to clean up all audio instances
  const cleanupAllAudio = () => {
    // Clean up victory audio
    if (victoryAudioRef.current) {
      victoryAudioRef.current.pause();
      victoryAudioRef.current.currentTime = 0;
    }
    // Clean up correct audio
    if (correctAudioRef.current) {
      correctAudioRef.current.pause();
      correctAudioRef.current.currentTime = 0;
    }
    // Clean up wrong audio
    if (wrongAudioRef.current) {
      wrongAudioRef.current.pause();
      wrongAudioRef.current.currentTime = 0;
    }
    // Clean up train horn audio
    if (trainHornRef.current) {
      trainHornRef.current.pause();
      trainHornRef.current.currentTime = 0;
    }
    // Clean up low life audio
    if (lowLifeAudioRef.current) {
      lowLifeAudioRef.current.pause();
      lowLifeAudioRef.current.currentTime = 0;
    }
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
      console.log('🚂 Timer hit 9 seconds, stopping Hype Train');
      // Add bonus points based on consecutive fast answers before resetting
      if (showHypeTrain && consecutiveFastAnswers > 0) {
        const bonusPoints = consecutiveFastAnswers;
        console.log(`🎯 Adding bonus points: ${bonusPoints}`);
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
        console.log('🔇 Stopping train horn sound at timer 9');
        trainHornRef.current.pause();
        trainHornRef.current.currentTime = 0;
        trainHornRef.current = null;
      }
    }
  }, [guessTimeLeft, showHypeTrain, consecutiveFastAnswers]);

  // Add effect to stop train horn when game is over or when Hype Train should stop
  useEffect(() => {
    if (!showHypeTrain && trainHornRef.current) {
      console.log('🔇 Stopping train horn sound on Hype Train end');
      trainHornRef.current.pause();
      trainHornRef.current.currentTime = 0;
      trainHornRef.current = null;
    }
  }, [showHypeTrain]);

  // Add separate effect for game over cleanup
  useEffect(() => {
    if (gameOver && trainHornRef.current) {
      console.log('🔇 Stopping train horn sound on game over');
      trainHornRef.current.pause();
      trainHornRef.current.currentTime = 0;
      trainHornRef.current = null;
    }
  }, [gameOver]);

  // Add effect to handle train horn sound
  useEffect(() => {
    if (showHypeTrain && !isMuted && !trainHornRef.current) {
      console.log('🔊 Starting train horn sound');
      const trainHorn = new Audio(TRAIN_HORN_URL);
      trainHorn.volume = 0.05;
      trainHorn.loop = true;
      trainHornRef.current = trainHorn;
      trainHorn.play().catch(error => {
        console.error('❌ Error playing train horn sound:', error);
      });
    } else if (!showHypeTrain && trainHornRef.current) {
      console.log('🔇 Stopping train horn sound');
      trainHornRef.current.pause();
      trainHornRef.current.currentTime = 0;
      trainHornRef.current = null;
    }
  }, [showHypeTrain, isMuted]);

  // Add cleanup effect
  useEffect(() => {
    return () => {
      if (trainHornRef.current) {
        trainHornRef.current.pause();
        trainHornRef.current.currentTime = 0;
        trainHornRef.current = null;
      }
    };
  }, []);

  // Update effect to handle low life sound
  useEffect(() => {
    // Start playing when conditions are met
    if (isHardMode && guessTimeLeft === 5 && !isMuted && !gameOver && isCorrect === null) {
      console.log('🔊 Playing low life sound');
      // Clean up any existing low life sound first
      if (lowLifeAudioRef.current) {
        lowLifeAudioRef.current.pause();
        lowLifeAudioRef.current.currentTime = 0;
        lowLifeAudioRef.current = null;
      }
      lowLifeAudioRef.current = new Audio(LOW_LIFE_URL);
      lowLifeAudioRef.current.volume = 0.5;
      lowLifeAudioRef.current.play().catch(error => {
        console.error('❌ Error playing low life sound:', error);
      });
    }
    
    // Stop playing in any case where it shouldn't be playing
    if (lowLifeAudioRef.current && (
      !isHardMode || // Not in hard mode
      guessTimeLeft > 5 || // Time above danger zone
      guessTimeLeft <= 0 || // Time ran out
      isMuted || // Sound is muted
      gameOver || // Game is over
      isCorrect !== null // Answer was validated (correct or incorrect)
    )) {
      console.log('🔇 Stopping low life sound, reason:', {
        notHardMode: !isHardMode,
        timeAbove5: guessTimeLeft > 5,
        timeUp: guessTimeLeft <= 0,
        muted: isMuted,
        gameOver: gameOver,
        answerValidated: isCorrect !== null
      });
      lowLifeAudioRef.current.pause();
      lowLifeAudioRef.current.currentTime = 0;
      lowLifeAudioRef.current = null;
    }
  }, [guessTimeLeft, isHardMode, isMuted, gameOver, isCorrect]);

  // Add cleanup effect for low life sound
  useEffect(() => {
    return () => {
      if (lowLifeAudioRef.current) {
        lowLifeAudioRef.current.pause();
        lowLifeAudioRef.current = null;
      }
    };
  }, []);

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
    console.log('✅ Handling correct answer');
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
        console.log('🚂 Fast answer! New count:', newCount);
        
        // Start Hype Train when reaching 3 or more
        if (newCount >= 3) {
          console.log('🚂 Starting Hype Train!');
          setShowHypeTrain(true);
          setMaxHypeChain(prev => Math.max(prev, newCount));
        }
        return newCount;
      });
    } else {
      console.log('🚂 Slow answer or not in hard mode, resetting Hype Train');
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
      console.log('🎵 About to play correct answer sound');
      correctAudioRef.current = new Audio(CORRECT_SOUND_URL);
      try {
        await correctAudioRef.current.play();
        console.log('✅ Correct answer sound played successfully');
      } catch (error) {
        console.error('❌ Error playing correct sound:', error);
      }
    }
    
    // Remove the current Pokemon from remainingPokemon
    if (currentPokemon) {
      console.log('🔄 Current remaining Pokémon:', remainingPokemon.length);
      setRemainingPokemon(prev => {
        const newRemaining = prev.filter(id => id !== currentPokemon.id);
        console.log('🔄 New remaining Pokémon:', newRemaining.length);
        return newRemaining;
      });
    }
    
    // Check if this was the last Pokémon
    const isLastPokemon = remainingPokemon.length <= 1;
    console.log('🔄 Checking if last Pokémon:', { isLastPokemon, remainingCount: remainingPokemon.length });
    
    if (isLastPokemon) {
      console.log('🎮 Last Pokémon found! Showing name for 1.5s before game over...');
      setTimeout(() => {
        console.log('🎮 Triggering game over sequence...');
        handleGameOver();
      }, 1500);
    } else {
      console.log('🔄 Step 1: Starting transition sequence - showing correct answer for 1 second');
      // 1. Show the correct answer for 1 second
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      console.log('🔄 Step 2: Clearing current Pokemon to show loading state');
      // 2. Clear current Pokemon and set loading state
      setCurrentPokemonId(null);
      setIsCorrect(null);
      setGuess('');
      setSuggestions([]);
      setShowHint(false);
      
      // Wait for states to be cleared
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('🔄 Step 3: Waiting for loading state (300ms)');
      // 3. Wait for loading state to be visible
      await new Promise(resolve => setTimeout(resolve, 300));
      
      console.log('🔄 Step 4: Selecting next Pokemon');
      // 4. Select next Pokemon
      const nextPokemonId = remainingPokemon[Math.floor(Math.random() * remainingPokemon.length)];
      console.log('🎯 Selected next Pokémon:', nextPokemonId);
      
      console.log('🔄 Step 5: Updating remaining pool');
      // 5. Update remaining pool
      setRemainingPokemon(prev => prev.filter(id => id !== nextPokemonId));
      
      // Wait for remaining pool to update
      await new Promise(resolve => setTimeout(resolve, 50));
      
      console.log('🔄 Step 6: Setting new Pokemon');
      // 6. Set new Pokemon
      setCurrentPokemonId(nextPokemonId);
      
      console.log('🔄 Step 7: Focusing input');
      // 7. Focus input
      inputRef.current?.focus();
      
      console.log('🔄 Transition sequence completed');
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
      console.log('⚠️ Invalid Pokémon data detected:', {
        currentPokemonId,
        currentPokemon,
        isLoading: isPokemonLoading,
        remainingCount: remainingPokemon.length
      });
      // Reset the current Pokemon ID to trigger a new fetch
      setCurrentPokemonId(null);
      // Add the ID back to the remaining pool
      setRemainingPokemon(prev => [...prev, currentPokemonId]);
    }
  }, [currentPokemon, currentPokemonId, isGameActive, isPokemonLoading, remainingPokemon.length]);

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
    
    console.log('🎮 Starting game over sequence');
    // Stop timers first
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    if (totalTimeInterval.current) {
      clearInterval(totalTimeInterval.current);
      totalTimeInterval.current = null;
    }

    // Show the correct Pokemon first
    setIsCorrect(true);
    
    // Wait for the reveal animation and give time to see the name
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update states
    setIsGameActive(false);
    setGameOver(true);
    
    // Calculate reward Pokemon only if not all Pokémon were found
    if (remainingPokemon.length > 0) {
      await calculateRewardPokemon(score);
    }
    
    // Small delay to ensure state updates are processed
    await new Promise(resolve => setTimeout(resolve, 50));
    
    // Then handle audio
    if (!isMuted) {
      cleanupAllAudio();

      // Play reward Pokemon cry first if available and not all Pokémon were found
      if (rewardPokemon.pokemon && remainingPokemon.length > 0) {
        console.log('🎵 About to play reward Pokemon cry');
        const [latestCry, legacyCry] = rewardPokemon.pokemon.cryUrl.split('|');
        console.log('🔊 Playing cry URL:', latestCry);
        const cryAudio = new Audio(latestCry || legacyCry);
        try {
          await cryAudio.play();
          console.log('✅ Reward Pokemon cry played successfully');
          // Wait for cry to finish
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('❌ Error playing reward Pokemon cry:', error);
        }
      }

      // Then play victory sound
      console.log('🎉 About to play victory sound');
      victoryAudioRef.current = new Audio(VICTORY_SOUND_URL);
      try {
        await victoryAudioRef.current.play();
        console.log('✅ Victory sound played successfully');
      } catch (error) {
        console.error('❌ Error playing victory sound:', error);
      }
    }

    // Only update best score and save to rankings in Hard mode
    if (isHardMode) {
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
    } else {
      // In Chill mode, just display the score without saving
      setUserRanking(null);
    }
  }, [score, playerName, selectedGeneration, totalTimeElapsed, gameOver, fetchSelectedRankings, bestScore, setBestScore, setBestTime, isMuted, calculateRewardPokemon, isHardMode, rewardPokemon, remainingPokemon.length]);

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

  // Update checkNameAvailability to handle loading state
  const checkNameAvailability = useCallback(async (name: string) => {
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

    setIsCheckingName(true);
    try {
      // Check across all generations using exact name match
      for (const gen of GENERATIONS) {
        const collectionName = `rankings_gen${gen.startId}_${gen.endId}`;
        const rankingsRef = collection(db, collectionName);
        const q = query(rankingsRef, where('name', '==', name));
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

  // Update handlePlayerNameChange to preserve exact name format
  const handlePlayerNameChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName); // Store the exact name as entered
    
    if (!newName.trim()) {
      setNameError(null);
      localStorage.removeItem('pokemonGamePlayerName');
      return;
    }
    
    debouncedCheckName(newName);
  }, [debouncedCheckName]);

  // Add isRestarting state
  const [isRestarting, setIsRestarting] = useState(false);

  // Update the startGame function
  const startGame = async (isHardMode: boolean) => {
    console.log('🎮 Starting new game in', isHardMode ? 'Hard Mode' : 'Chill Mode');
    if (!playerName) return;
    
    const isAvailable = await checkNameAvailability(playerName);
    if (!isAvailable) return;
    
    setIsRestarting(true);
    setIsHardMode(isHardMode);
    setConsecutiveFastAnswers(0);
    setShowHypeTrain(false);
    setPointsEarned(0);
    
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
    // In Chill mode, set hints to Infinity, in Hard mode set to 0
    setHintsLeft(isHardMode ? 0 : Infinity);
    setShowHint(false);
    setIsCorrect(null);
    setGuess('');
    setSuggestions([]);
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
    console.log('🔄 Initializing Pokémon pool with', allPokemonIds.length, 'Pokémon');
    
    // Set initial state and wait for it to be updated
    setRemainingPokemon(allPokemonIds);
    
    // Add a delay to ensure state is updated
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Set game active and clear restarting state
    setIsGameActive(true);
    setIsRestarting(false);
    
    // Start timers based on game mode
    if (isHardMode) {
      startGuessTimer();
    }
    startTotalTimer();
    
    // Start the game by fetching first Pokemon
    console.log('🎯 Starting game with', allPokemonIds.length, 'Pokémon to find');
    // Use the allPokemonIds directly for the first fetch
    const randomIndex = Math.floor(Math.random() * allPokemonIds.length);
    const firstPokemonId = allPokemonIds[randomIndex];
    console.log('🎲 Selected first Pokémon:', firstPokemonId);
    setCurrentPokemonId(firstPokemonId);
    
    // Remove the first Pokémon from the pool after setting it
    setRemainingPokemon(prev => prev.filter(id => id !== firstPokemonId));
    
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
      console.log('👤 Loaded saved player name:', savedName);
      setPlayerName(savedName);
      setNameError(null); // Clear any errors since this is a valid saved name
      // Validate the name immediately to ensure it's available
      checkNameAvailability(savedName).then(isAvailable => {
        if (!isAvailable) {
          console.log('❌ Saved name is no longer available:', savedName);
          localStorage.removeItem('pokemonGamePlayerName');
          setPlayerName('');
          setNameError('Ce nom est déjà utilisé. Veuillez en choisir un autre.');
        } else {
          console.log('✅ Saved name is valid and available:', savedName);
        }
      });
    } else {
      console.log('ℹ️ No saved player name found');
    }
  }, [checkNameAvailability]); // Add checkNameAvailability to dependencies

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
    
    // Start a new game with the same mode
    startGame(isHardMode);
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
      console.log('✨ Loaded Pokémon data:', {
        id: currentPokemon.id,
        frenchName: currentPokemon.frenchName,
        englishName: currentPokemon.englishName,
        isShiny: currentPokemon.isShiny,
        sprite: currentPokemon.sprite,
        evolutionStage: currentPokemon.evolutionStage,
        isLegendary: currentPokemon.isLegendary,
        isMythical: currentPokemon.isMythical,
        hasEvolution: currentPokemon.hasEvolution,
        cryUrl: currentPokemon.cryUrl
      });
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
      console.log('🔊 Starting train horn sound');
      trainHornRef.current = new Audio(TRAIN_HORN_URL);
      trainHornRef.current.volume = 0.05;
      trainHornRef.current.loop = true;
      trainHornRef.current.play().catch(error => {
        console.error('❌ Error playing train horn sound:', error);
      });
    } else if (!showHypeTrain && trainHornRef.current) {
      console.log('🔇 Stopping train horn sound');
      trainHornRef.current.pause();
      trainHornRef.current.currentTime = 0;
      trainHornRef.current = null;
    }

    // Handle low life sound
    if (isHardMode && guessTimeLeft === 5 && !isMuted && !gameOver && isCorrect === null) {
      console.log('🔊 Playing low life sound');
      // Clean up any existing low life sound first
      if (lowLifeAudioRef.current) {
        lowLifeAudioRef.current.pause();
        lowLifeAudioRef.current.currentTime = 0;
        lowLifeAudioRef.current = null;
      }
      lowLifeAudioRef.current = new Audio(LOW_LIFE_URL);
      lowLifeAudioRef.current.volume = 0.5;
      lowLifeAudioRef.current.play().catch(error => {
        console.error('❌ Error playing low life sound:', error);
      });
    } else if (lowLifeAudioRef.current && (
      !isHardMode || 
      guessTimeLeft > 5 || 
      guessTimeLeft <= 0 || 
      isMuted || 
      gameOver || 
      isCorrect !== null
    )) {
      console.log('🔇 Stopping low life sound, reason:', {
        notHardMode: !isHardMode,
        timeAbove5: guessTimeLeft > 5,
        timeUp: guessTimeLeft <= 0,
        muted: isMuted,
        gameOver: gameOver,
        answerValidated: isCorrect !== null
      });
      lowLifeAudioRef.current.pause();
      lowLifeAudioRef.current.currentTime = 0;
      lowLifeAudioRef.current = null;
    }
  }, [showHypeTrain, isMuted, isHardMode, guessTimeLeft, gameOver, isCorrect]);

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
