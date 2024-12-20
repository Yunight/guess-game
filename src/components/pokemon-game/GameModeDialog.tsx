import { FC } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Timer, Lightbulb, Gamepad2, Hourglass, Keyboard, ArrowDown, ArrowUp, KeyRound, Trophy, Medal } from 'lucide-react';

interface GameModeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectMode: (isHardMode: boolean) => void;
}

export const GameModeDialog: FC<GameModeDialogProps> = ({
  isOpen,
  onClose,
  onSelectMode,
}) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='sm:max-w-[600px] bg-white/95 backdrop-blur-sm border-4 border-blue-500 rounded-xl shadow-2xl'>
        <DialogHeader className='relative'>
          <div className='absolute -top-2 -left-2 w-24 h-24 bg-blue-400/20 rounded-full blur-2xl animate-pulse-slow pointer-events-none'></div>
          <div className='absolute -top-2 -right-2 w-24 h-24 bg-red-400/20 rounded-full blur-2xl animate-pulse-slow delay-500 pointer-events-none'></div>
          <DialogTitle className='text-center text-2xl font-pokemon bg-gradient-to-br from-blue-500 to-purple-600 text-transparent bg-clip-text'>
            Mode de jeu
          </DialogTitle>
          <DialogDescription className="text-center text-gray-500">
            Choisissez votre mode de jeu pour commencer
          </DialogDescription>
        </DialogHeader>
        
        <div className='flex flex-col gap-4'>
          {/* Pro Tips Section */}
          <div className='bg-yellow-50/90 p-4 rounded-xl border-2 border-yellow-400'>
            <div className='flex items-center gap-2 mb-3'>
              <span className='text-yellow-600 font-bold text-lg'>Pro Tips - PC</span>
              <div className='w-2 h-2 bg-yellow-400 rounded-full animate-pulse'></div>
            </div>
            <div className='space-y-3 text-sm text-gray-700'>
              <div className='flex items-start gap-2'>
                <Keyboard className='w-4 h-4 mt-1 text-yellow-600 shrink-0' />
                <p>Le jeu est totalement jouable sans souris</p>
              </div>
              
              <div className='flex items-start gap-2'>
                <div className='w-4 h-4 mt-1 shrink-0 flex items-center justify-center'>
                  <div className='w-2 h-2 bg-yellow-600 rounded-full'></div>
                </div>
                <p>La première suggestion est sélectionnée par défaut</p>
              </div>

              <div className='flex items-start gap-2'>
                <KeyRound className='w-4 h-4 mt-1 text-yellow-600 shrink-0' />
                <p>Appuyez sur <span className='font-semibold'>Entrée</span> pour valider directement la réponse</p>
              </div>

              <div className='flex items-start gap-2'>
                <div className='shrink-0 mt-1'>
                  <div className='flex flex-col items-center justify-center gap-0.5 h-full'>
                    <ArrowUp className='w-4 h-4 text-yellow-600' />
                    <ArrowDown className='w-4 h-4 text-yellow-600' />
                  </div>
                </div>
                <p className='mt-2'>Utilisez les flèches haut/bas pour naviguer entre les réponses</p>
              </div>

              <div className='flex items-start gap-2'>
                <div className='w-4 h-4 mt-1 shrink-0 flex items-center justify-center'>
                  <div className='w-2 h-2 bg-yellow-600 rounded-full'></div>
                </div>
                <p>Le focus revient automatiquement sur le champ de saisie après validation</p>
              </div>
            </div>
          </div>

          {/* Game Mode Buttons */}
          <div className='flex flex-col sm:flex-row gap-4'>
            <Button
              onClick={() => onSelectMode(false)}
              className='group relative h-auto p-6 bg-gradient-to-br from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white border-4 border-white hover:border-blue-300 transition-all duration-300 flex-1'
            >
              <div className='flex flex-col items-center gap-2'>
                <div className='flex items-center gap-2 text-xl font-bold'>
                  <Gamepad2 className='w-6 h-6' />
                  Mode Chill
                </div>
                <div className='flex flex-col items-center text-sm text-blue-100 gap-1'>
                  <div className='flex items-center gap-1'>
                    <Lightbulb className='w-4 h-4' />
                    <span>Indices disponibles</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Timer className='w-4 h-4' />
                    <span>Sans limite de temps</span>
                  </div>
                </div>
                <div className='absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-white/20 rounded-full transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300'></div>
              </div>
            </Button>

            <Button
              onClick={() => onSelectMode(true)}
              className='group relative h-auto p-6 bg-gradient-to-br from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white border-4 border-white hover:border-red-300 transition-all duration-300 flex-1'
            >
              <div className='flex flex-col items-center gap-2'>
                <div className='flex items-center gap-2 text-xl font-bold'>
                  <Gamepad2 className='w-6 h-6' />
                  Mode Try Hard
                </div>
                <div className='flex flex-col items-center text-sm text-red-100 gap-1'>
                  <div className='flex items-center gap-1'>
                    <Lightbulb className='w-4 h-4' />
                    <span>Sans indices</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Hourglass className='w-4 h-4' />
                    <span>Temps limité</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Medal className='w-4 h-4' />
                    <span>Ton score est classé</span>
                  </div>
                  <div className='flex items-center gap-1'>
                    <Trophy className='w-4 h-4' />
                    <span>Plus t'es rapide plus tu gagnes de points</span>
                  </div>
                </div>
                <div className='absolute right-2 top-1/2 -translate-y-1/2 w-1.5 h-12 bg-white/20 rounded-full transform scale-y-0 group-hover:scale-y-100 transition-transform duration-300'></div>
              </div>
            </Button>
          </div>

          <div className='flex justify-center'>
            <p className='text-sm text-gray-500 italic'>
              Choisissez votre mode de jeu pour commencer
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 