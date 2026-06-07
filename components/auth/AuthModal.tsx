/**
 * components/auth/AuthModal.tsx — Supabase OTP sign-in portal modal.
 *
 * Phase 2: real OTP via Supabase Auth (`signInWithOtp` / `verifyOtp`).
 * Supports phone (SMS) or email (magic-link OTP). The UX is unchanged from the
 * Phase-1 prototype port — same two-step phone → code flow, same inline styles.
 *
 * SUCCESS FLOW:
 *   verifyOtp → Supabase sets session cookie (via @supabase/ssr) → middleware
 *   refreshes on next request → store hydrates real user from session.
 *   app.setAuthed(true, user) syncs Zustand for immediate UI update.
 */

'use client';

import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';

import { Icon } from '@/components/icons/Icon';
import { Button } from '@/components/primitives';
import { createSupabaseClient } from '@/lib/supabase/client';
import { ROUTES } from '@/lib/nav';
import { useApp } from '@/lib/store';
import STRINGS from '@/lib/strings';
import type { User } from '@/types';

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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setStep('phone');
      setVal('');
      setOtp('');
      setError('');
    }
  }, [open]);

  if (!mounted || !open) return null;

  const supabase = createSupabaseClient();

  const isPhone = /^\+?\d/.test(val.trim());

  const sendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const input = val.trim();
      const { error: err } = isPhone
        ? await supabase.auth.signInWithOtp({ phone: input })
        : await supabase.auth.signInWithOtp({ email: input });
      if (err) throw err;
      setStep('otp');
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to send code');
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const input = val.trim();
      const { data, error: err } = isPhone
        ? await supabase.auth.verifyOtp({ phone: input, token: otp, type: 'sms' })
        : await supabase.auth.verifyOtp({ email: input, token: otp, type: 'email' });
      if (err) throw err;

      const supaUser = data.user;
      if (!supaUser) throw new Error('No user returned');

      // Upsert profile row (created_at epoch ms)
      await supabase.from('profiles').upsert({
        id: supaUser.id,
        phone: supaUser.phone ?? null,
        created_at: Date.now(),
      });

      // Upsert wallet (seed defaults enforced by DB; upsert won't overwrite existing)
      await supabase.from('wallets').upsert({ user_id: supaUser.id }, { ignoreDuplicates: true });

      // Upsert settings
      await supabase.from('settings').upsert({ user_id: supaUser.id }, { ignoreDuplicates: true });

      // Upsert vip
      await supabase.from('vip').upsert({ user_id: supaUser.id }, { ignoreDuplicates: true });

      const user: User = {
        id: supaUser.id,
        handle: supaUser.phone ?? supaUser.email ?? 'Player',
        contact: supaUser.phone ?? supaUser.email ?? '',
        joinedAt: new Date(supaUser.created_at).getTime(),
        kycLevel: 0,
        vipLevel: 0,
      };

      app.setAuthed(true, user);
      app.pushToast(STRINGS.auth.welcome, 'success');
      onClose();
      router.push(ROUTES.home);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
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
        {error && (
          <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{error}</div>
        )}
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
              disabled={val.length < 3 || loading}
              onClick={sendOtp}
            >
              {loading ? 'Sending…' : STRINGS.auth.sendOtp}
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
            <Button
              full
              size="lg"
              style={{ marginTop: 14 }}
              disabled={otp.length < 4 || loading}
              onClick={verifyOtp}
            >
              {loading ? 'Verifying…' : STRINGS.auth.verify}
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
