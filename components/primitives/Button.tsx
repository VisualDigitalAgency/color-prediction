/**
 * components/primitives/Button.tsx
 *
 * Ported VERBATIM from the CDN prototype (`/tmp/proto_extract/app/components.jsx`).
 * Pass A (inline-parity): the `base` / `variants` style objects are byte-identical
 * to the prototype; only `createElement(...)` became JSX and prop types were added.
 * Brand/theme values stay as `var(--…)` — never hardcoded. Tailwind refactor is Pass B.
 */

'use client';

import * as React from 'react';

import { Icon, type IconName } from '@/components/icons/Icon';

export type ButtonVariant = 'primary' | 'solid' | 'ghost' | 'glass' | 'danger';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps {
  children?: React.ReactNode;
  onClick?: React.MouseEventHandler<HTMLButtonElement>;
  variant?: ButtonVariant;
  full?: boolean;
  size?: ButtonSize;
  style?: React.CSSProperties;
  disabled?: boolean;
  icon?: IconName;
}

export function Button({
  children,
  onClick,
  variant = 'primary',
  full,
  size = 'md',
  style,
  disabled,
  icon,
}: ButtonProps) {
  const pad = size === 'lg' ? '15px 22px' : size === 'sm' ? '8px 14px' : '12px 18px';
  const fs = size === 'lg' ? 16 : size === 'sm' ? 13 : 15;
  const base: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: pad,
    fontSize: fs,
    fontWeight: 700,
    borderRadius: 'var(--radius-sm)',
    border: 'none',
    cursor: disabled ? 'default' : 'pointer',
    width: full ? '100%' : undefined,
    fontFamily: 'inherit',
    letterSpacing: '.1px',
    transition: 'transform .12s, filter .2s, opacity .2s',
    opacity: disabled ? 0.5 : 1,
    WebkitTapHighlightColor: 'transparent',
    ...style,
  };
  const variants: Record<ButtonVariant, React.CSSProperties> = {
    primary: {
      background: 'var(--header-grad)',
      color: 'var(--accent-ink)',
      boxShadow: 'var(--glow-accent)',
    },
    solid: { background: 'var(--accent)', color: 'var(--accent-ink)' },
    ghost: {
      background: 'var(--surface-2)',
      color: 'var(--text)',
      border: '1px solid var(--border)',
    },
    glass: {
      background: 'var(--glass)',
      color: 'var(--text)',
      border: '1px solid var(--glass-brd)',
      backdropFilter: 'blur(8px)',
    },
    danger: { background: 'var(--red)', color: '#fff', boxShadow: 'var(--glow-red)' },
  };
  return (
    <button
      onClick={disabled ? undefined : onClick}
      style={{ ...base, ...variants[variant] }}
      onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(.96)')}
      onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
      onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
    >
      {icon && Icon[icon]({ size: fs + 3 })}
      {children}
    </button>
  );
}

export default Button;
