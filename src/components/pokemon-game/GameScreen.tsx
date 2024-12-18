import { FC } from 'react';
import { Card } from '@/components/ui/card';
import { PokemonDisplay } from '@/components/pokemon-game/PokemonDisplay';
import { GameStats } from '@/components/pokemon-game/GameStats';
import { GuessInput } from '@/components/pokemon-game/GuessInput';
import { HintButton } from '@/components/pokemon-game/HintButton';
import { Pokemon } from '@/components/pokemon-game/types';

interface GameScreenProps {
  currentPokemon: Pokemon | undefined;
  isPokemonLoading: boolean;
  isCorrect: boolean | null;
  score: number;
  guessTimeLeft: number;
  hintsLeft: number;
  guess: string;
  handleGuessChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  suggestions: string[];
  handleSuggestionClick: (suggestion: string) => void;
  highlightedIndex: number;
  showHint: boolean;
  useHint: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
  suggestionsRef: React.RefObject<HTMLDivElement>;
  formatTime: (seconds: number) => string;
}

export const GameScreen: FC<GameScreenProps> = ({
  currentPokemon,
  isPokemonLoading,
  isCorrect,
  score,
  guessTimeLeft,
  hintsLeft,
  guess,
  handleGuessChange,
  handleKeyDown,
  suggestions,
  handleSuggestionClick,
  highlightedIndex,
  showHint,
  useHint,
  inputRef,
  suggestionsRef,
  formatTime,
}) => {
  return (
    <Card className="w-full max-w-md p-1 sm:p-4 relative flex flex-col min-h-0 sm:min-h-0 bg-red-500 rounded-3xl">
      {/* Top dots */}
      <div className="absolute top-4 left-4 flex gap-2">
        <div className="w-3 h-3 rounded-full bg-gray-700"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>

      {/* Blue circle light */}
      <div className="absolute top-2 left-12 w-10 h-10 rounded-full bg-blue-400 border-4 border-white"></div>

      {/* Pokemon Number */}
      <div className="absolute top-4 right-4 font-mono text-lg font-bold text-gray-700">
        #{currentPokemon?.id.toString().padStart(3, '0') || '???'}
      </div>

      <PokemonDisplay 
        currentPokemon={currentPokemon}
        isPokemonLoading={isPokemonLoading}
        isCorrect={isCorrect}
      />

      <GameStats 
        score={score}
        guessTimeLeft={guessTimeLeft}
        hintsLeft={hintsLeft}
        formatTime={formatTime}
      />

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

      <GuessInput 
        guess={guess}
        handleGuessChange={handleGuessChange}
        handleKeyDown={handleKeyDown}
        suggestions={suggestions}
        handleSuggestionClick={handleSuggestionClick}
        highlightedIndex={highlightedIndex}
        isCorrect={isCorrect}
        inputRef={inputRef}
        suggestionsRef={suggestionsRef}
      />

      <HintButton 
        hintsLeft={hintsLeft}
        showHint={showHint}
        useHint={useHint}
        isPokemonLoading={isPokemonLoading}
        currentPokemon={currentPokemon}
      />
    </Card>
  );
}; 