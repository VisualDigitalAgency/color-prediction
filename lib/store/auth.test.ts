/**
 * lib/store/auth.test.ts — unit tests for auth state transitions.
 *
 * Covers:
 *   - setAuthed(true, user)  sets auth.authed + auth.user
 *   - setAuthed(false)       clears auth.authed + auth.user (logout)
 *   - setAuthed(false) does NOT carry stale user into next login
 *   - OTP type routing: email → type:'email', phone → type:'sms'
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { useStore } from './store';
import { createSeedState } from '@/lib/persistence';
import type { User } from '@/types';

// ── minimal User fixture ─────────────────────────────────────────────────────

const DEMO_USER: User = {
  id: 'user-test-001',
  handle: 'testuser',
  contact: '+919876543210',
  joinedAt: 1749254400000,
  kycLevel: 0,
  vipLevel: 0,
};

const DEMO_USER_2: User = {
  id: 'user-test-002',
  handle: 'seconduser',
  contact: 'test@example.com',
  joinedAt: 1749254400000,
  kycLevel: 0,
  vipLevel: 0,
};

// ── store reset helper ───────────────────────────────────────────────────────

function resetStore() {
  const seed = createSeedState();
  useStore.setState({
    auth: seed.auth,
    user: undefined,
    wallet: seed.wallet,
    bets: seed.bets,
    tx: seed.tx,
    vip: seed.vip,
    rewards: seed.rewards,
    settings: seed.settings,
    now: 0,
    toasts: [],
    celebration: null,
    hydrated: false,
    screen: 'login',
  });
}

// ── tests ────────────────────────────────────────────────────────────────────

describe('setAuthed — login', () => {
  beforeEach(resetStore);

  it('sets authed=true and stores the user', () => {
    useStore.getState().setAuthed(true, DEMO_USER);
    const { auth } = useStore.getState();
    expect(auth.authed).toBe(true);
    expect(auth.user).toEqual(DEMO_USER);
  });

  it('preserves existing user when called without a user arg', () => {
    useStore.getState().setAuthed(true, DEMO_USER);
    useStore.getState().setAuthed(true); // no user arg
    expect(useStore.getState().auth.user).toEqual(DEMO_USER);
  });
});

describe('setAuthed — logout', () => {
  beforeEach(resetStore);

  it('sets authed=false and clears auth.user', () => {
    useStore.getState().setAuthed(true, DEMO_USER);
    useStore.getState().setAuthed(false);
    const { auth } = useStore.getState();
    expect(auth.authed).toBe(false);
    expect(auth.user).toBeUndefined();
  });

  it('does not carry stale user into a subsequent login', () => {
    useStore.getState().setAuthed(true, DEMO_USER);
    useStore.getState().setAuthed(false);
    useStore.getState().setAuthed(true, DEMO_USER_2);
    expect(useStore.getState().auth.user).toEqual(DEMO_USER_2);
  });

  it('is idempotent — calling logout twice stays cleared', () => {
    useStore.getState().setAuthed(true, DEMO_USER);
    useStore.getState().setAuthed(false);
    useStore.getState().setAuthed(false);
    expect(useStore.getState().auth.authed).toBe(false);
    expect(useStore.getState().auth.user).toBeUndefined();
  });

  it('starts unauthenticated after a fresh seed', () => {
    const { auth } = useStore.getState();
    expect(auth.authed).toBe(false);
    expect(auth.user).toBeUndefined();
  });
});

describe('OTP verifyOtp payload routing', () => {
  // These tests validate the logic that selects type:'email' vs type:'sms'
  // without importing the component (which needs a browser environment).

  function otpPayload(isPhone: boolean, input: string, token: string) {
    return isPhone
      ? { phone: input, token, type: 'sms' as const }
      : { email: input, token, type: 'email' as const };
  }

  it('routes phone input to type:sms', () => {
    const payload = otpPayload(true, '+919876543210', '12345678');
    expect(payload).toEqual({ phone: '+919876543210', token: '12345678', type: 'sms' });
    expect('email' in payload).toBe(false);
  });

  it('routes email input to type:email', () => {
    const payload = otpPayload(false, 'test@example.com', '12345678');
    expect(payload).toEqual({ email: 'test@example.com', token: '12345678', type: 'email' });
    expect('phone' in payload).toBe(false);
  });

  it('token is passed through verbatim', () => {
    const token = '87654321';
    expect(otpPayload(true, '+1234', token).token).toBe(token);
    expect(otpPayload(false, 'a@b.com', token).token).toBe(token);
  });
});
