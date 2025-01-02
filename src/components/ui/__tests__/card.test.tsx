import { render, screen } from '@testing-library/react';
import { describe, expect, test } from 'vitest';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../card';

describe('Card', () => {
  test('renders card with content', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Test Title</CardTitle>
          <CardDescription>Test Description</CardDescription>
        </CardHeader>
        <CardContent>Test Content</CardContent>
        <CardFooter>Test Footer</CardFooter>
      </Card>
    );

    expect(screen.getByText('Test Title')).toBeInTheDocument();
    expect(screen.getByText('Test Description')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
    expect(screen.getByText('Test Footer')).toBeInTheDocument();
  });

  test('renders card with custom className', () => {
    render(
      <Card className="custom-class">
        <CardContent>Test Content</CardContent>
      </Card>
    );

    const card = screen.getByText('Test Content').closest('.custom-class');
    expect(card).toBeInTheDocument();
  });

  test('renders card header with custom className', () => {
    render(
      <Card>
        <CardHeader className="custom-header">
          <CardTitle>Test Title</CardTitle>
        </CardHeader>
      </Card>
    );

    const header = screen.getByText('Test Title').closest('div');
    expect(header?.parentElement).toHaveClass('custom-header');
  });

  test('renders card content with custom className', () => {
    render(
      <Card>
        <CardContent className="custom-content">Test Content</CardContent>
      </Card>
    );

    const content = screen.getByText('Test Content').closest('div');
    expect(content).toHaveClass('custom-content');
  });

  test('renders card footer with custom className', () => {
    render(
      <Card>
        <CardFooter className="custom-footer">Test Footer</CardFooter>
      </Card>
    );

    const footer = screen.getByText('Test Footer').closest('div');
    expect(footer).toHaveClass('custom-footer');
  });
}); 