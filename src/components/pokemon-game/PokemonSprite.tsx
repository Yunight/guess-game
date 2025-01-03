import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PokemonSpriteProps {
  pokemonId: number;
  className?: string;
  isRevealed?: boolean;
}

export const PokemonSprite = ({ pokemonId, className, isRevealed = true }: PokemonSpriteProps) => {
  const [imageError, setImageError] = useState(false);
  const spriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
  
  // Fallback sprite (Pokeball or question mark silhouette)
  const fallbackSprite = '/pokeball.svg';

  return (
    <div className={cn('relative w-32 h-32 flex items-center justify-center', className)}>
      <img
        src={imageError ? fallbackSprite : spriteUrl}
        alt="Pokemon sprite"
        className={cn(
          'w-full h-full object-contain transition-opacity duration-300',
          !isRevealed && 'brightness-0',
          imageError && 'w-16 h-16' // Make fallback image smaller
        )}
        onError={() => setImageError(true)}
        loading="lazy"
      />
    </div>
  );
}; 