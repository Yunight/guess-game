import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '../../../test/test-utils';
import { PokemonDisplay } from '../PokemonDisplay';
import { Pokemon } from '../types';

// Mock Pokemon data
const mockPokemon: Pokemon = {
  id: 25,
  name: 'pikachu',
  englishName: 'Pikachu',
  frenchName: 'Pikachu',
  frenchFlavorText: "Quand il est en colère, il libère instantanément l'énergie emmagasinée dans les poches de ses joues.",
  englishFlavorText: 'When it is angered, it immediately releases the energy stored in the pouches in its cheeks.',
  sprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png',
  shinySprite: 'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/shiny/25.png',
  isShiny: false,
  evolvesFromSpecies: 'pichu',
  hasEvolution: true,
  evolutionStage: 2,
  isLegendary: false,
  isMythical: false,
  cryUrl: 'https://play.pokemonshowdown.com/audio/cries/pikachu.mp3'
};

// Mock Audio
const mockAudio = {
  play: vi.fn().mockResolvedValue(undefined),
  pause: vi.fn(),
  load: vi.fn().mockResolvedValue(undefined),
  remove: vi.fn(),
  currentTime: 0,
};

global.Audio = vi.fn().mockImplementation(() => mockAudio);

describe('PokemonDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders loading state when Pokemon is loading', () => {
    render(
      <PokemonDisplay
        currentPokemon={undefined}
        isPokemonLoading={true}
        isCorrect={null}
        isMuted={false}
        guessTimeLeft={10}
        remainingCount={5}
        totalCount={10}
      />
    );

    expect(screen.getByText('5/10')).toBeInTheDocument();
    expect(document.querySelector('.pokeball-loading')).toBeInTheDocument();
  });

  it('renders Pokemon in silhouette when not revealed', () => {
    render(
      <PokemonDisplay
        currentPokemon={mockPokemon}
        isPokemonLoading={false}
        isCorrect={null}
        isMuted={false}
        guessTimeLeft={10}
        remainingCount={5}
        totalCount={10}
      />
    );

    const pokemonImage = screen.getByAltText('Pikachu');
    expect(pokemonImage).toBeInTheDocument();
    expect(pokemonImage.className).toContain('brightness-0');
  });

  it('renders revealed Pokemon when correct', () => {
    render(
      <PokemonDisplay
        currentPokemon={mockPokemon}
        isPokemonLoading={false}
        isCorrect={true}
        isMuted={false}
        guessTimeLeft={0}
        remainingCount={5}
        totalCount={10}
      />
    );

    const pokemonImage = screen.getByAltText('Pikachu');
    expect(pokemonImage).toBeInTheDocument();
    expect(pokemonImage.className).not.toContain('brightness-0');
  });

  it('shows shiny badge for shiny Pokemon', () => {
    const shinyPokemon = { ...mockPokemon, isShiny: true };
    render(
      <PokemonDisplay
        currentPokemon={shinyPokemon}
        isPokemonLoading={false}
        isCorrect={null}
        isMuted={false}
        guessTimeLeft={10}
        remainingCount={5}
        totalCount={10}
      />
    );

    // The text could be either in English or French
    const shinyBadge = screen.getByText(/✨ (SHINY|CHROMATIQUE) ✨/);
    expect(shinyBadge).toBeInTheDocument();
  });

  it('does not play sound when muted', () => {
    render(
      <PokemonDisplay
        currentPokemon={mockPokemon}
        isPokemonLoading={false}
        isCorrect={null}
        isMuted={true}
        guessTimeLeft={10}
        remainingCount={5}
        totalCount={10}
      />
    );

    expect(global.Audio).not.toHaveBeenCalled();
  });
}); 