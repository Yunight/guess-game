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
import { useDebounce } from '@/hooks/useDebounce';

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
  { minScore: 3000, condition: (pokemon: Pokemon) => pokemon.isMythical && pokemon.name === 'mew' },
  { minScore: 2500, condition: (pokemon: Pokemon) => pokemon.isMythical && pokemon.name === 'celebi' },
  { minScore: 2000, condition: (pokemon: Pokemon) => pokemon.isMythical },
  { minScore: 1500, condition: (pokemon: Pokemon) => pokemon.isLegendary && ['mewtwo', 'lugia', 'ho-oh'].includes(pokemon.name) },
  { minScore: 1200, condition: (pokemon: Pokemon) => pokemon.isLegendary },
  { minScore: 900, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 3 && !pokemon.isLegendary && !pokemon.isMythical },
  { minScore: 600, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 2 && !pokemon.isLegendary && !pokemon.isMythical },
  { minScore: 400, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 1 && !pokemon.hasEvolution && !pokemon.isLegendary && !pokemon.isMythical },
  { minScore: 0, condition: (pokemon: Pokemon) => pokemon.evolutionStage === 1 && pokemon.hasEvolution && !pokemon.isLegendary && !pokemon.isMythical },
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
  const canStartGame = Boolean(playerName && !nameError);
  
  // Add loading progress state
  const [loadingProgress, setLoadingProgress] = useState(0);
  
  // Use RTK Query hooks with proper typing
  const { 
    data: allPokemonNames = [],
    isLoading: isNamesLoading
  } = useGetAllPokemonNamesQuery();

  // Add loading progress effect
  useEffect(() => {
    if (isNamesLoading) {
      let progress = 0;
      const interval = setInterval(() => {
        progress += 5;
        if (progress > 90) {
          clearInterval(interval);
          return;
        }
        setLoadingProgress(progress);
      }, 100);

      return () => clearInterval(interval);
    }
  }, [isNamesLoading]);

  const { 
    data: currentPokemon,
    isLoading: isPokemonLoading 
  } = useGetPokemonByIdQuery(currentPokemonId ?? skipToken, {
    skip: !currentPokemonId || !isGameActive,
  });

  const { data: allPokemonData = [] } = useGetAllPokemonNamesQuery();

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
    console.log(`🎯 Selected generation range: ${selectedGeneration.startId} - ${selectedGeneration.endId}`);

    try {
      // Find the appropriate tier based on score
      const tier = POKEMON_REWARDS.find(tier => score >= tier.minScore);
      console.log('🏆 Selected tier:', tier ? `Score ${tier.minScore}+` : 'No tier found');

      if (!tier) {
        console.log('⚠ No tier found, selecting random basic Pokémon');
        const basicPokemon = allPokemonData.filter(pokemon => 
          pokemon.id >= selectedGeneration.startId && 
          pokemon.id <= selectedGeneration.endId &&
          pokemon.evolvesFromSpecies === null && 
          pokemon.hasEvolution
        );
        
        console.log(` Found ${basicPokemon.length} basic Pokémon in generation`);
        
        if (basicPokemon.length === 0) {
          console.log('❌ No basic Pokémon found in generation');
          setRewardPokemon({
            pokemon: undefined,
            isLoading: false
          });
          return;
        }
        
        const randomBasic = basicPokemon[Math.floor(Math.random() * basicPokemon.length)];
        
        // Fetch additional species data
        try {
          const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${randomBasic.id}`);
          const speciesData = await speciesResponse.json();
          
          // Update the Pokemon object with additional data
          const enhancedPokemon = {
            ...randomBasic,
            genera: speciesData.genera,
            flavor_text_entries: speciesData.flavor_text_entries,
            color: speciesData.color,
            shape: speciesData.shape,
            habitat: speciesData.habitat,
            growth_rate: speciesData.growth_rate,
            capture_rate: speciesData.capture_rate,
            base_happiness: speciesData.base_happiness,
          };
          
          console.log('✨ Selected basic Pokémon with species data:', {
            id: enhancedPokemon.id,
            name: enhancedPokemon.frenchName,
            isLegendary: enhancedPokemon.isLegendary,
            isMythical: enhancedPokemon.isMythical,
            evolutionStage: enhancedPokemon.evolutionStage,
            color: enhancedPokemon.color?.name,
            capture_rate: enhancedPokemon.capture_rate
          });
          
          setRewardPokemon({
            pokemon: enhancedPokemon,
            isLoading: false
          });
        } catch (error) {
          console.error('Error fetching species data:', error);
          setRewardPokemon({
            pokemon: randomBasic,
            isLoading: false
          });
        }
        return;
      }

      // Filter Pokémon based on the tier condition and selected generation
      const eligiblePokemon = allPokemonData.filter(pokemon => 
        tier.condition(pokemon) && 
        pokemon.id >= selectedGeneration.startId && 
        pokemon.id <= selectedGeneration.endId
      );

      console.log(`📝 Found ${eligiblePokemon.length} eligible Pokémon in tier`);
      
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
            
            // Fetch additional species data
            try {
              const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${randomPokemon.id}`);
              const speciesData = await speciesResponse.json();
              
              // Update the Pokemon object with additional data
              const enhancedPokemon = {
                ...randomPokemon,
                genera: speciesData.genera,
                flavor_text_entries: speciesData.flavor_text_entries,
                color: speciesData.color,
                shape: speciesData.shape,
                habitat: speciesData.habitat,
                growth_rate: speciesData.growth_rate,
                capture_rate: speciesData.capture_rate,
                base_happiness: speciesData.base_happiness,
              };
              
              console.log('✨ Selected Pokémon from lower tier with species data:', {
                id: enhancedPokemon.id,
                name: enhancedPokemon.frenchName,
                isLegendary: enhancedPokemon.isLegendary,
                isMythical: enhancedPokemon.isMythical,
                evolutionStage: enhancedPokemon.evolutionStage,
                color: enhancedPokemon.color?.name,
                capture_rate: enhancedPokemon.capture_rate
              });
              
              setRewardPokemon({
                pokemon: enhancedPokemon,
                isLoading: false
              });
              return;
            } catch (error) {
              console.error('Error fetching species data:', error);
              setRewardPokemon({
                pokemon: randomPokemon,
                isLoading: false
              });
              return;
            }
          }
        }
        
        console.log('⚠️ No Pokémon found in any tier, selecting random from generation');
        const generationPokemon = allPokemonData.filter(pokemon => 
          pokemon.id >= selectedGeneration.startId && 
          pokemon.id <= selectedGeneration.endId
        );
        
        console.log(`📝 Found ${generationPokemon.length} Pokémon in generation`);
        
        const randomPokemon = generationPokemon[Math.floor(Math.random() * generationPokemon.length)];
        
        // Fetch additional species data
        try {
          const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${randomPokemon.id}`);
          const speciesData = await speciesResponse.json();
          
          // Update the Pokemon object with additional data
          const enhancedPokemon = {
            ...randomPokemon,
            genera: speciesData.genera,
            flavor_text_entries: speciesData.flavor_text_entries,
            color: speciesData.color,
            shape: speciesData.shape,
            habitat: speciesData.habitat,
            growth_rate: speciesData.growth_rate,
            capture_rate: speciesData.capture_rate,
            base_happiness: speciesData.base_happiness,
          };
          
          console.log('✨ Selected random Pokémon with species data:', {
            id: enhancedPokemon.id,
            name: enhancedPokemon.frenchName,
            isLegendary: enhancedPokemon.isLegendary,
            isMythical: enhancedPokemon.isMythical,
            evolutionStage: enhancedPokemon.evolutionStage,
            color: enhancedPokemon.color?.name,
            capture_rate: enhancedPokemon.capture_rate
          });
          
          setRewardPokemon({
            pokemon: enhancedPokemon,
            isLoading: false
          });
          return;
        } catch (error) {
          console.error('Error fetching species data:', error);
          setRewardPokemon({
            pokemon: randomPokemon,
            isLoading: false
          });
          return;
        }
      }
      
      // Pick a random Pokémon from the eligible ones
      const randomPokemon = eligiblePokemon[Math.floor(Math.random() * eligiblePokemon.length)];
      
      // Fetch additional species data
      try {
        const speciesResponse = await fetch(`https://pokeapi.co/api/v2/pokemon-species/${randomPokemon.id}`);
        const speciesData = await speciesResponse.json();
        
        // Update the Pokemon object with additional data
        const enhancedPokemon = {
          ...randomPokemon,
          genera: speciesData.genera,
          flavor_text_entries: speciesData.flavor_text_entries,
          color: speciesData.color,
          shape: speciesData.shape,
          habitat: speciesData.habitat,
          growth_rate: speciesData.growth_rate,
          capture_rate: speciesData.capture_rate,
          base_happiness: speciesData.base_happiness,
        };
        
        console.log('✨ Selected Pokémon from eligible tier with species data:', {
          id: enhancedPokemon.id,
          name: enhancedPokemon.frenchName,
          isLegendary: enhancedPokemon.isLegendary,
          isMythical: enhancedPokemon.isMythical,
          evolutionStage: enhancedPokemon.evolutionStage,
          color: enhancedPokemon.color?.name,
          capture_rate: enhancedPokemon.capture_rate
        });
        
        setRewardPokemon({
          pokemon: enhancedPokemon,
          isLoading: false
        });
      } catch (error) {
        console.error('Error fetching species data:', error);
        setRewardPokemon({
          pokemon: randomPokemon,
          isLoading: false
        });
      }
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

  const handleSuggestionClick = async (suggestion: string) => {
    if (guessTimeLeft <= 0) return;
    
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

  const handleGuessChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (guessTimeLeft <= 0) return;
    
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
  const TRAIN_HORN_URL = '/sounds/train_horn_bell.mp3';
  const LOW_LIFE_URL = '/sounds/low_life.mp3';

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
    if (trainHornRef.current) {
      trainHornRef.current.pause();
      trainHornRef.current = null;
    }
    if (lowLifeAudioRef.current) {
      lowLifeAudioRef.current.pause();
      lowLifeAudioRef.current = null;
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
      isCorrect !== null // Answer was validated
    )) {
      console.log('🔇 Stopping low life sound');
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

  // Update handleCorrectAnswer to track max chain
  const handleCorrectAnswer = async () => {
    console.log('✅ Handling correct answer');
    setIsCorrect(true);
    
    // Stop the timer immediately to preserve the current time for points calculation
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
      timerInterval.current = null;
    }
    
    // Handle Hype Train logic first, independently of other messages
    if (guessTimeLeft >= 10) { // Within 5 seconds (15-10 = 5)
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
      console.log('🚂 Slow answer, resetting Hype Train');
      setConsecutiveFastAnswers(0);
      setShowHypeTrain(false);
    }

    let earnedPoints = 0;

    // Calculate points based on remaining time in Hard mode
    if (isHardMode) {
      if (guessTimeLeft >= 10 && guessTimeLeft <= 15) {
        earnedPoints = 3;
      } else if (guessTimeLeft >= 5 && guessTimeLeft <= 9) {
        earnedPoints = 2;
      } else if (guessTimeLeft >= 0 && guessTimeLeft <= 4) {
        earnedPoints = 1;
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
        }
        // Show Coup Critique with 20% chance
        else if (Math.random() < 0.2) {
          setShowCriticalHit(true);
          setCriticalHitCount(prev => prev + 1);
          setTimeout(() => {
            setShowCriticalHit(false);
          }, 2000);
        }
      }
    } else {
      earnedPoints = 1;
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
    
    // Only proceed to next Pokémon if there's time left
    if (guessTimeLeft > 0) {
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
    }
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

    // Show the correct Pokemon first
    setIsCorrect(true);
    
    // Wait for the reveal animation and give time to see the name
    await new Promise(resolve => setTimeout(resolve, 3000));

    // Update states
    setIsGameActive(false);
    setGameOver(true);
    
    // Calculate reward Pokemon
    await calculateRewardPokemon(score);
    
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
  }, [score, playerName, selectedGeneration, totalTimeElapsed, gameOver, fetchSelectedRankings, bestScore, setBestScore, setBestTime, isMuted, calculateRewardPokemon, isHardMode]);

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

  // Add debounced name validation
  const debouncedCheckName = useDebounce(async (name: string) => {
    if (name.trim()) {
      await checkNameAvailability(name);
    }
  }, 500);

  // Update handlePlayerNameChange to use debounced validation
  const handlePlayerNameChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const newName = e.target.value;
    setPlayerName(newName);
    
    if (!newName.trim()) {
      setNameError(null);
      localStorage.removeItem('pokemonGamePlayerName');
      return;
    }
  };

  // Add effect to trigger debounced validation when name changes
  useEffect(() => {
    debouncedCheckName(playerName);
  }, [playerName, debouncedCheckName]);

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
    
    console.log(' Resetting current Pokemon');
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
    
    // Start timers based on game mode
    if (isHardMode) {
      startGuessTimer();
    }
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
          // Just set isCorrect to false and don't fetch next Pokémon
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

  // Add loading state
  const [isInitialLoading, setIsInitialLoading] = useState(true);

  // Update effect to handle initial loading and set final progress
  useEffect(() => {
    if (!isNamesLoading && allPokemonNames.length > 0) {
      setLoadingProgress(100);
      // Add a small delay before hiding the loading screen
      setTimeout(() => {
        setIsInitialLoading(false);
      }, 500);
    }
  }, [isNamesLoading, allPokemonNames]);

  // Add handleQuit function
  const handleQuit = useCallback(() => {
    handleGameOver();
  }, [handleGameOver]);

  const handleRestart = () => {
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
    fetchRandomPokemon();
    startGuessTimer();
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

  // Update loading screen component
  if (isInitialLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-blue-100 to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="relative w-24 h-24 mx-auto">
            <div className="pokeball-loading scale-150">
              <div className="outer-circle" />
              <div className="center-circle" />
            </div>
          </div>
          <div className="text-xl font-medium text-gray-700">
            Chargement des Pokémons...
          </div>
          <div className="text-sm text-gray-500">
            {loadingProgress}%
          </div>
          <div className="w-64 h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${loadingProgress}%` }}
            />
          </div>
        </div>
      </div>
    );
  }

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
        totalPokemonCount={remainingPokemon.length}
        handleRestart={handleRestart}
        handleBackToMenu={handleBackToMenu}
        isMuted={isMuted}
        criticalHitCount={criticalHitCount}
        criticalSuccessCount={criticalSuccessCount}
        hyperTrainCount={hyperTrainCount}
        maxHypeChain={maxHypeChain}
      />
    </div>
  );
};

export default PokemonGame;
