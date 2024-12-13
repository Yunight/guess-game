import { useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { collection, getDocs, addDoc, query, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { db } from '../firebase';
import '../styles/PokemonGame.css';

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
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [guess, setGuess] = useState('');
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState(0);
  const [showHint, setShowHint] = useState(false);
  const [hintsLeft, setHintsLeft] = useState(MAX_HINTS);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isGameActive, setIsGameActive] = useState(false);
  const [playerName, setPlayerName] = useState('');
  const [selectedGeneration, setSelectedGeneration] = useState<Generation>(GENERATIONS[0]);
  const [selectedRankingGen, setSelectedRankingGen] = useState<Generation>(GENERATIONS[0]);
  const [remainingPokemon, setRemainingPokemon] = useState<number[]>([]);
  const [rankings, setRankings] = useState<Player[]>([]);
  const [allGenerationRankings, setAllGenerationRankings] = useState<{ [key: string]: Player[] }>({});
  const [gameOver, setGameOver] = useState(false);
  const [allPokemonNames, setAllPokemonNames] = useState<string[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [userRanking, setUserRanking] = useState<number | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const timerInterval = useRef<NodeJS.Timeout | null>(null);

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

  // Fetch all Pokemon names for the selected generation
  useEffect(() => {
    const fetchAllPokemonNames = async () => {
      try {
        const response = await axios.get(`https://pokeapi.co/api/v2/pokemon-species?limit=1000`);
        const namesPromises = response.data.results.map(async (pokemon: any) => {
          const speciesResponse = await axios.get(pokemon.url);
          const frenchName = speciesResponse.data.names.find(
            (name: any) => name.language.name === 'fr'
          )?.name || pokemon.name;
          return frenchName;
        });

        const names = await Promise.all(namesPromises);
        setAllPokemonNames(names);
      } catch (error) {
        console.error('Error fetching Pokemon names:', error);
      }
    };

    if (selectedGeneration) {
      fetchAllPokemonNames();
    }
  }, [selectedGeneration]);

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
          // Check if the name belongs to the selected generation
          const pokemonId = allPokemonNames.indexOf(name) + 1; // Assuming names are in order starting from ID 1
          const generation = GENERATIONS.find(gen =>
            pokemonId >= gen.startId && pokemonId <= gen.endId
          );
          console.log('Filtering suggestions:', {
            name,
            normalizedName,
            pokemonId,
            generation,
            startsWith: normalizedName.startsWith(normalizedValue)
          });
          return normalizedName.startsWith(normalizedValue) && generation;
        })
        .map(name => capitalize(name))
        .slice(0, 5);
      setSuggestions(filteredSuggestions);
    } else {
      setSuggestions([]);
    }
  };

  const correctSoundUrl = 'https://example.com/sounds/correct.mp3'; // Replace with actual sound URL

  const checkGuess = () => {
    if (!pokemon || !guess) return;

    const normalizedGuess = normalizeText(guess);
    const normalizedAnswer = normalizeText(pokemon.frenchName);

    // Only validate if the guess length matches the answer length
    if (normalizedGuess.length !== normalizedAnswer.length) {
      return;
    }

    if (normalizedGuess === normalizedAnswer) {
      // Play correct sound
      const audio = new Audio(correctSoundUrl);
      audio.play();
      setIsCorrect(true);
      setScore(prev => prev + 1);
      setTimeout(() => {
        setIsCorrect(null);
        setGuess('');
        setSuggestions([]);
        setShowHint(false);
        fetchRandomPokemon();
      }, 1500);
    } else {
      setIsCorrect(false);
      setTimeout(() => {
        setIsCorrect(null);
      }, 1000);
    }
  };

