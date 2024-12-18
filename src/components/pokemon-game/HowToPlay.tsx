import { FC } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Sparkles } from 'lucide-react';

interface HowToPlayProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HowToPlay: FC<HowToPlayProps> = ({ isOpen, onClose }) => {
  const steps = [
    {
      title: 'Entrez votre nom',
      description: 'Commencez par entrer votre nom de dresseur.',
      image: '/images/howtoplay/step1.png',
      color: 'from-red-400 to-red-600'
    },
    {
      title: 'Choisissez une génération',
      description: 'Sélectionnez la génération de Pokémon que vous souhaitez deviner.',
      image: '/images/howtoplay/step2.png',
      color: 'from-blue-400 to-blue-600'
    },
    {
      title: 'Devinez le Pokémon',
      description: 'Un Pokémon apparaît en silhouette. Tapez son nom pour le deviner !',
      image: '/images/howtoplay/step3.png',
      color: 'from-purple-400 to-purple-600'
    },
    {
      title: 'Utilisez des indices',
      description: 'Si vous bloquez, utilisez un indice pour avoir la description du Pokémon.',
      image: '/images/howtoplay/step4.png',
      color: 'from-green-400 to-green-600'
    },
    {
      title: 'Surveillez le temps',
      description: 'Vous avez 15 secondes pour deviner chaque Pokémon. Soyez rapide !',
      image: '/images/howtoplay/step5.png',
      color: 'from-yellow-400 to-yellow-600'
    },
    {
      title: 'Gagnez des récompenses',
      description: 'Plus votre score est élevé, plus vous obtiendrez un Pokémon rare à la fin !',
      image: '/images/howtoplay/step6.png',
      color: 'from-pink-400 to-pink-600'
    }
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl bg-gradient-to-br from-blue-500 to-blue-600 border-4 border-white p-0 shadow-2xl">
        <div className="p-6 text-white relative">
          {/* Background decorative elements */}
          <div className="absolute inset-0 bg-[radial-gradient(circle,_transparent_20%,_rgba(255,255,255,0.1)_20%)] bg-[length:20px_20px] opacity-50"></div>
          <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent"></div>
          
          {/* Title section */}
          <div className="relative">
            <h2 className="text-4xl font-bold text-center mb-2 drop-shadow-lg">Comment jouer ?</h2>
            <div className="flex justify-center gap-2 mb-8">
              <div className="w-3 h-3 rounded-full bg-red-400 animate-pulse"></div>
              <div className="w-3 h-3 rounded-full bg-yellow-400 animate-pulse delay-100"></div>
              <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse delay-200"></div>
            </div>
          </div>
          
          {/* Steps grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 relative">
            {steps.map((step, index) => (
              <div 
                key={index}
                className="group relative h-full"
              >
                {/* Card background with gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${step.color} rounded-xl opacity-20 group-hover:opacity-30 transition-opacity`}></div>
                
                {/* Main content */}
                <div className="relative bg-white/10 backdrop-blur-sm rounded-xl p-4 border-2 border-white/20 hover:border-white/40 transition-all overflow-hidden h-full flex flex-col">
                  {/* Sparkle effects */}
                  <div className="absolute top-2 right-2 text-yellow-300 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Sparkles className="h-4 w-4 animate-pulse" />
                  </div>
                  
                  {/* Image container - fixed height */}
                  <div className="aspect-video bg-black/40 rounded-lg overflow-hidden mb-4 border border-white/10 shadow-xl flex-shrink-0">
                    <img 
                      src={step.image} 
                      alt={step.title}
                      className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                    />
                  </div>
                  
                  {/* Text content */}
                  <div className="flex flex-col flex-grow justify-between space-y-2">
                    <h3 className="text-xl font-bold flex items-center gap-2">
                      <div className="w-7 h-7 bg-white/20 rounded-full flex items-center justify-center text-sm border border-white/20 shadow-inner flex-shrink-0">
                        {index + 1}
                      </div>
                      <span className="line-clamp-1">{step.title}</span>
                    </h3>
                    <p className="text-white/80 text-sm leading-relaxed line-clamp-2">
                      {step.description}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
          
          {/* Footer text */}
          <div className="mt-8 text-center text-sm text-white/60 backdrop-blur-sm py-2 rounded-full bg-white/5">
            Appuyez sur Échap ou cliquez en dehors de la fenêtre pour fermer
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}; 