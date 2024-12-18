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
    <div className="w-full max-w-5xl">
      <div className="flex justify-between items-start gap-6">
        {/* Left Panel - Pokédex Main Screen */}
        <div className="w-[500px] bg-red-500 rounded-3xl p-6 relative min-h-[600px]">
          {/* Top dots */}
          <div className="absolute top-4 left-4 flex gap-2">
            <div className="w-3 h-3 rounded-full bg-gray-700"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>

          {/* Blue circle light */}
          <div className="absolute top-2 left-12 w-10 h-10 rounded-full bg-blue-400 border-4 border-white"></div>

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
          <div className="mt-16 space-y-6 h-[450px] flex flex-col">
            <div className="bg-white rounded-xl p-6 shadow-inner space-y-6 flex-1">
              <div className="space-y-2">
                <label htmlFor="playerName" className="text-sm font-medium text-gray-700">
                  Nom du dresseur
                </label>
                <Input
                  id="playerName"
                  type="text"
                  placeholder="Entrez votre nom"
                  className={`w-full h-12 px-4 text-lg transition-colors
                    ${nameError ? 'border-red-500 focus:ring-red-500' : 'border-gray-300'}
                  `}
                  value={playerName}
                  onChange={handlePlayerNameChange}
                />
                {nameError && (
                  <p className="text-red-500 text-sm">{nameError}</p>
                )}
              </div>

              <div className="space-y-3 mt-auto">
                <h2 className="text-lg font-semibold text-gray-800">
                  Génération Pokémon
                </h2>
                <div className="grid grid-cols-2 gap-2">
                  {GENERATIONS.map((gen) => (
                    <Button
                      key={gen.name}
                      onClick={() => handleGenerationSelect(gen)}
                      className={`px-3 py-2 text-sm font-medium transition-all
                        ${selectedGeneration.name === gen.name
                          ? 'bg-blue-500 text-white shadow-lg scale-[1.02]'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }`}
                    >
                      {gen.name}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <Button
              onClick={startGame}
              disabled={!canStartGame}
              className={`w-full h-14 text-xl font-medium transition-all duration-300 relative mt-auto
                ${canStartGame 
                  ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg hover:shadow-xl transform hover:scale-[1.02]' 
                  : 'bg-gray-200 text-gray-500'
                }`}
            >
              <div className="absolute left-4 top-1/2 -translate-y-1/2">
                <div className="w-8 h-8 bg-gray-800 rounded-full relative">
                  {/* Vertical line */}
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 h-full w-2 flex flex-col justify-between">
                    <div className="h-2 bg-gray-700 rounded-t-sm"></div>
                    <div className="h-2 bg-gray-700 rounded-b-sm"></div>
                  </div>
                  {/* Horizontal line */}
                  <div className="absolute top-1/2 left-0 -translate-y-1/2 w-full h-2 flex justify-between">
                    <div className="w-2 bg-gray-700 rounded-l-sm"></div>
                    <div className="w-2 bg-gray-700 rounded-r-sm"></div>
                  </div>
                  {/* Center circle */}
                  <div className="absolute inset-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 bg-gray-600 rounded-full"></div>
                </div>
              </div>
              <span className="ml-4">{score > 0 ? 'Rejouer!' : 'Commencer!'}</span>
            </Button>
          </div>
        </div>

        {/* Right Panel - Rankings Display */}
        <div className="w-[500px] bg-red-500 rounded-3xl p-6 relative min-h-[600px]">
          <div className="bg-gray-800 rounded-xl p-4 mb-4">
            <h2 className="text-2xl font-bold text-center text-white">
              Meilleurs Scores - {selectedGeneration.name}
            </h2>
          </div>

          <div className="bg-white rounded-xl shadow-inner overflow-hidden">
            {/* Header */}
            <div className="bg-blue-500 text-white p-3 grid grid-cols-12 gap-2 text-sm">
              <div className="col-span-1 font-bold">#</div>
              <div className="col-span-4 font-bold">Dresseur</div>
              <div className="col-span-2 font-bold text-center">Score</div>
              <div className="col-span-2 font-bold text-center">Temps</div>
              <div className="col-span-3 font-bold text-center hidden sm:block">Date</div>
            </div>
            
            {/* Rankings list */}
            <div className="divide-y divide-gray-200 h-[450px] overflow-y-auto">
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

          {/* Decorative elements */}
          <div className="absolute bottom-6 right-6 flex gap-4">
            <div className="w-12 h-6 bg-gray-800 rounded-lg"></div>
            <div className="w-12 h-6 bg-gray-800 rounded-lg"></div>
          </div>
        </div>
      </div>
    </div>
  );
}; 