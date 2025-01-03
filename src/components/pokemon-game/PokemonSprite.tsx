import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PokemonSpriteProps {
  pokemonId: number;
  className?: string;
  isRevealed?: boolean;
  name?: string;
}

export const PokemonSprite = ({ pokemonId, className, isRevealed = true, name = 'Pokemon' }: PokemonSpriteProps) => {
  const [imageError, setImageError] = useState(false);
  const [animatedError, setAnimatedError] = useState(false);
  
  // Try animated sprite first, fallback to regular sprite
  const animatedSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${pokemonId}.gif`;
  const regularSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
  
  // Fallback sprite (Pokeball or question mark silhouette)
  const fallbackSprite = '/pokeball.svg';

  return (
    <div className={cn('relative w-32 h-32 flex items-center justify-center', className)}>
      <img
        src={imageError ? fallbackSprite : (animatedError ? regularSpriteUrl : animatedSpriteUrl)}
        alt={name}
        className={cn(
          'w-full h-full object-contain transition-opacity duration-300',
          !isRevealed && 'brightness-0',
          imageError && 'w-16 h-16' // Make fallback image smaller
        )}
        onError={(e) => {
          if (!animatedError) {
            setAnimatedError(true);
            e.currentTarget.src = regularSpriteUrl;
          } else {
            setImageError(true);
          }
        }}
        loading="lazy"
      />
    </div>
  );
}; 