const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
        setHighlightedIndex((prevIndex) => {
            const newIndex = Math.min(prevIndex + 1, suggestions.length - 1);
            console.log('Highlighted Index (Down):', newIndex);
            return newIndex;
        });
    } else if (e.key === 'ArrowUp') {
        setHighlightedIndex((prevIndex) => {
            const newIndex = Math.max(prevIndex - 1, 0);
            console.log('Highlighted Index (Up):', newIndex);
            return newIndex;
        });
    } else if (e.key === 'Enter') {
        if (highlightedIndex >= 0) {
            console.log('Selected Suggestion:', suggestions[highlightedIndex]);
            handleSuggestionClick(suggestions[highlightedIndex]);
        }
    }
};

  const handleSuggestionClick = (suggestion: string) => {
    setGuess(suggestion);
    setSuggestions([]);
    
    // Since we're selecting from suggestions, we know it's a complete name
    const normalizedSuggestion = normalizeText(suggestion);
    const normalizedAnswer = normalizeText(pokemon?.frenchName || '');
    
    if (normalizedSuggestion === normalizedAnswer) {
      console.log('Correct answer from suggestion!');
      setIsCorrect(true);
      setScore(prev => prev + 1);
      setTimeout(() => {
        setIsCorrect(null);
        setGuess('');
        setSuggestions([]);
        setShowHint(false);
        fetchRandomPokemon();
      }, 1500);
    } else {
      console.log('Wrong answer from suggestion!');
      setIsCorrect(false);
      setTimeout(() => {
        setIsCorrect(null);
      }, 1000);
    }
  };

  const useHint = () => {
    if (hintsLeft > 0 && pokemon) {
      setShowHint(true);
      setHintsLeft(prev => prev - 1);
    }
  };

  const fetchRandomPokemon = async () => {
    if (remainingPokemon.length === 0) {
      handleGameOver();
      return;
    }

    const randomIndex = Math.floor(Math.random() * remainingPokemon.length);
    const pokemonId = remainingPokemon[randomIndex];

    try {
      console.log('Fetching Pokemon:', pokemonId);
      // Fetch Pokemon data
      const response = await axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`);
      const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`);

      // Get French name and flavor text
      const frenchName = capitalize(
        speciesResponse.data.names.find(
          (name: any) => name.language.name === 'fr'
        )?.name || response.data.name
      );

      console.log('French name:', frenchName);

      const frenchFlavorText = speciesResponse.data.flavor_text_entries
        .find((entry: any) => entry.language.name === 'fr')
        ?.flavor_text.replace(/\\n|\\f/g, ' ')
        .replace(new RegExp(frenchName, 'gi'), '_____') || '';

      // Get cry URL
      const cryUrl = `https://play.pokemonshowdown.com/audio/cries/${response.data.name.toLowerCase()}.mp3`;

      const newPokemon: Pokemon = {
        id: pokemonId,
        name: response.data.name,
        frenchName: frenchName,
        imageUrl: response.data.sprites.other['official-artwork'].front_default,
        flavorText: frenchFlavorText,
        cryUrl: cryUrl
      };

      console.log('New Pokemon:', newPokemon);

      setPokemon(newPokemon);
      setRemainingPokemon(prev => prev.filter(id => id !== pokemonId));

      // Play cry if sound is not muted
      if (!isSoundMuted && newPokemon.cryUrl) {
        const audio = new Audio(newPokemon.cryUrl);
        audioRef.current = audio;
        try {
          await audio.play();
        } catch (error) {
          console.error('Error playing sound:', error);
        }
      }

    } catch (error) {
      console.error('Error fetching Pokemon:', error);
      // Try another Pokemon if this one fails
      setRemainingPokemon(prev => prev.filter(id => id !== pokemonId));
      fetchRandomPokemon();
    }
  };

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

