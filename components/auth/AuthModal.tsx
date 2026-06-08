/**
 * components/auth/AuthModal.tsx — Supabase sign-in portal modal.
 *
 * Phone → 6-digit SMS OTP (signInWithOtp + verifyOtp type:'sms')
 * Email → magic link (signInWithOtp sends a sign-in link to the inbox).
 *         Once Supabase custom SMTP is configured, the Magic Link template
 *         can be changed to {{ .Token }} to send a 6-digit code instead.
 *
 * The magic-link callback is handled by /auth/callback (PKCE flow via
 * @supabase/ssr). For now the email step shows a "check your inbox" screen
 * rather than a code entry field.
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

// Single client instance per page — avoids re-creating on every render
const supabase = createSupabaseClient();

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

type Step = 'contact' | 'otp' | 'magic-link-sent' | 'google-loading';

export function AuthModal({ open, onClose }: AuthModalProps) {
  const app = useApp();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<Step>('contact');
  const [val, setVal] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (open) {
      setStep('contact');
      setVal('');
      setOtp('');
      setError('');
    }
  }, [open]);

  if (!mounted || !open) return null;

  // Phone: starts with + or a digit. Email: anything else.
  const isPhone = /^\+?\d/.test(val.trim());

  const sendOtp = async () => {
    setLoading(true);
    setError('');
    try {
      const input = val.trim();
      if (isPhone) {
        // SMS: Supabase sends a 6-digit code directly
        const { error: err } = await supabase.auth.signInWithOtp({ phone: input });
        if (err) throw err;
        setStep('otp');
      } else {
        // Email: sends a 6-digit OTP via custom SMTP template using {{ .Token }}
        const { error: err } = await supabase.auth.signInWithOtp({
          email: input,
          options: { shouldCreateUser: true },
        });
        if (err) throw err;
        setStep('otp');
      }
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
      const otpPayload = isPhone
        ? { phone: input, token: otp, type: 'sms' as const }
        : { email: input, token: otp, type: 'email' as const };
      const { data, error: err } = await supabase.auth.verifyOtp(otpPayload);
      if (err) throw err;

      const supaUser = data.user;
      if (!supaUser) throw new Error('No user returned');

      await provisionUserRows(supaUser.id, supaUser.phone ?? null);

      const user = buildUser(supaUser);
      app.setAuthed(true, user);
      app.pushToast(STRINGS.auth.welcome, 'success');
      onClose();
      router.refresh();
      router.push(ROUTES.home);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    setLoading(true);
    setError('');
    setStep('google-loading');
    try {
      const { error: err } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=/lobby`,
        },
      });
      if (err) throw err;
      // Browser will redirect — no further action needed here
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Google sign-in failed');
      setStep('contact');
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
        {/* Icon */}
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

        {step === 'contact' && (
          <>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
              {STRINGS.auth.welcomeBack}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-mute)', margin: '6px 0 22px' }}>
              {STRINGS.auth.signInPrompt}
            </div>
            {error && (
              <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{error}</div>
            )}
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

            {/* Divider */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '18px 0 14px' }}>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-mute)', fontWeight: 600 }}>
                {STRINGS.auth.orDivider}
              </span>
              <div style={{ flex: 1, height: 1, background: 'var(--border)' }} />
            </div>

            {/* Google OAuth button */}
            <button
              disabled={loading}
              onClick={signInWithGoogle}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 10,
                padding: '12px 16px',
                background: '#fff',
                border: '1px solid #dadce0',
                borderRadius: 'var(--radius-sm)',
                color: '#3c4043',
                fontSize: 14,
                fontWeight: 600,
                fontFamily: 'inherit',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.6 : 1,
                transition: 'box-shadow .15s',
              }}
              onMouseEnter={(e) => { if (!loading) (e.currentTarget as HTMLButtonElement).style.boxShadow = '0 1px 6px rgba(32,33,36,.28)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.boxShadow = 'none'; }}
            >
              {/* Google "G" SVG logo */}
              <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
                <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.875 2.684-6.615z"/>
                <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.184l-2.908-2.258c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                <path fill="#FBBC05" d="M3.964 10.707A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.707V4.961H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.039l3.007-2.332z"/>
                <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.961L3.964 6.293C4.672 4.166 6.656 3.58 9 3.58z"/>
              </svg>
              {STRINGS.auth.continueWithGoogle}
            </button>
          </>
        )}

        {step === 'google-loading' && (
          <div style={{ textAlign: 'center', padding: '24px 0' }}>
            <div style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>
              Redirecting to Google…
            </div>
            <div style={{ fontSize: 13, color: 'var(--text-mute)' }}>
              You'll be returned here after signing in.
            </div>
          </div>
        )}

        {step === 'otp' && (
          <>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
              {STRINGS.auth.verifyCode}
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-mute)', margin: '6px 0 22px' }}>
              Enter the 8-digit code sent to {val}
            </div>
            {error && (
              <div style={{ fontSize: 13, color: 'var(--red)', marginBottom: 12 }}>{error}</div>
            )}
            <input
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
              placeholder="00000000"
              style={{ ...webInput, letterSpacing: '8px', textAlign: 'center', fontSize: 22 }}
            />
            <Button
              full
              size="lg"
              style={{ marginTop: 14 }}
              disabled={otp.length < 8 || loading}
              onClick={verifyOtp}
            >
              {loading ? 'Verifying…' : STRINGS.auth.verify}
            </Button>
            <button
              onClick={() => { setStep('contact'); setOtp(''); setError(''); }}
              style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 13, cursor: 'pointer' }}
            >
              ← Use a different {isPhone ? 'number' : 'email'}
            </button>
          </>
        )}

        {step === 'magic-link-sent' && (
          <>
            <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)' }}>
              Check your inbox
            </div>
            <div style={{ fontSize: 14, color: 'var(--text-mute)', margin: '6px 0 22px', lineHeight: 1.6 }}>
              We sent a sign-in link to <strong style={{ color: 'var(--text)' }}>{val}</strong>.
              Click the link in your email to log in — it expires in 1 hour.
            </div>
            <Button full size="lg" onClick={onClose}>
              Close
            </Button>
            <button
              onClick={() => { setStep('contact'); setVal(''); setError(''); }}
              style={{ display: 'block', margin: '14px auto 0', background: 'none', border: 'none', color: 'var(--text-mute)', fontSize: 13, cursor: 'pointer' }}
            >
              ← Use a different email
            </button>
          </>
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

// ── helpers ───────────────────────────────────────────────────────────────────

async function provisionUserRows(userId: string, phone: string | null) {
  await Promise.all([
    supabase.from('profiles').upsert({ id: userId, phone, created_at: Date.now() }),
    supabase.from('wallets').upsert({ user_id: userId }, { ignoreDuplicates: true }),
    supabase.from('settings').upsert({ user_id: userId }, { ignoreDuplicates: true }),
    supabase.from('vip').upsert({ user_id: userId }, { ignoreDuplicates: true }),
  ]);
}

function buildUser(supaUser: { id: string; phone?: string | null; email?: string | null; created_at: string }): User {
  return {
    id: supaUser.id,
    handle: supaUser.phone ?? supaUser.email ?? 'Player',
    contact: supaUser.phone ?? supaUser.email ?? '',
    joinedAt: new Date(supaUser.created_at).getTime(),
    kycLevel: 0,
    vipLevel: 0,
  };
}
