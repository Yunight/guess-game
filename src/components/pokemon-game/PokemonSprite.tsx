import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PokemonSpriteProps {
  pokemonId: number;
  className?: string;
  isRevealed?: boolean;
  name?: string;
}

export const PokemonSprite = ({ pokemonId, className, isRevealed = true }: PokemonSpriteProps) => {
  const [bdspError, setBdspError] = useState(false);
  const [homeError, setHomeError] = useState(false);
  const [regularError, setRegularError] = useState(false);
  
  // Try BDSP sprite first, then Pokemon Home 3D model, then regular sprite
  const bdspUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-viii/bdsp/${pokemonId}.gif`;
  const homeUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${pokemonId}.png`;
  const regularSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${pokemonId}.png`;
  
  // Fallback sprite (Pokeball)
  const fallbackSprite = '/pokeball.svg';

  // Determine which sprite URL to use
  const spriteUrl = regularError ? fallbackSprite : 
                   (homeError ? regularSpriteUrl :
                   (bdspError ? homeUrl : bdspUrl));

  return (
    <div className={cn('relative w-32 h-32 flex items-center justify-center', className)}>
      <img
        src={spriteUrl}

        className={cn(
          'w-44 h-44 object-contain transition-opacity duration-300',
          !isRevealed && 'brightness-0',
          regularError && 'w-16 h-16', // Make fallback image smaller
          'image-rendering-pixelated' // Add pixel-perfect rendering
        )}
        style={{
          imageRendering: 'pixelated',
          transform: 'scale(1.2)', // Slightly larger
          transformOrigin: 'center',
          filter: !regularError ? 'drop-shadow(0 0 2px black) drop-shadow(0 0 2px black) drop-shadow(0 0 2px black) drop-shadow(0 0 2px black)' : 'none' // Quadruple drop-shadow for thicker black outline
        }}
        onError={(e) => {
          if (!bdspError) {
            setBdspError(true);
            e.currentTarget.src = homeUrl;
          } else if (!homeError) {
            setHomeError(true);
            e.currentTarget.src = regularSpriteUrl;
          } else if (!regularError) {
            setRegularError(true);
            e.currentTarget.src = fallbackSprite;
          }
        }}
        loading="lazy"
      />
    </div>
  );
}; 