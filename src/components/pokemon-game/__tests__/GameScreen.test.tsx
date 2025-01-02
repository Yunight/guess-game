import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '../../../test/test-utils';
import { GameScreen } from '../GameScreen';
import { Pokemon } from '../types';
import { createRef } from 'react';

// Mock HTMLMediaElement
window.HTMLMediaElement.prototype.load = vi.fn();
window.HTMLMediaElement.prototype.play = vi.fn();
window.HTMLMediaElement.prototype.pause = vi.fn();

// Mock UI components
vi.mock('@/components/ui/card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div className={className}>{children}</div>
  ),
}));

vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, 'data-testid': testId }: { 
    children: React.ReactNode; 
    onClick?: () => void; 
    className?: string;
    'data-testid'?: string;
  }) => (
    <button onClick={onClick} className={className} data-testid={testId}>{children}</button>
  ),
}));

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

// Mock props
const mockProps = {
  currentPokemon: mockPokemon,
  isPokemonLoading: false,
  isCorrect: null,
  score: 0,
  guessTimeLeft: 30,
  hintsLeft: 3,
  guess: '',
  handleGuessChange: vi.fn(),
  handleKeyDown: vi.fn(),
  suggestions: [],
  handleSuggestionClick: vi.fn(),
  highlightedIndex: -1,
  showHint: false,
  useHint: vi.fn(),
  inputRef: createRef<HTMLInputElement>(),
  suggestionsRef: createRef<HTMLDivElement>(),
  formatTime: (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`,
  isMuted: false,
  setIsMuted: vi.fn(),
  totalTimeElapsed: 0,
  bestScore: 0,
  bestTime: 0,
  onQuit: vi.fn(),
  isHardMode: false,
  showCriticalSuccess: false,
  showCriticalHit: false,
  showHypeTrain: false,
  consecutiveFastAnswers: 0,
  pointsEarned: 0,
  remainingCount: 5,
  totalCount: 10
};

describe('GameScreen', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders basic game elements', () => {
    render(<GameScreen {...mockProps} />);
    
    // Check for Pokemon display
    expect(screen.getByAltText('Pikachu')).toBeInTheDocument();
    
    // Check for timer
    expect(screen.getByText('0:00')).toBeInTheDocument();
    
    // Check for Pokemon number
    expect(screen.getByText('#025')).toBeInTheDocument();
    
    // Check for quit button in non-hard mode
    expect(screen.getByText('Quitter')).toBeInTheDocument();
  });

  it('hides quit button in hard mode', () => {
    render(<GameScreen {...mockProps} isHardMode={true} />);
    expect(screen.queryByText('Quitter')).not.toBeInTheDocument();
  });

  it('toggles mute when clicking sound button', () => {
    render(<GameScreen {...mockProps} />);
    
    const soundButton = screen.getByTestId('volume-toggle-button');
    fireEvent.click(soundButton);
    
    expect(mockProps.setIsMuted).toHaveBeenCalledWith(true);
  });

  it('shows critical success message', () => {
    render(<GameScreen {...mockProps} showCriticalSuccess={true} />);
    expect(screen.getByText('criticalSuccess')).toBeInTheDocument();
  });

  it('shows critical hit message', () => {
    render(<GameScreen {...mockProps} showCriticalHit={true} />);
    expect(screen.getByText('criticalHit')).toBeInTheDocument();
  });

  it('shows hype train message with consecutive answers', () => {
    render(
      <GameScreen 
        {...mockProps} 
        showHypeTrain={true} 
        consecutiveFastAnswers={3}
      />
    );
    expect(screen.getByText('hypeTrain')).toBeInTheDocument();
  });

  it('handles guess input', () => {
    render(<GameScreen {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.change(input, { target: { value: 'pika' } });
    
    expect(mockProps.handleGuessChange).toHaveBeenCalled();
  });

  it('handles key down events', () => {
    render(<GameScreen {...mockProps} />);
    
    const input = screen.getByRole('textbox');
    fireEvent.keyDown(input, { key: 'Enter' });
    
    expect(mockProps.handleKeyDown).toHaveBeenCalled();
  });
}); 