// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SectionHead } from './SectionHead';

describe('SectionHead', () => {
  it('renders the title', () => {
    render(<SectionHead title="My Section" />);
    expect(screen.getByText('My Section')).toBeInTheDocument();
  });

  it('renders no button when action is not supplied', () => {
    render(<SectionHead title="No action" />);
    expect(screen.queryByRole('button')).not.toBeInTheDocument();
  });

  it('renders a button when action is supplied', () => {
    render(<SectionHead title="With action" action="View all" />);
    expect(screen.getByRole('button')).toBeInTheDocument();
    expect(screen.getByText('View all')).toBeInTheDocument();
  });

  it('calls onAction when action button is clicked', () => {
    const handler = vi.fn();
    render(<SectionHead title="Head" action="Go" onAction={handler} />);
    fireEvent.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalledOnce();
  });

  it('accepts ReactNode as title', () => {
    render(<SectionHead title={<span data-testid="custom-title">Custom</span>} />);
    expect(screen.getByTestId('custom-title')).toBeInTheDocument();
  });
});
