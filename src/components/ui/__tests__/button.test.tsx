import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, test, vi } from 'vitest';
import { Button } from '../button';

describe('Button', () => {
  test('renders button with text', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  test('handles click events', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    
    await userEvent.click(screen.getByRole('button', { name: 'Click me' }));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  test('renders disabled button', () => {
    render(<Button disabled>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeDisabled();
  });

  test('renders button with custom className', () => {
    render(<Button className="custom-class">Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toHaveClass('custom-class');
  });

  test('renders button with variant', () => {
    render(<Button variant="secondary">Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toHaveClass('bg-secondary');
  });

  test('renders button with size', () => {
    render(<Button size="sm">Click me</Button>);
    const button = screen.getByRole('button', { name: 'Click me' });
    expect(button).toHaveClass('h-8', 'px-3', 'text-xs');
  });

  test('renders button with icon', () => {
    const Icon = () => <span data-testid="test-icon">Icon</span>;
    render(
      <Button>
        <Icon />
        Click me
      </Button>
    );
    expect(screen.getByTestId('test-icon')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /click me/i })).toBeInTheDocument();
  });
}); 