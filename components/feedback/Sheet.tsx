/**
 * components/feedback/Sheet.tsx — bottom-sheet / modal.
 *
 * Ported VERBATIM from the CDN prototype (`/tmp/proto_extract/app/components.jsx`).
 * Pass A (inline-parity): every `style` object is byte-identical to the prototype
 * (including the `sheetUp` / `fadeIn` keyframe animations); only `createElement`
 * → JSX plus prop types. `'use client'` because it renders interactive handlers
 * (onClick / stopPropagation) and conditionally returns null.
 */

'use client';

import * as React from 'react';

export interface SheetProps {
  open?: boolean;
  onClose?: () => void;
  children?: React.ReactNode;
  title?: React.ReactNode;
}

export function Sheet({ open, onClose, children, title }: SheetProps) {
  if (!open) return null;
  return (
    <div
      onClick={onClose}
      style={{
        position: 'absolute',
        inset: 0,
        zIndex: 60,
        background: 'rgba(0,0,0,.55)',
        display: 'flex',
        alignItems: 'flex-end',
        animation: 'fadeIn .2s',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: '100%',
          background: 'var(--bg)',
          borderTop: '1px solid var(--border)',
          borderRadius: '26px 26px 0 0',
          padding: '10px 18px calc(26px + env(safe-area-inset-bottom,22px))',
          maxHeight: '82%',
          overflowY: 'auto',
          animation: 'sheetUp .32s cubic-bezier(.2,.9,.3,1)',
        }}
      >
        <div
          style={{
            width: 38,
            height: 4,
            borderRadius: 4,
            background: 'var(--text-mute)',
            opacity: 0.5,
            margin: '4px auto 14px',
          }}
        />
        {title && (
          <div
            style={{
              fontSize: 17,
              fontWeight: 800,
              color: 'var(--text)',
              marginBottom: 14,
            }}
          >
            {title}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}

export default Sheet;