const saveScore = useCallback(async () => {
    if (!playerName || score === 0) return;

    try {
        const rankingsRef = collection(db, `rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`);
        await addDoc(rankingsRef, {
            name: playerName,
            score: score,
            time: GAME_TIME - (timeLeft || 0),
            timestamp: serverTimestamp() // Ensure timestamp is included
        });
        await fetchSelectedRankings(); // Fetch updated rankings after saving
    } catch (error) {
        console.error('Error saving score:', error); // Log any errors
    }
}, [playerName, score, timeLeft, selectedGeneration]);

  const loadSelectedRankings = useCallback(() => {
    fetchSelectedRankings();
  }, [fetchSelectedRankings]);
  
  const startTimer = () => {
    setTimeLeft(120); // 2 minutes in seconds
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    timerInterval.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev === null || prev <= 0) {
          if (timerInterval.current) {
            clearInterval(timerInterval.current);
          }
          handleGameOver();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleGameOver = async () => {
    setIsGameActive(false);
    if (timerInterval.current) {
      clearInterval(timerInterval.current);
    }
    setTimeLeft(0);
    await saveScore();
    await loadSelectedRankings(); 
    const userRanking = rankings.findIndex(player => player.name === playerName) + 1; 
    setUserRanking(userRanking); 
    setGameOver(true); 
  };

  const startGame = () => {
    if (!playerName) return;
    
    setScore(0);
    setHintsLeft(10); 
    setIsGameActive(true);
    setShowHint(false);
    setIsCorrect(null);
    setGuess('');
    setSuggestions([]);
    setTimeLeft(120); 
    
    // Fetch rankings for the selected generation
    fetchSelectedRankings();

    // Initialize Pokémon list for selected generation
    const filteredIds = Array.from(
      { length: selectedGeneration.endId - selectedGeneration.startId + 1 },
      (_, i) => selectedGeneration.startId + i
    );
    setRemainingPokemon(filteredIds);

    // Start timer
    startTimer();

    // Fetch first Pokémon
    fetchRandomPokemon();
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

  const handleSkip = () => {
    if (!isGameActive) return;
    
    if (pokemon) {
      alert(`C'était ${pokemon.frenchName}!`);
    }
    setScore(prevScore => Math.max(0, prevScore - 1));
    setTimeout(fetchRandomPokemon, 1000);
  };

  const handleHintClick = () => {
    if (hintsLeft > 0) {
      setShowHint(true);
      setHintsLeft(prev => prev - 1);
    }
  };

  useEffect(() => {
      fetchSelectedRankings();
  }, [selectedGeneration]);

  const formatDate = (timestamp: any): string => {
    const date = new Date(timestamp);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are zero-based
    const year = date.getFullYear();
    return `${day} ${month} ${year}`;
};

  return (
    <div className="pokemon-game">
      {isGameActive ? (
        <div className="game-header">
          <div className="score">Score: {score}</div>
          <div className="remaining-pokemon">Pokémons restants: {remainingPokemon.length}</div>
          <div className="hints">Indices restants: {hintsLeft}</div>
          {timeLeft !== null && (
            <div className={`timer ${timeLeft <= 10 ? 'timer-warning' : ''}`}>
              {formatTime(timeLeft)}
            </div>
          )}
        </div>
      ) : (
        <div className="start-screen">
          <h1>Qui est ce Pokémon?</h1>
          <div className="start-options">
            <input
              type="text"
              placeholder="Entrez votre nom"
              className="player-input"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <select
              className="generation-select"
              value={JSON.stringify(selectedGeneration)}
              onChange={(e) => {
                const selectedGen = JSON.parse(e.target.value);
                setSelectedGeneration(selectedGen);
                fetchSelectedRankings(); // Fetch rankings for the selected generation
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
              disabled={!playerName}
              className="start-button"
            >
              {score > 0 ? 'Rejouer!' : 'Commencer!'}
            </button>
          </div>
          <div className="rankings">
            <h2>Meilleurs Scores - {selectedGeneration.name}</h2>
            <div className="rankings-list">
              {rankings.map((player, index) => (
                <div key={index} className="ranking-item">
                  <span className="rank">#{index + 1}</span>
                  <span className="player-name">{player.name}</span>
                  <span className="player-score">{player.score}</span>
                  <span className="player-date">{formatDate(player.timestamp)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {isGameActive && (
        <div className="game-screen">
          <div className="pokemon-container">
            {pokemon && (
              <img
                src={pokemon.imageUrl}
                alt="Pokemon mystère"
                className="pokemon-image"
                style={{ 
                  filter: isCorrect ? 'none' : 'brightness(0) saturate(100%)',
                  maxHeight: '100%',
                  width: 'auto'
                }}
              />
            )}
            <div className="guess-container">
              <div className="input-container" ref={suggestionsRef}>
                <input
                  type="text"
                  value={guess}
                  onChange={handleGuessChange}
                  onKeyDown={handleKeyDown}
                  placeholder="Qui est ce Pokémon?"
                  className="guess-input"
                  ref={inputRef}
                  disabled={isCorrect === true}
                />
                {suggestions.length > 0 && !isCorrect && (
                  <ul className="suggestions-list">
                    {suggestions.map((suggestion, index) => (
                      <li
                        key={index}
                        onClick={() => handleSuggestionClick(suggestion)}
                        className={`suggestion-item ${index === highlightedIndex ? 'highlighted' : ''}`}
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
                  className="hint-button"
                >
                  Indice ({hintsLeft})
                </button>
              )}
              {showHint && pokemon && (
                <div className="hint">
                  <p>Première lettre: {pokemon.frenchName[0].toUpperCase()}</p>
                  {pokemon.flavorText && (
                    <p className="flavor-text">{pokemon.flavorText}</p>
                  )}
                </div>
              )}
              {isCorrect === false && (
                <div className="wrong-answer">Essaie encore!</div>
              )}
            </div>
          </div>

        </div>
      )}
      {gameOver && (
        <div className="game-over">
          <h2>Partie terminée!</h2>
          <p>Nom: {playerName}</p>
          <p>Score final: {score}</p>
          <p>Classement: {userRanking !== null ? userRanking : 'Non classé'}</p>
          <p>Temps restant: {timeLeft} secondes</p>
          <div className="game-over-buttons">
            <button onClick={() => {
              setGameOver(false);
              startGame();
            }} className="replay-button">
              Rejouer
            </button>
            <button onClick={() => {
              setGameOver(false);
              setScore(0);
              setTimeLeft(GAME_TIME);
            }} className="menu-button">
              Menu Principal
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PokemonGame;
