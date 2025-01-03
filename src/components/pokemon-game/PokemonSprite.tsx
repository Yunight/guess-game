import { useState } from 'react';
import { cn } from '@/lib/utils';

interface PokemonSpriteProps {
  pokemonId: number;
  className?: string;
  isRevealed?: boolean;
  name?: string;
  isShiny?: boolean;
}

export const PokemonSprite = ({ pokemonId, className, isRevealed = true, name = 'Pokemon', isShiny = false }: PokemonSpriteProps) => {
  const [sugimoriError, setSugimoriError] = useState(false);
  const [homeError, setHomeError] = useState(false);
  const [regularError, setRegularError] = useState(false);
  
  // Try Sugimori artwork first, then Pokemon Home 3D model, then regular sprite
  const sugimoriUrl = `https://img.pokemondb.net/artwork/large/${name.toLowerCase().replace(/[^a-z0-9-]/g, '')}.jpg`;
  const homeUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/home/${isShiny ? 'shiny/' : ''}${pokemonId}.png`;
  const regularSpriteUrl = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${isShiny ? 'shiny/' : ''}${pokemonId}.png`;
  
  // Fallback sprite (Pokeball)
  const fallbackSprite = '/pokeball.svg';

  // Determine which sprite URL to use
  const spriteUrl = regularError ? fallbackSprite : 
                   (homeError ? regularSpriteUrl :
                   (sugimoriError ? homeUrl : sugimoriUrl));

  return (
    <div className={cn('relative w-32 h-32 flex items-center justify-center', className)}>
      <img
        src={spriteUrl}
        alt={name}
        className={cn(
          'w-full h-full object-contain transition-opacity duration-300',
          !isRevealed && 'brightness-0',
          regularError && 'w-16 h-16', // Make fallback image smaller
          !regularError && 'image-rendering-auto' // Better rendering for artwork
        )}
        style={{
          transform: 'scale(1.2)', // Slightly larger
          transformOrigin: 'center',
          filter: !regularError ? 'drop-shadow(0 0 2px black) drop-shadow(0 0 2px black) drop-shadow(0 0 2px black) drop-shadow(0 0 2px black)' : 'none' // Quadruple drop-shadow for thicker black outline
        }}
        onError={(e) => {
          if (!sugimoriError) {
            setSugimoriError(true);
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