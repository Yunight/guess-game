import { FC, RefObject } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { Pokemon } from './types';
import { PokemonDisplay } from './PokemonDisplay';
import { GameStats } from './GameStats';
import { GuessInput } from './GuessInput';
import { HintButton } from './HintButton';
import { ScoreIncrease } from './ScoreIncrease';

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
  inputRef: RefObject<HTMLInputElement>;
  suggestionsRef: RefObject<HTMLDivElement>;
  formatTime: (seconds: number) => string;
  isMuted: boolean;
  setIsMuted: (value: boolean) => void;
  totalTimeElapsed: number;
  bestScore: number;
  bestTime: number;
  onQuit: () => void;
  isHardMode: boolean;
  showCriticalSuccess: boolean;
  showCriticalHit: boolean;
  showHypeTrain: boolean;
  consecutiveFastAnswers: number;
  pointsEarned: number;
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
  isMuted,
  setIsMuted,
  totalTimeElapsed,
  bestScore,
  bestTime,
  onQuit,
  isHardMode,
  showCriticalSuccess,
  showCriticalHit,
  showHypeTrain,
  consecutiveFastAnswers,
  pointsEarned,
}) => {
  return (
    <Card className="w-full max-w-md p-1 sm:p-4 relative flex flex-col min-h-0 sm:min-h-0 bg-red-500 rounded-3xl overflow-hidden">
      {/* Fire overlay when Hype Train is active */}
      {showHypeTrain && (
        <div className="absolute inset-0 z-0 overflow-hidden">
          {/* Base glow */}
          <div className="absolute inset-0 bg-gradient-to-t from-red-900 via-red-800 to-red-900 opacity-70"></div>
          
          {/* Heat distortion effect */}
          <div className="absolute inset-0 backdrop-blur-[0.5px] animate-heat-distort"></div>
          
          {/* Core flames */}
          <div className="absolute inset-x-0 bottom-0 h-full">
            {/* Main flame core */}
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-full h-full">
              <div className="absolute bottom-0 w-full h-4/5 bg-gradient-to-t from-orange-600 via-yellow-500 to-transparent opacity-60 animate-flame-dance mix-blend-screen"></div>
            </div>
            
            {/* Multiple flame layers with different colors and timings */}
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="absolute bottom-0 w-full"
                style={{
                  height: `${50 + i * 10}%`,
                  left: `${-15 + i * 5}%`,
                  width: `${120 - i * 5}%`,
                  animationDelay: `${i * 0.2}s`,
                  filter: 'contrast(1.2)',
                }}
              >
                <div 
                  className={`absolute bottom-0 w-full h-full bg-gradient-to-t animate-flame-flicker mix-blend-screen`}
                  style={{
                    animationDelay: `${i * 0.3}s`,
                    background: i % 2 === 0 
                      ? 'linear-gradient(to top, rgb(249, 115, 22), rgb(234, 179, 8), rgba(234, 179, 8, 0))'
                      : 'linear-gradient(to top, rgb(234, 88, 12), rgb(252, 211, 77), rgba(252, 211, 77, 0))',
                    opacity: 0.4 - i * 0.02,
                  }}
                ></div>
              </div>
            ))}
            
            {/* Ember particles */}
            {[...Array(12)].map((_, i) => (
              <div
                key={`ember-${i}`}
                className="absolute w-1 h-1 rounded-full animate-ember-rise mix-blend-screen"
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: `${Math.random() * 30}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1 + Math.random()}s`,
                  background: i % 3 === 0 ? '#fbbf24' : i % 3 === 1 ? '#f59e0b' : '#f97316',
                  opacity: 0.8,
                  boxShadow: '0 0 4px rgba(251, 191, 36, 0.8)',
                }}
              ></div>
            ))}
            
            {/* Small flickering flames at the base */}
            {[...Array(8)].map((_, i) => (
              <div
                key={`flicker-${i}`}
                className="absolute bottom-0 animate-flame-flicker mix-blend-screen"
                style={{
                  left: `${5 + i * 15}%`,
                  width: '30px',
                  height: '60px',
                  background: 'linear-gradient(to top, rgb(249, 115, 22), rgb(234, 179, 8), rgba(234, 179, 8, 0))',
                  animationDelay: `${i * 0.15}s`,
                  opacity: 0.6,
                  filter: 'blur(1px)',
                }}
              ></div>
            ))}
          </div>
          
          {/* Heat distortion overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-orange-500/30 via-yellow-500/10 to-transparent mix-blend-overlay"></div>
          
          {/* Glow effect */}
          <div className="absolute inset-0 bg-gradient-radial from-yellow-500/20 via-orange-500/10 to-transparent mix-blend-overlay animate-fire-pulse"></div>
        </div>
      )}

      {/* Top dots */}
      <div className="absolute top-4 left-4 flex gap-2 z-10">
        <div className="w-3 h-3 rounded-full bg-gray-700"></div>
        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
        <div className="w-3 h-3 rounded-full bg-green-500"></div>
      </div>

      {/* Blue circle light */}
      <div className="absolute top-2 left-24 w-10 h-10 rounded-full bg-blue-400 border-4 border-white z-10"></div>

      {/* Quit Button - Only show in Chill mode */}
      {!isHardMode && (
        <Button
          variant="ghost"
          onClick={onQuit}
          className="absolute left-1/2 -translate-x-1/2 top-14 text-white hover:text-red-200 hover:bg-white/10 transition-colors font-medium"
        >
          Quitter
        </Button>
      )}

      {/* Global Timer */}
      <div className="absolute top-4 left-1/2 -translate-x-1/2 font-mono text-lg font-bold text-white h-9 flex items-center bg-black/20 px-4 rounded-full backdrop-blur-sm">
        {formatTime(totalTimeElapsed)}
      </div>

      {/* Pokemon Number */}
      <div className="absolute top-4 right-16 font-mono text-lg font-bold text-gray-700 h-9 flex items-center">
        #{currentPokemon?.id.toString().padStart(3, '0') || '???'}
      </div>

      {pointsEarned > 0 && <ScoreIncrease points={pointsEarned} />}

      {/* Sound toggle */}
      <div className="absolute top-4 right-4">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setIsMuted(!isMuted)}
          className="hover:bg-white/10"
        >
          {isMuted ? (
            <VolumeX className="h-5 w-5 text-white" />
          ) : (
            <Volume2 className="h-5 w-5 text-white" />
          )}
        </Button>
      </div>

      <div className="flex flex-col flex-1 mt-16 mb-2 relative z-10">
        <div className="relative">
          <PokemonDisplay 
            currentPokemon={currentPokemon}
            isPokemonLoading={isPokemonLoading}
            isCorrect={isCorrect}
            isMuted={isMuted}
            guessTimeLeft={guessTimeLeft}
          />

          {/* Critical Messages */}
          {(showCriticalSuccess || showCriticalHit || showHypeTrain) && (
            <div className="absolute left-1/2 -translate-x-1/2 bottom-4 z-50 pointer-events-none">
              {showCriticalSuccess && (
                <div className="animate-float-up-fade-out text-yellow-300 font-bold text-xl whitespace-nowrap px-4 py-2 bg-black/80 rounded-full backdrop-blur-sm border-2 border-yellow-400 shadow-lg">
                  ⚡️ Succès Critique! ⚡️
                </div>
              )}
              {!showCriticalSuccess && showCriticalHit && (
                <div className="animate-float-up-fade-out text-yellow-300 font-bold text-xl whitespace-nowrap px-4 py-2 bg-black/80 rounded-full backdrop-blur-sm border-2 border-yellow-400 shadow-lg">
                  ❗️ Coup Critique! ❗️
                </div>
              )}
              {!showCriticalSuccess && !showCriticalHit && showHypeTrain && (
                <div className="text-yellow-300 font-bold text-xl whitespace-nowrap px-4 py-2 bg-black/80 rounded-full backdrop-blur-sm border-2 border-yellow-400 shadow-lg animate-pulse">
                  🚂 Hype Train! x{consecutiveFastAnswers} 🚂
                </div>
              )}
            </div>
          )}
        </div>

        <GameStats 
          score={score}
          bestScore={bestScore}
          guessTimeLeft={guessTimeLeft}
          hintsLeft={hintsLeft}
          formatTime={formatTime}
          bestTime={bestTime}
        />

        {/* D-Pad and green screen area */}
        <div className="flex items-center gap-4 mx-2 mt-4">
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
            {/* Center dot */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 bg-gray-700 rounded-full"></div>
          </div>

          {/* Green screen area */}
          <div className="flex-1 bg-gradient-to-br from-green-300 to-green-400 rounded-lg p-2 shadow-inner">
            <GuessInput
              guess={guess}
              handleGuessChange={handleGuessChange}
              handleKeyDown={handleKeyDown}
              suggestions={suggestions}
              handleSuggestionClick={handleSuggestionClick}
              highlightedIndex={highlightedIndex}
              inputRef={inputRef}
              suggestionsRef={suggestionsRef}
              isCorrect={isCorrect}
              guessTimeLeft={guessTimeLeft}
            />
          </div>
        </div>

        <div className="mt-2">
          <HintButton 
            showHint={showHint}
            useHint={useHint}
            hintsLeft={hintsLeft}
            currentPokemon={currentPokemon}
            isPokemonLoading={isPokemonLoading}
          />
        </div>
      </div>
    </Card>
  );
}; 