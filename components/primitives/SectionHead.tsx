/**
 * components/primitives/SectionHead.tsx
 *
 * Ported VERBATIM from the CDN prototype (`/tmp/proto_extract/app/components.jsx`).
 * Pass A (inline-parity): style objects byte-identical; only `createElement` → JSX
 * plus prop types. The optional action renders a `<button>`, so when `onAction` is
 * supplied this is interactive — but it carries no hooks, so it can remain a server
 * component (the handler is wired by the parent client component).
 */

import * as React from 'react';

import { Icon } from '@/components/icons/Icon';

export interface SectionHeadProps {
  title: React.ReactNode;
  action?: React.ReactNode;
  onAction?: React.MouseEventHandler<HTMLButtonElement>;
}

export function SectionHead({ title, action, onAction }: SectionHeadProps) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '2px 2px 10px',
      }}
    >
      <div
        style={{
          fontSize: 15,
          fontWeight: 700,
          color: 'var(--text)',
          letterSpacing: '.2px',
        }}
      >
        {title}
      </div>
      {action && (
        <button
          onClick={onAction}
          style={{
            background: 'none',
            border: 'none',
            color: 'var(--accent-2)',
            fontSize: 12.5,
            fontWeight: 600,
            fontFamily: 'inherit',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
          }}
        >
          {action}
          {Icon.chevR({ size: 13 })}
        </button>
      )}
    </div>
  );
}

export default SectionHead;
