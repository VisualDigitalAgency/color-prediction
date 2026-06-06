/**
 * components/auth/AuthModal.tsx — simulated (demo) sign-in / OTP portal modal.
 *
 * Ported from the CDN React 18 prototype (`/tmp/proto_extract/web/web-shell.jsx`
 * `AuthModal`). Pass A (inline-parity): every `style={{…}}` object is byte-identical
 * to the prototype — the centered fixed overlay, the 420px card, the `webInput`
 * field style — all referencing `var(--…)`, never hardcoded hex. Tailwind is Pass B.
 *
 * This is a SIMULATED/DEMO auth: there is no real backend or OTP. Any phone/email
 * (≥3 chars) advances to the code step, and any code confirms — the copy says so
 * (`auth.otpPrompt` mirrors the prototype's "demo: anything works" intent via the
 * landing/strings disclaimer).
 *
 * SUCCESS FLOW (ADR 0003 routing):
 *   On "Verify & enter" → `app.setAuthed(true, demoUser)` writes the authed flag +
 *   a demo `User` into the store, a welcome toast fires, the modal closes, and the
 *   real App Router pushes `/lobby` (ROUTES.home). The prototype's
 *   `app.navigate('home')` is replaced by `router.push`.
 *
 * SSR-safe: rendered via a `createPortal` that is mount-gated — it returns `null`
 * until the client mounts, so there's no SSR/first-paint markup to mismatch.
 */

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/primitives';
import { ROUTES } from '@/lib/nav';
import { useApp } from '@/lib/store';
import STRINGS from '@/lib/strings';
import type { User } from '@/types';

/** Field style — byte-identical port of the prototype `webInput`. */
const webInput: React.CSSProperties = {
  width: '100%',
  background: 'var(--bg)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius-sm)',
  padding: '14px 16px',
  color: 'var(--text)',
  fontSize: 15,
  fontWeight: 600,
  fontFamily: 'inherit',
  outline: 'none',
  boxSizing: 'border-box',
};

export interface AuthModalProps {
  open?: boolean;
  onClose: () => void;
}

export function AuthModal({ open, onClose }: AuthModalProps) {
  const app = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<'phone' | 'otp'>('phone');
  const [val, setVal] = useState('');
  const [otp, setOtp] = useState('');

  // Portal mount-gate: only render into document.body after the client mounts,
  // so the server-rendered tree has nothing to mismatch.
  useEffect(() => setMounted(true), []);

  // Reset the flow each time the modal is freshly opened.
  useEffect(() => {
    if (open) {
      setStep('phone');
      setVal('');
      setOtp('');
    }
  }, [open]);

  if (!mounted || !open) return null;

  // Success: mark authed + demo user, toast, close, and route to the lobby.
  const enter = () => {
    const demoUser: User = {
      id: 'demo',
      handle: 'Player',
      contact: val || 'demo@aurawin.gg',
      joinedAt: Date.now(),
      kycLevel: 1,
      vipLevel: 1,
    };
    app.setAuthed(true, demoUser);
    app.pushToast(STRINGS.auth.welcome, 'success');
    onClose();
    router.push(ROUTES.home);
  };

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        background: 'rgba(2,2,8,.7)',
        backdropFilter: 'blur(6px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        animation: 'fadeIn .2s',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 420,
          maxWidth: '90vw',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 'var(--radius)',
          padding: 30,
          boxShadow: 'var(--card-shadow)',
          animation: 'popIn .3s',
        }}
      >
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: 'var(--header-grad)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 18,
            boxShadow: 'var(--glow-accent)',
          }}
        >
          {Icon.target({ size: 26, color: 'var(--accent-ink)' })}
        </div>
        <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
          {step === 'phone' ? STRINGS.auth.welcomeBack : STRINGS.auth.verifyCode}
        </div>
        <div style={{ fontSize: 14, color: 'var(--text-mute)', margin: '6px 0 22px' }}>
          {step === 'phone' ? STRINGS.auth.signInPrompt : STRINGS.auth.otpPrompt}
        </div>
        {step === 'phone' ? (
          <div>
            <input
              value={val}
              onChange={(e) => setVal(e.target.value)}
              placeholder={STRINGS.auth.phonePlaceholder}
              style={webInput}
            />
            <Button
              full
              size="lg"
              style={{ marginTop: 14 }}
              disabled={val.length < 3}
              onClick={() => setStep('otp')}
            >
              {STRINGS.auth.sendOtp}
            </Button>
          </div>
        ) : (
          <div>
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
              placeholder={STRINGS.auth.otpPlaceholder}
              style={{ ...webInput, letterSpacing: '8px', textAlign: 'center', fontSize: 22 }}
            />
            <Button full size="lg" style={{ marginTop: 14 }} onClick={enter}>
              {STRINGS.auth.verify}
            </Button>
          </div>
        )}
        <div style={{ fontSize: 11.5, color: 'var(--text-mute)', textAlign: 'center', marginTop: 18 }}>
          {STRINGS.auth.legalFooter}
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default AuthModal;
