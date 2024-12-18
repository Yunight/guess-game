import { FC } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Volume2, VolumeX } from 'lucide-react';
import { Generation, Rankings } from '@/components/pokemon-game/types';

interface MenuScreenProps {
  playerName: string;
  handlePlayerNameChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  nameError: string | null;
  selectedGeneration: Generation;
  handleGenerationSelect: (generation: Generation) => void;
  GENERATIONS: Generation[];
  canStartGame: boolean;
  startGame: () => void;
  score: number;
  isMuted: boolean;
  setIsMuted: (muted: boolean) => void;
  rankings: Rankings[];
  formatTimeForRanking: (seconds: number) => string;
  formatDate: (timestamp: Date) => string;
  bestScore: number;
}

export const MenuScreen: FC<MenuScreenProps> = ({
  playerName,
  handlePlayerNameChange,
  nameError,
  selectedGeneration,
  handleGenerationSelect,
  GENERATIONS,
  canStartGame,
  startGame,
  score,
  isMuted,
  setIsMuted,
  rankings,
  formatTimeForRanking,
  formatDate,
}) => {
  return (
    <div className="w-full max-w-5xl px-4 sm:px-0">
      <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
        {/* Left Panel - Pokédex Main Screen */}
        <div className="w-full lg:w-[500px] bg-red-500 rounded-3xl p-6 relative min-h-[600px]">
          {/* Top dots */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-700"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>

          {/* Blue circle light */}
          <div className="absolute top-2 left-24 w-10 h-10 rounded-full bg-blue-400 border-4 border-white"></div>

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

          {/* Main content area */}
          <div className="mt-16 space-y-3 h-[calc(100%-5rem)] flex flex-col">
            <div className="bg-white rounded-xl p-3 sm:p-4 shadow-inner space-y-3 flex-1">
              <div className="space-y-2">
                <label htmlFor="playerName" className="text-sm font-medium text-gray-700">
                  Nom du dresseur
                </label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder="Entrez votre nom"
                  className={`w-full h-10 px-4 text-lg transition-colors
                    ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
                  `}
                  value={playerName}
                  onChange={handlePlayerNameChange}
                />
                {nameError && (
                  <p className="text-red-500 text-sm">{nameError}</p>
                )}
              </div>

              <div className="space-y-2">
                <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                  <div className="w-6 h-6 bg-red-500 rounded-full border-4 border-white shadow-md"></div>
                  Génération Pokémon
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {GENERATIONS.map((gen) => (
                    <Button
                      key={gen.name}
                      onClick={() => handleGenerationSelect(gen)}
                      className={`px-2 py-1.5 text-sm font-medium transition-all relative overflow-hidden
                        ${selectedGeneration.name === gen.name
                          ? 'bg-gradient-to-br from-red-500 to-red-600 text-white shadow-lg scale-[1.02] border-2 border-white'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:scale-[1.01]'
                        }
                        before:content-[""] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent
                        ${selectedGeneration.name === gen.name ? 'before:animate-shine' : ''}
                      `}
                    >
                      <div className="flex items-center justify-center gap-1">
                        {selectedGeneration.name === gen.name && (
                          <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
                        )}
                        {gen.name}
                      </div>
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={startGame}
              disabled={!canStartGame}
              className={`w-full h-14 sm:h-20 text-lg sm:text-xl font-bold transition-all duration-300 relative overflow-hidden rounded-xl
                ${canStartGame 
                  ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white shadow-xl hover:shadow-2xl transform hover:scale-[1.02] border-4 border-white' 
                  : 'bg-gray-200 text-gray-500'
                }
                before:content-[""] before:absolute before:inset-0 before:bg-gradient-to-r before:from-white/20 before:via-transparent before:to-transparent
                ${canStartGame ? 'before:animate-shine' : ''}
              `}
            >
              <div className="absolute left-10 top-1/2 -translate-y-1/2 hidden sm:block">
                <div className="w-16 h-16 bg-white/20 rounded-full relative backdrop-blur-sm border-4 border-white/40">
                  {/* Vertical line */}
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-4 flex flex-col justify-between">
                    <div className="h-4 bg-white/60 rounded-t-sm"></div>
                    <div className="h-4 bg-white/60 rounded-b-sm"></div>
                  </div>
                  {/* Horizontal line */}
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-4 flex justify-between">
                    <div className="w-4 bg-white/60 rounded-l-sm"></div>
                    <div className="w-4 bg-white/60 rounded-r-sm"></div>
                  </div>
                  {/* Center circle */}
                  <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 bg-white rounded-full shadow-glow"></div>
                </div>
              </div>
              <div className="flex items-center justify-center gap-4">
                <span className="sm:ml-16">
                  {score > 0 ? 'Rejouer !' : 'Commencer !'}
                </span>
                {canStartGame && (
                  <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
                )}
              </div>
            </Button>
          </div>
        </div>

        {/* Right Panel - Rankings Display */}
        <div className="w-full lg:w-[500px] bg-red-500 rounded-3xl p-6 relative min-h-[600px]">
          <div className="bg-gray-800 rounded-xl p-4 mb-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/20 to-purple-600/20"></div>
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-400 to-purple-400"></div>
            <div className="relative flex items-center justify-center gap-3">
              <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-white animate-spin-slow"></div>
              <h2 className="text-2xl font-bold text-center text-white">
                Meilleurs Scores - {selectedGeneration.name}
              </h2>
              <div className="w-6 h-6 bg-yellow-400 rounded-full border-2 border-white animate-spin-slow"></div>
            </div>
          </div>

          <div className="bg-white/90 backdrop-blur-sm rounded-xl shadow-inner overflow-hidden border-4 border-blue-500">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 text-white p-3 grid grid-cols-12 gap-2 text-sm relative">
              <div className="absolute inset-0 bg-grid-pattern opacity-10"></div>
              <div className="col-span-1 font-bold relative">
                <span className="relative z-10">#</span>
              </div>
              <div className="col-span-4 font-bold relative">
                <span className="relative z-10">Dresseur</span>
              </div>
              <div className="col-span-2 font-bold text-center relative">
                <span className="relative z-10">Score</span>
              </div>
              <div className="col-span-2 font-bold text-center relative">
                <span className="relative z-10">Temps</span>
              </div>
              <div className="col-span-3 font-bold text-center hidden sm:block relative">
                <span className="relative z-10">Date</span>
              </div>
            </div>
            
            {/* Rankings list */}
            <div className="divide-y divide-blue-100 h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-blue-500 scrollbar-track-blue-100">
              {rankings.map((player, index) => (
                <div 
                  key={index}
                  className={`grid grid-cols-12 gap-1 sm:gap-2 p-2 sm:p-3 items-center text-sm sm:text-base hover:bg-blue-50/80 transition-all duration-300 relative
                    ${player.name === playerName ? 'bg-yellow-50/90 hover:bg-yellow-100/90' : ''}
                    ${index < 3 ? 'font-semibold' : ''}`}
                >
                  <div className="col-span-1 text-gray-800 relative z-10">
                    {index < 3 ? (
                      <div className={`
                        relative w-7 h-7 sm:w-8 sm:h-8 rounded-full flex items-center justify-center
                        ${index === 0 ? 'bg-gradient-to-br from-yellow-300 to-yellow-500' : ''}
                        ${index === 1 ? 'bg-gradient-to-br from-gray-300 to-gray-500' : ''}
                        ${index === 2 ? 'bg-gradient-to-br from-orange-300 to-orange-700' : ''}
                        shadow-lg transform hover:scale-110 transition-transform duration-200
                      `}>
                        <div className="absolute inset-0 rounded-full bg-white/20 animate-pulse-slow"></div>
                        <span className="relative text-white font-bold text-sm sm:text-base z-10">
                          {index + 1}
                        </span>
                      </div>
                    ) : (
                      <span className="text-gray-600 text-sm font-medium">#{index + 1}</span>
                    )}
                  </div>
                  <div className="col-span-4 truncate text-gray-800 text-sm sm:text-base">
                    {player.name === playerName ? (
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold truncate">★ {player.name}</span>
                        <div className="w-2.5 h-2.5 bg-yellow-400 rounded-full animate-ping shrink-0"></div>
                      </div>
                    ) : (
                      <span className="hover:text-blue-600 transition-colors duration-200">{player.name}</span>
                    )}
                  </div>
                  <div className="col-span-2 text-center font-mono text-gray-800 font-bold text-sm sm:text-base">
                    {player.score}
                  </div>
                  <div className="col-span-2 text-center font-mono text-gray-700 text-sm sm:text-base">
                    {formatTimeForRanking(player.time)}
                  </div>
                  <div className="col-span-3 text-center text-xs sm:text-sm text-gray-500 hidden sm:block">
                    {formatDate(player.timestamp)}
                  </div>
                </div>
              ))}
              
              {rankings.length === 0 && (
                <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-4">
                  <div className="w-16 h-16 bg-gray-200 rounded-full animate-bounce"></div>
                  <p className="text-lg">Aucun score enregistré pour cette génération</p>
                </div>
              )}
            </div>
          </div>

          {/* Decorative elements moved below the rankings table */}
          <div className="mt-4 flex justify-end gap-4">
            <div className="w-12 h-6 bg-gray-800 rounded-lg"></div>
            <div className="w-12 h-6 bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}; 