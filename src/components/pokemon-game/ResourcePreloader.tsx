import { useEffect, useState } from 'react';
import { useAppSelector } from '../../hooks/store';
import { Generation } from './types';
import type { RootState } from '../../store/store';

interface PreloaderProps {
  onComplete?: () => void;
  children: React.ReactNode;
}

const DEFAULT_GENERATION: Generation = {
  name: 'Kanto',
  startId: 1,
  endId: 151
};

const BATCH_SIZE = 20; // Load resources in batches of 20

export const ResourcePreloader = ({ onComplete, children }: PreloaderProps) => {
  const [isLoading, setIsLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const generation = useAppSelector((state: RootState) => state.game?.selectedGeneration) || DEFAULT_GENERATION;

  useEffect(() => {
    const preloadResources = async () => {
      try {
        const startId = generation.startId;
        const endId = generation.endId;
        const totalResources = (endId - startId + 1) * 2; // sprites + cries
        let loadedResources = 0;
        
        // Create array of Pokemon IDs
        const pokemonIds = Array.from(
          { length: endId - startId + 1 },
          (_, i) => startId + i
        );

        // Split IDs into batches
        const batches = [];
        for (let i = 0; i < pokemonIds.length; i += BATCH_SIZE) {
          batches.push(pokemonIds.slice(i, i + BATCH_SIZE));
        }

        // Process batches sequentially
        for (const batch of batches) {
          // Preload sprites for this batch
          const spritePromises = batch.map(id => {
            const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;
            return new Promise<boolean>((resolve) => {
              const img = new Image();
              img.onload = () => {
                loadedResources++;
                setProgress(Math.round((loadedResources / totalResources) * 100));
                resolve(true);
              };
              img.onerror = () => {
                loadedResources++;
                setProgress(Math.round((loadedResources / totalResources) * 100));
                resolve(false);
              };
              img.src = spriteUrl;
            });
          });

          // Preload cries for this batch
          const cryPromises = batch.map(id => {
            const cryUrl = `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
            return new Promise<boolean>((resolve) => {
              const audio = new Audio();
              audio.oncanplaythrough = () => {
                loadedResources++;
                setProgress(Math.round((loadedResources / totalResources) * 100));
                resolve(true);
              };
              audio.onerror = () => {
                loadedResources++;
                setProgress(Math.round((loadedResources / totalResources) * 100));
                resolve(false);
              };
              audio.src = cryUrl;
              audio.preload = 'auto';
            });
          });

          // Wait for current batch to complete before moving to next
          await Promise.all([...spritePromises, ...cryPromises]);
        }
        
        setIsLoading(false);
        onComplete?.();
      } catch (error) {
        console.error('Error preloading resources:', error);
        // Continue even if preloading fails
        setIsLoading(false);
        onComplete?.();
      }
    };

    preloadResources();
  }, [generation, onComplete]);

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
        <div className="text-center">
          <div className="pokeball-loading mx-auto">
            <div className="outer-circle" />
            <div className="center-circle" />
          </div>
          <p className="text-white mt-4 font-medium">Loading Pokémon resources...</p>
          <div className="mt-2 w-64 h-2 bg-gray-700 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-white/80 text-sm mt-1">{progress}%</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}; 