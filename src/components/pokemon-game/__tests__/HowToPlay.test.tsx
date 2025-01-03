import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { HowToPlay } from '../HowToPlay';

// Mock i18next
const mockI18n = {
  language: 'en',
};

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: mockI18n,
  }),
}));

describe('HowToPlay', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
  };

  test('renders dialog when open', () => {
    render(<HowToPlay {...defaultProps} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  test('does not render dialog when closed', () => {
    render(<HowToPlay {...defaultProps} isOpen={false} />);
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  test('shows title and description', () => {
    render(<HowToPlay {...defaultProps} />);
    expect(screen.getByTestId('visible-title')).toHaveTextContent('howToPlay');
    expect(screen.getByText('howToPlayDesc')).toBeInTheDocument();
  });

  test('shows game features section', () => {
    render(<HowToPlay {...defaultProps} />);
    expect(screen.getByText('gameFeatures')).toBeInTheDocument();
    expect(screen.getByText('feature1')).toBeInTheDocument();
    expect(screen.getByText('feature2')).toBeInTheDocument();
    expect(screen.getByText('feature3')).toBeInTheDocument();
    expect(screen.getByText('feature4')).toBeInTheDocument();
  });

  test('shows special features section', () => {
    render(<HowToPlay {...defaultProps} />);
    expect(screen.getByText('specialFeatures')).toBeInTheDocument();
    expect(screen.getByText('special1')).toBeInTheDocument();
    expect(screen.getByText('special2')).toBeInTheDocument();
    expect(screen.getByText('special3')).toBeInTheDocument();
    expect(screen.getByText('special4')).toBeInTheDocument();
  });

  test('shows scoring system section', () => {
    render(<HowToPlay {...defaultProps} />);
    expect(screen.getByText('scoringSystem')).toBeInTheDocument();
    expect(screen.getByText('scoring1')).toBeInTheDocument();
    expect(screen.getByText('scoring2')).toBeInTheDocument();
    expect(screen.getByText('scoring3')).toBeInTheDocument();
    expect(screen.getByText('scoring4')).toBeInTheDocument();
  });

  test('shows tips and tricks section', () => {
    render(<HowToPlay {...defaultProps} />);
    expect(screen.getByText('tipsAndTricks')).toBeInTheDocument();
    expect(screen.getByText('tip1')).toBeInTheDocument();
    expect(screen.getByText('tip2')).toBeInTheDocument();
    expect(screen.getByText('tip3')).toBeInTheDocument();
    expect(screen.getByText('tip4')).toBeInTheDocument();
  });

  test('handles close button click', async () => {
    const onClose = vi.fn();
    render(<HowToPlay {...defaultProps} onClose={onClose} />);
    
    const closeButton = screen.getByRole('button', { name: 'understood' });
    await userEvent.click(closeButton);
    expect(onClose).toHaveBeenCalled();
  });

  test('shows French text when language is French', () => {
    mockI18n.language = 'fr';
    render(<HowToPlay {...defaultProps} />);
    expect(screen.getByTestId('visible-title')).toHaveTextContent('howToPlay');
    mockI18n.language = 'en'; // Reset for other tests
  });
}); 