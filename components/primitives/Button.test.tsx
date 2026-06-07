// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button', () => {
  it('renders children', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button', { name: 'Click me' })).toBeInTheDocument();
  });

  it('calls onClick when clicked', () => {
    const handler = vi.fn();
    render(<Button onClick={handler}>Go</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('does not call onClick when disabled', () => {
    const handler = vi.fn();
    render(<Button onClick={handler} disabled>Locked</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handler).not.toHaveBeenCalled();
  });

  it('disabled reduces opacity to 0.5', () => {
    render(<Button disabled>Off</Button>);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.style.opacity).toBe('0.5');
  });

  it('full=true sets width to 100%', () => {
    render(<Button full>Wide</Button>);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.style.width).toBe('100%');
  });

  it('size=lg produces larger fontSize than size=sm', () => {
    const { rerender } = render(<Button size="lg">Big</Button>);
    const lg = screen.getByRole('button') as HTMLButtonElement;
    const lgSize = parseFloat(lg.style.fontSize);

    rerender(<Button size="sm">Small</Button>);
    const sm = screen.getByRole('button') as HTMLButtonElement;
    const smSize = parseFloat(sm.style.fontSize);

    expect(lgSize).toBeGreaterThan(smSize);
  });

  it('variant=danger applies --red background', () => {
    render(<Button variant="danger">Delete</Button>);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.style.background).toContain('--red');
  });

  it('variant=ghost sets a border', () => {
    render(<Button variant="ghost">Ghost</Button>);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.style.border).toBeTruthy();
  });

  it('default variant=primary applies header-grad background', () => {
    render(<Button>Default</Button>);
    const btn = screen.getByRole('button') as HTMLButtonElement;
    expect(btn.style.background).toContain('--header-grad');
  });
});
