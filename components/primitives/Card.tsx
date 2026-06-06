/**
 * components/primitives/Card.tsx
 *
 * Ported VERBATIM from the CDN prototype (`/tmp/proto_extract/app/components.jsx`).
 * Pass A (inline-parity): style object byte-identical; only `createElement` → JSX
 * plus prop types. Pure markup + styles, so it stays a server component.
 */

import * as React from 'react';

export interface CardProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  pad?: number | string;
  onClick?: React.MouseEventHandler<HTMLDivElement>;
  glow?: boolean;
}

export function Card({ children, style, pad = 16, onClick, glow }: CardProps) {
  return (
    <div
      onClick={onClick}
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius)',
        padding: pad,
        boxShadow: glow ? 'var(--glow-accent)' : 'var(--card-shadow)',
        position: 'relative',
        ...style,
      }}
    >
      {children}
    </div>
  );
}

export default Card;
