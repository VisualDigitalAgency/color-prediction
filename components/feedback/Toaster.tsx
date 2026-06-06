/**
 * components/feedback/Toaster.tsx — transient toast stack.
 *
 * Ported from the CDN prototype (`/tmp/proto_extract/app/components.jsx`).
 * Pass A (inline-parity): every `style` object — including the `toastIn`
 * keyframe and the per-kind left-border tint — is byte-identical to the
 * prototype; only `createElement` → JSX plus types, and the store read moved
 * from `window.useApp()` to the real `useApp()` hook.
 *
 * Renders through a portal to `document.body` so the stack escapes any
 * transformed/overflow-clipped ancestor. SSR-safe: the portal target is only
 * resolved after mount (no `document` access during render / on the server),
 * so first render emits nothing and there is no hydration mismatch.
 */

'use client';

import * as React from 'react';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { useApp } from '@/lib/store';
import type { ToastKind } from '@/lib/store';

const tint: Record<ToastKind, string> = {
  success: 'var(--green)',
  error: 'var(--red)',
  info: 'var(--accent-2)',
};

export function Toaster() {
  const app = useApp();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const node = (
    <div
      aria-live="polite"
      style={{
        position: 'absolute',
        top: 54,
        left: 0,
        right: 0,
        zIndex: 80,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
        pointerEvents: 'none',
      }}
    >
      {app.toasts.map((t) => (
        <div
          key={t.id}
          style={{
            background: 'var(--surface-2)',
            border: '1px solid var(--border)',
            borderLeft: `3px solid ${tint[t.kind]}`,
            color: 'var(--text)',
            padding: '10px 16px',
            borderRadius: 12,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 10px 30px -8px rgba(0,0,0,.6)',
            animation: 'toastIn .3s',
            maxWidth: '86%',
          }}
        >
          {t.msg}
        </div>
      ))}
    </div>
  );

  if (!mounted) return null;
  return createPortal(node, document.body);
}

export default Toaster;
