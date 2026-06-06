// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Card } from './Card';

describe('Card', () => {
  it('renders children', () => {
    render(<Card>Card content</Card>);
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('uses var(--surface) background', () => {
    const { container } = render(<Card>X</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.style.background).toBe('var(--surface)');
  });

  it('glow=false uses var(--card-shadow)', () => {
    const { container } = render(<Card glow={false}>X</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.style.boxShadow).toBe('var(--card-shadow)');
  });

  it('glow=true uses var(--glow-accent)', () => {
    const { container } = render(<Card glow>X</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.style.boxShadow).toBe('var(--glow-accent)');
  });

  it('pad prop sets padding', () => {
    const { container } = render(<Card pad={32}>X</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.style.padding).toBe('32px');
  });

  it('calls onClick when clicked', () => {
    const handler = vi.fn();
    render(<Card onClick={handler}>Click</Card>);
    fireEvent.click(screen.getByText('Click'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('style prop merges into the container', () => {
    const { container } = render(<Card style={{ color: 'red' }}>X</Card>);
    const div = container.firstChild as HTMLElement;
    expect(div.style.color).toBe('red');
  });
});
