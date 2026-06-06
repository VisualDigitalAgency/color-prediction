// @vitest-environment jsdom
import * as React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ResultBall, numColorStyle } from './ResultBall';
import STRINGS from '@/lib/strings';

// ── numColorStyle (pure function) ─────────────────────────────────────────────

describe('numColorStyle', () => {
  it('0 → gradient with --red and --violet (split)', () => {
    const s = numColorStyle(0);
    expect(s).toContain('var(--red)');
    expect(s).toContain('var(--violet)');
    expect(s).toContain('linear-gradient');
  });

  it('5 → gradient with --green and --violet (split)', () => {
    const s = numColorStyle(5);
    expect(s).toContain('var(--green)');
    expect(s).toContain('var(--violet)');
    expect(s).toContain('linear-gradient');
  });

  it.each([1, 3, 7, 9])('digit %i → var(--green)', (n) => {
    expect(numColorStyle(n)).toBe('var(--green)');
  });

  it.each([2, 4, 6, 8])('digit %i → var(--red)', (n) => {
    expect(numColorStyle(n)).toBe('var(--red)');
  });
});

// ── ResultBall rendering ──────────────────────────────────────────────────────

describe('ResultBall', () => {
  it('renders the number', () => {
    render(<ResultBall num={7} />);
    expect(screen.getByText('7')).toBeInTheDocument();
  });

  it('renders a cue badge with aria-label', () => {
    render(<ResultBall num={1} />);
    const badge = screen.getByLabelText(STRINGS.colorBlindShort.green);
    expect(badge).toBeInTheDocument();
  });

  it('badge is not aria-hidden (accessibility requirement)', () => {
    render(<ResultBall num={2} />);
    const badge = screen.getByLabelText(STRINGS.colorBlindShort.red);
    expect(badge).toHaveAttribute('aria-hidden', 'false');
  });

  it('digit 0 badge shows red+violet cue', () => {
    render(<ResultBall num={0} />);
    const expected = STRINGS.colorBlindShort.red + STRINGS.colorBlindShort.violet;
    expect(screen.getByLabelText(expected)).toBeInTheDocument();
  });

  it('digit 5 badge shows green+violet cue', () => {
    render(<ResultBall num={5} />);
    const expected = STRINGS.colorBlindShort.green + STRINGS.colorBlindShort.violet;
    expect(screen.getByLabelText(expected)).toBeInTheDocument();
  });

  it.each([1, 3, 7, 9])('digit %i badge is G', (n) => {
    render(<ResultBall num={n} />);
    expect(screen.getByLabelText(STRINGS.colorBlindShort.green)).toBeInTheDocument();
  });

  it.each([2, 4, 6, 8])('digit %i badge is R', (n) => {
    render(<ResultBall num={n} />);
    expect(screen.getByLabelText(STRINGS.colorBlindShort.red)).toBeInTheDocument();
  });

  it('glow=false sets boxShadow to none', () => {
    render(<ResultBall num={3} glow={false} />);
    const el = screen.getByText('3').closest('div') as HTMLElement;
    expect(el.style.boxShadow).toBe('none');
  });

  it('size prop controls width and height', () => {
    render(<ResultBall num={4} size={50} />);
    const el = screen.getByText('4').closest('div') as HTMLElement;
    expect(el.style.width).toBe('50px');
    expect(el.style.height).toBe('50px');
  });
});
