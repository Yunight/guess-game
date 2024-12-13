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
  const [timeLeft, setTimeLeft] = useState(GAME_TIME);
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
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Capitalize first letter of a string
  const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  };

  // Fetch all Pokemon names for the selected generation
  useEffect(() => {
    const fetchAllPokemonNames = async () => {
      try {
        const names: string[] = [];
        for (let i = selectedGeneration.startId; i <= selectedGeneration.endId; i++) {
          const speciesResponse = await axios.get(`https://pokeapi.co/api/v2/pokemon-species/${i}`);
          const frenchName = speciesResponse.data.names.find(
            (name: { language: { name: string } }) => name.language.name === 'fr'
          )?.name || speciesResponse.data.name;
          names.push(capitalize(frenchName));
        }
        setAllPokemonNames(names);
      } catch (error) {
        console.error('Error fetching Pokemon names:', error);
      }
    };
    fetchAllPokemonNames();
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setGuess(capitalize(value));

    if (value.length > 0) {
      const filtered = allPokemonNames.filter(name => 
        name.toLowerCase().startsWith(value.toLowerCase())
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    setGuess(suggestion);
    setShowSuggestions(false);
    if (inputRef.current) {
      inputRef.current.focus();
    }
    handleGuess(suggestion);
  };

  const handleGuess = (forcedGuess?: string) => {
    if (!pokemon) return;
    
    const currentGuess = forcedGuess || guess;
    const isCorrect = currentGuess.toLowerCase() === pokemon.frenchName.toLowerCase();
    
    setIsCorrect(isCorrect);
    setShowSuggestions(false);
    setShowHint(false);
    
    if (isCorrect) {
      setScore(prev => prev + 1);
      setRemainingPokemon(prev => prev.filter(id => id !== pokemon.id));
      setTimeout(() => {
        setIsCorrect(null);
        setGuess('');
        fetchRandomPokemon();
      }, 1000);
    }
  };

  // Fetch rankings for all generations
  const fetchAllRankings = useCallback(async () => {
    try {
      const allRankings: { [key: string]: Player[] } = {};
      for (const gen of GENERATIONS) {
        const rankingsRef = collection(db, `rankings_gen${gen.startId}_${gen.endId}`);
        const q = query(rankingsRef, orderBy('score', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);
        const rankingsData: Player[] = [];
        querySnapshot.forEach((doc) => {
          rankingsData.push(doc.data() as Player);
        });
        allRankings[gen.name] = rankingsData;
      }
      setAllGenerationRankings(allRankings);
    } catch (error) {
      console.error('Error fetching all rankings:', error);
    }
  }, []);

  // Fetch rankings for selected generation
  const fetchSelectedRankings = useCallback(async () => {
    try {
      const rankingsRef = collection(db, `rankings_gen${selectedRankingGen.startId}_${selectedRankingGen.endId}`);
      const q = query(rankingsRef, orderBy('score', 'desc'), limit(10));
      const querySnapshot = await getDocs(q);
      const rankingsData: Player[] = [];
      querySnapshot.forEach((doc) => {
        rankingsData.push(doc.data() as Player);
      });
      setRankings(rankingsData);
    } catch (error) {
      console.error('Error fetching rankings:', error);
    }
  }, [selectedRankingGen]);

  // Load all rankings when component mounts
  useEffect(() => {
    fetchAllRankings();
  }, [fetchAllRankings]);

  // Load rankings when selected generation changes
  useEffect(() => {
    fetchSelectedRankings();
  }, [fetchSelectedRankings, selectedRankingGen]);

  const saveScore = useCallback(async () => {
    if (!playerName || score === 0) return;
    
    try {
      const rankingsRef = collection(db, `rankings_gen${selectedGeneration.startId}_${selectedGeneration.endId}`);
      await addDoc(rankingsRef, {
        name: playerName,
        score: score,
        time: GAME_TIME - timeLeft,
        timestamp: serverTimestamp()
      });
      await fetchSelectedRankings();
      await fetchAllRankings();
    } catch (error) {
      console.error('Error saving score:', error);
    }
  }, [playerName, score, timeLeft, selectedGeneration]);

  const handleGameOver = useCallback(() => {
    if (score > 0) {
      setGameOver(true);
      setIsGameActive(false);
      saveScore();
    }
  }, [score, saveScore]);

  const startGame = () => {
    if (!playerName) return;
    setIsGameActive(true);
    setScore(0);
    setTimeLeft(GAME_TIME);
    setGameOver(false);
    setHintsLeft(MAX_HINTS);
    setIsCorrect(null);
    setPokemon(null);
    setGuess('');
    setShowHint(false);
    setRemainingPokemon(
      Array.from(
        { length: selectedGeneration.endId - selectedGeneration.startId + 1 },
        (_, i) => selectedGeneration.startId + i
      )
    );
    fetchRandomPokemon();
  };

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isGameActive && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prevTime) => {
          if (prevTime <= 1) {
            clearInterval(timer);
            handleGameOver();
            return 0;
          }
          return prevTime - 1;
        });
      }, 1000);
    }
    return () => {
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [isGameActive, timeLeft, handleGameOver]);

  // Fetch random Pokemon
  const fetchRandomPokemon = async () => {
    if (remainingPokemon.length === 0) {
      handleGameOver();
      return;
    }

    const randomIndex = Math.floor(Math.random() * remainingPokemon.length);
    const pokemonId = remainingPokemon[randomIndex];

    try {
      const [pokemonResponse, speciesResponse] = await Promise.all([
        axios.get(`https://pokeapi.co/api/v2/pokemon/${pokemonId}`),
        axios.get(`https://pokeapi.co/api/v2/pokemon-species/${pokemonId}`)
      ]);

      const frenchName = speciesResponse.data.names.find(
        (name: { language: { name: string } }) => name.language.name === 'fr'
      )?.name || pokemonResponse.data.name;

      // Get French flavor text
      const flavorText = speciesResponse.data.flavor_text_entries.find(
        (entry: { language: { name: string } }) => entry.language.name === 'fr'
      )?.flavor_text || '';

      // Get the cry URL
      const cryUrl = `https://play.pokemonshowdown.com/audio/cries/${pokemonResponse.data.name.toLowerCase()}.mp3`;

      setPokemon({
        id: pokemonId,
        name: pokemonResponse.data.name,
        frenchName: capitalize(frenchName),
        imageUrl: pokemonResponse.data.sprites.other['official-artwork'].front_default,
        flavorText: flavorText.replace(/\\f|\\n/g, ' '),
        cryUrl: cryUrl
      });

      setRemainingPokemon(prev => prev.filter(id => id !== pokemonId));
      setGuess('');
      setIsCorrect(null);
      setSuggestions([]);
      setShowSuggestions(false);
    } catch (error) {
      console.error('Error fetching Pokemon:', error);
    }
  };

  // Play sound when Pokemon changes
  useEffect(() => {
    if (pokemon && !isSoundMuted) {
      const audio = new Audio(pokemon.cryUrl);
      audio.play().catch((error) => {
        console.error('Error playing sound:', error);
      });
    }
  }, [pokemon, isSoundMuted]);

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

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="pokemon-game">
      <button 
        className={`sound-toggle ${isSoundMuted ? 'muted' : ''}`}
        onClick={() => setIsSoundMuted(!isSoundMuted)}
        title={isSoundMuted ? "Activer le son" : "Désactiver le son"}
      >
        {isSoundMuted ? '🔇' : '🔊'}
      </button>

      {!isGameActive ? (
        <div className="start-screen">
          <h1>Qui est ce Pokémon?</h1>
          {gameOver && score > 0 ? (
            <div className="game-over">
              <h2>Partie terminée!</h2>
              <p>Score final: {score}</p>
              <p>Temps: {formatTime(GAME_TIME - timeLeft)}</p>
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
          ) : (
            <>
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
                  onChange={(e) => setSelectedGeneration(JSON.parse(e.target.value))}
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
                  Commencer!
                </button>
              </div>
              <div className="rankings">
                <h2>🏆 Classement</h2>
                <select
                  className="generation-select"
                  value={JSON.stringify(selectedRankingGen)}
                  onChange={(e) => setSelectedRankingGen(JSON.parse(e.target.value))}
                >
                  {GENERATIONS.map((gen, index) => (
                    <option key={index} value={JSON.stringify(gen)}>
                      {gen.name}
                    </option>
                  ))}
                </select>
                {rankings.length > 0 ? (
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>Rang</th>
                        <th>Nom</th>
                        <th>Score</th>
                        <th>Temps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((player, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>{player.name}</td>
                          <td>{player.score}</td>
                          <td>{formatTime(player.time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                ) : (
                  <p className="no-rankings">Pas encore de scores pour cette génération</p>
                )}
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="game-container">
          {gameOver ? (
            <div className="game-over-screen">
              <h2>Partie Terminée!</h2>
              <p className="final-score">Score: {score} points</p>
              <p className="time-spent">Temps: {formatTime(GAME_TIME - timeLeft)}</p>
              <div className="button-container">
                <button onClick={() => {
                  setIsGameActive(false);
                  setGameOver(false);
                }} className="menu-button">
                  Menu Principal
                </button>
                <button onClick={() => {
                  startGame();
                }} className="restart-button">
                  Rejouer
                </button>
              </div>
              {rankings.length > 0 && (
                <div className="rankings-container">
                  <h3>🏆 Classement</h3>
                  <table className="rankings-table">
                    <thead>
                      <tr>
                        <th>Rang</th>
                        <th>Joueur</th>
                        <th>Score</th>
                        <th>Temps</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rankings.map((ranking, index) => (
                        <tr key={index}>
                          <td>#{index + 1}</td>
                          <td>{ranking.name}</td>
                          <td>{ranking.score} pts</td>
                          <td>{formatTime(ranking.time)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ) : (
            <>
              <div className="game-header">
                <div className="game-info">
                  <div className="time">⏱️ {formatTime(timeLeft)}</div>
                  <div className="score">🏆 Score: {score}</div>
                  <div className="remaining">
                    ✨ Restant: {remainingPokemon.length}/{selectedGeneration.endId - selectedGeneration.startId + 1}
                  </div>
                  <div className="hints-left">
                    💡 Indices: {hintsLeft}/{MAX_HINTS}
                  </div>
                </div>
              </div>
              {pokemon && (
                <div className="pokemon-container">
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
                  <div className="guess-container">
                    <div className="input-container" ref={suggestionsRef}>
                      <input
                        ref={inputRef}
                        type="text"
                        value={guess}
                        onChange={handleInputChange}
                        onFocus={() => guess.length > 0 && setShowSuggestions(true)}
                        placeholder="Entrez le nom du Pokémon..."
                        className="guess-input"
                        onKeyPress={(e) => e.key === 'Enter' && handleGuess()}
                      />
                      {showSuggestions && suggestions.length > 0 && (
                        <div className="suggestions-list">
                          {suggestions.map((suggestion, index) => (
                            <div
                              key={index}
                              className="suggestion-item"
                              onClick={() => handleSuggestionClick(suggestion)}
                            >
                              {suggestion}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                    <div className="button-container">
                      <button onClick={() => handleGuess()} className="guess-button">
                        Deviner!
                      </button>
                      <button onClick={handleSkip} className="skip-button">
                        Passer (-1 point)
                      </button>
                      <button 
                        onClick={handleHintClick} 
                        className="hint-button"
                        disabled={showHint || hintsLeft === 0}
                      >
                        {hintsLeft > 0 ? `Indice (${hintsLeft})` : 'Plus d\'indices'}
                      </button>
                    </div>
                    {showHint && (
                      <div className="hint">
                        <p>Première lettre: {pokemon.frenchName[0].toUpperCase()}</p>
                        <p>Longueur: {pokemon.frenchName.length} lettres</p>
                        {pokemon.flavorText && (
                          <p className="flavor-text">Description: {pokemon.flavorText}</p>
                        )}
                      </div>
                    )}
                    {isCorrect !== null && (
                      <div className={`message ${isCorrect ? 'correct' : 'incorrect'}`}>
                        {isCorrect ? 'Correct!' : 'Essaie encore!'}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
};

export default PokemonGame;
